const qs = require('querystring');
const request = require('request');
const db = require('./database');
const { errorWithStatus, stripPrefix } = require('./util');

const API_HOST = 'https://na11.salesforce.com';
const API_BASE = `${API_HOST}/services/data/v38.0`;

const callbackEndpoint = () => `${process.env['APP_HOST']}/salesforce/cb`;
const loginURL = agentID => {
  const query = {
    response_type: 'code',
    client_id: process.env['SALESFORCE_KEY'],
    redirect_uri: callbackEndpoint(),
    display: 'popup',
    state: agentID
  };
  console.log(qs.stringify(query));
  return `https://login.salesforce.com/services/oauth2/authorize?${qs.stringify(query)}`;
};

const getAccessToken = authCode => new Promise((resolve, reject) => {
  const body = {
    grant_type: 'authorization_code',
    client_id: process.env['SALESFORCE_KEY'],
    client_secret: process.env['SALESFORCE_SECRET'],
    redirect_uri: callbackEndpoint(),
    code: authCode
  };
  request.post({url: 'https://login.salesforce.com/services/oauth2/token', form: body}, (err, _, body) => {
    if (err) return reject(err)
    const resp = (typeof body === 'string') ? JSON.parse(body) : body;
    if (resp.error)
      reject(resp)
    else
      resolve(resp)
  });
});

const saveAccessToken = (agentID, accessToken, refreshToken) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('upsert_oauth_token'), [agentID, 'salesforce', accessToken, refreshToken, null], (err) => {
    if (err)
      reject(err);
    else
      resolve({ ok: true })
  });
});

// TODO: Needs tests
const refreshAccessToken = agentID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'salesforce'], (err, res) => {
    if (err) return reject(err);
    if (res.rows.length < 1) return reject(errorWithStatus('No existing OAuth tokens found for agent ID ' + agentID, 400));

    const refreshToken = res.rows[0]['refresh_token'];
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env['SALESFORCE_KEY'],
      client_secret: process.env['SALESFORCE_SECRET']
    };
    request.post({url: 'https://login.salesforce.com/services/oauth2/token', form: body}, (err, _, body) => {
      if (err) return reject(err);
      const resp = (typeof body === 'string') ? JSON.parse(body) : body;
      if (resp.error) {
        // If error is "expired access/refresh token", this could mean the agent has too many refresh tokens out there
        // http://salesforce.stackexchange.com/questions/65590/what-causes-a-connected-apps-refresh-token-to-expire
        // TODO: Handle this case
        const e = new Error(resp.error_description);
        e.name = resp.error;
        return reject(e);
      }

      const { access_token } = resp;
      saveAccessToken(agentID, access_token, refreshToken).then(
        s => resolve(s),
        e => reject(e)
      );
    });
  });
});

// TODO: Needs tests
const makeAPIRequest = (agentID, pathOrOptions, cb) => {
  const path = typeof pathOrOptions === 'string' ? pathOrOptions : pathOrOptions.path;
  const method = typeof pathOrOptions === 'object' ? pathOrOptions.method : 'GET';
  const headers = pathOrOptions.headers || {};
  const payload = pathOrOptions.payload || {};
  db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'salesforce'], (err, res) => {
    if (err) return cb(err);
    if (res.rows.length < 1) return cb(errorWithStatus('No existing OAuth tokens found for agent ID ' + agentID, 400));
    const url = `${API_BASE}${path}`;
    const oauthToken = res.rows[0]['access_token'];
    const requestOptions = {
      url,
      method,
      headers: Object.assign(headers, { 'Authorization': `Bearer ${oauthToken}` })
    };
    if (method === 'POST' || method === 'PATCH')
      requestOptions.json = payload;
    //console.log("payload: " + JSON.stringify(requestOptions));
    if (path === '/sobjects/Lead') {
      if (!payload.lastName || !payload.company) {
        return cb(new Error('Please include all required fields: Last Name, Email, Company'));
      }
    }
    request(requestOptions, (_, response, body) => {
      var parsedBody;
      if (response.statusCode === 401) {
        try {
          if (typeof response.body === 'string')
            parsedBody = JSON.parse(response.body)[0];
          else
            parsedBody = response.body[0];
        } catch (parseErr) {
          console.log("response: " + JSON.stringify(response));
          return cb(parseErr);
        } 
        if (parsedBody.errorCode === 'INVALID_SESSION_ID') {  // OAuth token expired
          refreshAccessToken(agentID).then(
            _ => makeAPIRequest(agentID, path, cb),  // Try again
            e => {
              cb(e)
            }
          )
        }
        else {
          return cb(errorWithStatus(`Unrecognized error code for 401: ${parsedBody.errorCode}`));
        }
      }
      else if (response.statusCode === 200 || response.statusCode === 201) {
        return cb(null, body);
      }
      else {
        return cb(new Error(`Unrecognized response: ${JSON.stringify(response)}`));
      }
    });
  });
};

const executeQuery = (agentID, queryString) => new Promise((resolve, reject) => {
  const url = `/parameterizedSearch/?q=${queryString}`;
  makeAPIRequest(agentID, url, (err, body) => {
    if (err) return reject(err);
    // TODO: Handle multi-page results
    var parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      return reject(parseError);
    }
    resolve(parsedBody.searchRecords);
  });
});

const createLead = (agentID, leadFields) => new Promise((resolve, reject) => {
  const path = '/sobjects/Lead';
  db.execute('SELECT user_id FROM lead_users WHERE lead_id=$1', [ leadFields['id'] ], (err, res) => {
    db.execute('SELECT first_name, last_name, email FROM users WHERE id=$1', [ res.rows[0].user_id], (error, user_body) => {
      db.execute('SELECT id from conversations WHERE participants[2]=$1', [ res.rows[0].user_id ], (error2, conv_body) => {
        if (error)
          reject(error);
        else {
          // TODO: add remaining problematic fields
          const sfFields = {
            'FirstName': user_body.rows[0].first_name,
            'LastName': user_body.rows[0].last_name, 
            'email': user_body.rows[0].email,
            'phone': leadFields['phone'],
            'company': leadFields['company'],
            'status': leadFields['status'] || 'open',
            'LeadSource': leadFields['LeadSource'],
            'industry': leadFields['industry'],
            'Details_Notes__c': `${process.env['UI_HOST']}/c/${stripPrefix(conv_body.rows[0].id)}`,
            //'Employee_Size__c': leadFields['employees'],
            'Department__c': leadFields['department']
          }
          // TODO: make this data a JSON package with first name last name and remainder of good data. Maybe only partially for now
          const data = 
          makeAPIRequest(agentID, {
            path: path,
            method: 'POST',
            payload: sfFields

          }, (err, body) => {
            console.log('Final data: ' + JSON.stringify(sfFields));
            //console.log("response: " + body.id);
            if (err) return reject(err);
            var parsedBody = body;
            if (typeof body === 'string') {
              try {
                parsedBody = JSON.parse(body);
              } catch (parseError) {
                return reject(parseError);
              }
            }
            if (!parsedBody.success)
              return reject(parsedBody);
            else {
              db.execute('UPDATE leads SET salesforce_id=$1 WHERE id=$2', [ body.id, leadFields['id'] ], (err, res) => {
                console.log("Finished updating local db, " + parsedBody);
                if (error)
                  reject(error)
                else
                  resolve(parsedBody);
              })
            }
          });
        }
      });
    });
  });
})

module.exports = {
  loginURL,
  getAccessToken,
  saveAccessToken,
  refreshAccessToken,
  makeAPIRequest,
  executeQuery,
  createLead
};