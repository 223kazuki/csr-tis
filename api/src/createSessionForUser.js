const crypto = require('crypto');
const urlsafeBase64 = require('urlsafe-base64');
const db = require('./database');

const createSession = (userID, sessionToken) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('create_session'), [userID, sessionToken], (err) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(sessionToken);
  });
});

const getExistingSessionToken = (userID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_session_by_user_id'), [userID], (err, res) => {
    if (err) return reject(err);
    const session = res.rows[0];
    if (!session || !session.token)
      return reject(new Error(`No session token found for user ${userID}`));
    else
      resolve(session.token);
  });
});

const createSessionForUser = (user, reuseExistingSession) => new Promise((resolve, reject) => {
  crypto.randomBytes(64, (err, buffer) => {
    if (err) {
      reject(err);
      return;
    }
    const token = urlsafeBase64.encode(buffer);
    const sessionToken = user.email.indexOf('layer.com') > 0 ? `agent-${token}` : `user-${token}`;

    if (!reuseExistingSession) {
      createSession(user.id, sessionToken).then(
        token => resolve(token),
        e => reject(e)
      );
    }
    else {
      getExistingSessionToken(user.id).then(
        token => token,
        e => createSession(user.id, sessionToken)
      ).then(
        token => resolve(token),
        e => reject(e)
      )
    }
  });
});

module.exports = createSessionForUser;