const db = require('./database');

const { errorWithStatus } = require('./util');
const identityToken = require('./identity_token');

const layerAuthenticate = params => new Promise((resolve, reject) => {
  const { session_token, nonce } = params;
  db.execute(db.sqlFromFile('find_user_by_session_token.sql'), [session_token], (err, res) => {
    const record = res.rows[0];
    if (err) {
      reject(err);
      return;
    }
    if (!record) {
      reject(errorWithStatus(`No user found for session token ${session_token}`, 400));
      return;
    }
    resolve({identity_token: identityToken(record, nonce)});
  });
});

module.exports = layerAuthenticate;