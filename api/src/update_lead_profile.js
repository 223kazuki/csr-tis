const _ = require('lodash');
const db = require('./database');
const { errorWithStatus, e164PhoneNumber } = require('./util');
const sf = require('./salesforce');
const request = require('request');
const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});

var editableProfileFields = [
  'status', 'source', 'phone', 'company', 'segment', 'industry', 'employees', 'department', 'role', 'address', 'city', 'state', 'zip', 'project_timeline', 'project_details', 'name', 'email'
];
const updateLeadProfile = (agentID, leadID, params) => new Promise((resolve, reject) => {
  if (params.phone)  // Normalize phone number
    params.phone = e164PhoneNumber(params.phone);
  // TODO: Better handle this logging
  const unallowedKeys = _.difference(Object.keys(params), editableProfileFields);
  // Update users database with first and last name
  if (params.name) {
    const splitNames = params.name.split(' ');
    const firstName = splitNames[0];
    const lastName = splitNames[1];
    const nameParams = [parseInt(leadID) ,firstName, lastName];
    // Update Layer identity
    // Ignoring return value; just let this happen asynchronously
    db.execute("SELECT user_id FROM lead_users WHERE lead_id=$1", [leadID]).then(
      res => {
        const userID = res.rows[0].user_id;
        return layer.identities.editAsync(userID, { first_name: firstName, last_name: lastName, display_name: params.name });
      },
      err => console.log(`Error getting user ID from lead ID ${leadID} while updating Layer identity name`)
    );
    db.execute("UPDATE users SET first_name=$2, last_name=$3 WHERE id=(SELECT user_id from lead_users WHERE lead_id=$1)", nameParams, (err, result) => {
      if (err)
        reject (err);
      else if (result.rowCount < 1)
        reject(errorWithStatus(`No user found for leadID ${leadID}`, 400));
      else
        resolve({
          lead_id: leadID,
          unallowed_keys: unallowedKeys.length > 0 ? unallowedKeys : undefined });
    });
  }
  // Update users database with email
  else if (params.email) {
    db.execute("UPDATE users SET email=$2 WHERE id=(SELECT user_id from lead_users WHERE lead_id=$1)", [leadID, params.email], (err, result) => {
      if (err)
        reject (err);
      else if (result.rowCount < 1)
        reject(errorWithStatus(`No user found for leadID ${leadID}`, 400));
      else
        resolve({
          lead_id: leadID,
          unallowed_keys: unallowedKeys.length > 0 ? unallowedKeys : undefined });
    });
  }

  // Update SF Leads

  // Remove name and email
  editableProfileFields = _.filter(editableProfileFields, (field) => field !== 'email');
  editableProfileFields = _.filter(editableProfileFields, (field) => field !== 'name');
  const allowedKeys = _.intersection(Object.keys(params), editableProfileFields);
  console.log("editableLeads: " + editableProfileFields);
  if (allowedKeys.length < 1) {
    // Name or email was already updated above
    // Promise already resolved or rejected
    return;
  }
  const updateKVs = allowedKeys.map((key, idx) => `${key} = $${idx + 1}`);
  const allowedValues = allowedKeys.map(key => params[key]);
  const sqlParams = allowedValues.concat(leadID);
  const leadIDIndex = allowedKeys.length + 1;
  const updateSQL = `UPDATE leads SET ${updateKVs} WHERE id = $${leadIDIndex} RETURNING id;`;
  db.execute(updateSQL, sqlParams, (err, result) => {
    if (err)
      reject(err);
    else if (result.rows.length < 1)
      reject(errorWithStatus(`No lead found for ID ${leadID}`, 400));
    else
      resolve({
        lead_id: result.rows[0].id,
        unallowed_keys: unallowedKeys.length > 0 ? unallowedKeys : undefined });
  });
});

const autofillLeadProfile = (conversationID) => new Promise((resolve, reject) => {
  options = {
    url: `https://api.meya.ai/users/layer:${conversationID}`,
    auth: {
        'user': process.env.MEYA_API_KEY,
        'pass': ''
    }
  };
  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
        console.log(body);
        const parsedBody = JSON.parse(body);
        // Update names and email in USERS
        const name = parsedBody['name'];
        const splitNames = name.split(' ');
        const firstName = splitNames[0];
        const lastName = splitNames[1];
        // update layer identities with name
        db.execute("SELECT participants[2] FROM conversations WHERE id=$1", [`layer:///conversations/${conversationID}`]).then(
          res => {
            const userID = res.rows[0].participants;
            console.log("Here is userID: " + userID);
            return layer.identities.editAsync(userID, { first_name: firstName, last_name: lastName, display_name: name });
          },
          err => console.log(`Error getting user ID from lead ID ${leadID} while updating Layer identity name`)
        );
        const email = parsedBody['email_address'];
        db.execute("UPDATE users SET first_name=$1, last_name=$2, email=$3 WHERE id=(SELECT CAST(participants[2] AS integer) from conversations WHERE id=$4)", [ firstName, lastName, email, `layer:///conversations/${conversationID}` ], (err, res) => {
          if (err)
            reject(err);
        });

        // Update other lead fields
        var phonenum = parsedBody['phone_number'];
        if (phonenum[0] != '+')
          phonenum = '+1' + phonenum;
        const company = parsedBody['company_name'];
        db.execute("UPDATE leads SET phone=$1, company=$2 WHERE id=(SELECT lead_id from lead_users WHERE user_id=(SELECT CAST(participants[2] AS integer) from conversations WHERE id=$3))", [ phonenum, company, `layer:///conversations/${conversationID}` ], (err, res) => {
          if (err)
            reject(err);
        });
    }
    else {
      console.log('response ' + response + 'error: ' + error);
      reject(error);
    }
    resolve(response);
  });
});


module.exports = {updateLeadProfile, autofillLeadProfile};
