const request = require('request');
const db = require('./database');
const { errorWithStatus } = require('./util');

const connect = agent => new Promise((resolve, reject) => {
  const options = {
    email: agent.email,
    login_type: 100,
    api_key: process.env['ZOOM_KEY'],
    api_secret: process.env['ZOOM_SECRET']
  };
  request.post({url: 'https://api.zoom.us/v1/user/getbyemail', form: options}, (err, _, body) => {
    if (err) {
      reject(errorWithStatus(err));
    } else {
      const data = JSON.parse(body);
      var zoomHostID = data['id'];
      var zoomToken = data['token'];

      if (zoomHostID === undefined)
        reject(errorWithStatus('Error fetching Zoom host ID.'));
      else if (zoomToken === undefined)
        reject(errorWithStatus('Error fetching Zoom access token.'));
      else {
        var metadata = {
          'zoom_host_id': zoomHostID
        };

        db.execute(db.sqlFromFile('upsert_oauth_token'), [agent.id, 'zoom', zoomToken, null, metadata], (err) => {
          if (err)
            reject(err);
          else
            resolve({ zoomHostID: zoomHostID });
        });
      }
    }
  });
});

const getZoomOptions = agentID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'zoom'], (err, res) => {
    if (err) return reject(err);
    if (res.rows.length < 1) return reject(errorWithStatus('No existing OAuth tokens found for agent ID ' + agentID, 400));

    const metadata = res.rows[0]['metadata'];

    const options = {
      api_key: process.env['ZOOM_KEY'],
      api_secret: process.env['ZOOM_SECRET'],
      host_id: metadata['zoom_host_id'],
      topic: 'Layer Zoom',
      type: 2 // Meeting type: 1 means instant meeting (Only used for host to start it as soon as created). 2 means normal scheduled meeting. 3 means a recurring meeting.
    };

    resolve(options);
  });
});

const createMeeting = (messageID, agentID) => new Promise((resolve, reject) => {
  getZoomOptions(agentID).then(
    results => {
      request.post({url: 'https://api.zoom.us/v1/meeting/create', form: results}, (err, _, body) => {
        if (err) {
          reject(errorWithStatus('Could not create Zoom meeting'), 400);
        }
        else {
          const data = JSON.parse(body);
          var zoomMeetingID = data['id'];
          db.execute(db.sqlFromFile('update_message_metadata'), [messageID, {'zoom': { 'meeting_id':zoomMeetingID}}], (err) => {
            if (err) {
              reject(errorWithStatus('Could not save Zoom message metadata'), 400);
            }
            else
              resolve({ meetingID: zoomMeetingID });
          });
        }
      });
    },
    _ => {
      reject(errorWithStatus('Connect your Zoom account in Settings'), 400);
    }
  );
});

const disconnect = agentID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('delete_oauth_token_for_user_and_service'), [agentID, 'zoom'], (err) => {
    if (err)
      reject(err);
    else {
      resolve();
    }
  });
});

const getAccount = agentID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'zoom'], (err, res) => {
    if (err)
      reject(err);
    else if (res.rows[0] === undefined)
      resolve({ zoomHostID: undefined, connectionStatus: 'disconnected' });
    else {
      const zoomHostID = res.rows[0].metadata['zoom_host_id'];
      resolve({ zoomHostID: zoomHostID, connectionStatus: 'connected' });
    }
  });
});

module.exports = {
  connect,
  createMeeting,
  disconnect,
  getAccount
};