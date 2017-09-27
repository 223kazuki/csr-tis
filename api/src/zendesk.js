const qs = require('querystring');
const request = require('request');
const db = require('./database');
const { errorWithStatus } = require('./util');

const callbackEndpoint = () => `${process.env['APP_HOST']}/zendesk/cb`;

const loginURL = agentID => {
  const query = {
    response_type: 'code',
    client_id: process.env['ZENDESK_IDENTIFIER'],
    redirect_uri: callbackEndpoint(),
    scope: 'read write',
    state: agentID
  };
  return `https://layer.zendesk.com/oauth/authorizations/new?${qs.stringify(query)}`;
};

const getAccessToken = authCode => new Promise((resolve, reject) => {
  const body = {
    grant_type: 'authorization_code',
    code: authCode,
    client_id: process.env['ZENDESK_IDENTIFIER'],
    client_secret: process.env['ZENDESK_SECRET'],
    redirect_uri: callbackEndpoint(),
    scope: 'read'
  };
  request.post({url: 'https://layer.zendesk.com/oauth/tokens', form: body}, (err, _, body) => {
    if (err) return reject(err)
    const resp = (typeof body === 'string') ? JSON.parse(body) : body;
    if (resp.error)
      reject(resp)
    else
      resolve(resp)
  });
});

const saveAccessToken = (agentID, accessToken) => new Promise((resolve, reject) => {
  const metadata = {
    type: 'bearer',
    scope: 'read write'
  };
  db.execute(db.sqlFromFile('upsert_oauth_token'), [agentID, 'zendesk', accessToken, null, metadata], (err) => {
    if (err)
      reject(err);
    else
      resolve({ ok: true })
  });
});

const zendeskUserIDForCSRUserID = (userID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_integration_id_for_service_for_user'), [userID, 'zendesk'], (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.rows[0] ? res.rows[0].remote_id : null);
  });
});

const saveZendeskUserIDForCSRUser = (user, remoteID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('upsert_integration_id'), [user.id, 'zendesk', remoteID, null], (err) => {
    if (err)
      reject(err)
    else
      resolve(remoteID);
  });
});

const findZendeskUserIDForCSRUser = (agentID, user) => new Promise((resolve, reject) => {
  const userEmail = user.email;
  db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'zendesk'], (err, res) => {
    if (err) {
      reject(err);
      return;
    }
    if (!res.rows[0] || !res.rows[0].access_token) {
      reject(errorWithStatus(`No Zendesk credentials for agent ${agentID}. Have you connected Zendesk?`, 400));
      return;
    }
    const bearerToken = res.rows[0].access_token;
    const options = {
      url: `https://layer.zendesk.com/api/v2/users/search.json?query=${userEmail}`,
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    };
    request.get(options, (err, xhr, body) => {
      if (err) {
        return reject(err);
      }
      else if (xhr.statusCode === 200) {
        const res = JSON.parse(body);
        // https://developer.zendesk.com/rest_api/docs/core/users#search-users
        const users = res.users;
        if (users.length < 1)
          return reject(errorWithStatus(`No Zendesk user found for ${userEmail}`, 400));
        else {
          const remoteID = users[0].id;
          saveZendeskUserIDForCSRUser(user, remoteID).then(
            remoteID => resolve(remoteID),
            _ => resolve(remoteID)  // Database error doesn't matter here; it'll retry on next request
          )
        }
      }
      else {
        return reject(errorWithStatus(body, 500))
      }
    });
  });
});

const ticketsForZendeskUserID = (agentID, zdUserID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'zendesk'], (err, res) => {
    if (err) {
      return reject(err);
    }
    const bearerToken = res.rows[0].access_token;
    const options = {
      url: `https://layer.zendesk.com/api/v2/users/${zdUserID}/tickets/requested.json?sort_by=created_at&sort_order=desc`,
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    };
    request.get(options, (err, xhr, body) => {
      if (err) {
        return reject(err);
      }
      else if (xhr.statusCode === 200) {
        const res = JSON.parse(body);
        resolve(res);
      }
      else {
        return reject(errorWithStatus(body, 500));
      }
    })
  });
});

const ticketsForUser = (agentID, userID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_user_by_id'), [userID], (err, res) => {
    if (err) {
      return reject(err)
    }
    const user = res.rows[0];
    zendeskUserIDForCSRUserID(userID).then(
      zdID => {
        if (!zdID)
          return findZendeskUserIDForCSRUser(agentID, user);
        else
          return Promise.resolve(zdID);
      },
      err => Promise.reject(err)
    ).then(
      zdID => {
        return ticketsForZendeskUserID(agentID, zdID)
      },
      err => Promise.reject(err)
    ).then(
      results => {
        resolve(results)
      },
      error => reject(error)
    );
  });
});

module.exports = {
  loginURL,
  getAccessToken,
  saveAccessToken,
  ticketsForUser
};