const db = require('./database');
const bcrypt = require('bcrypt');
const { errorWithStatus } = require('./util');

const isValidNonce = (nonce) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_session_invalidated'), [nonce], (err, res) => {
    if (err)
      return reject(err);

    const { invalidated } = res.rows[0];
    resolve(invalidated);
  });
});

const invalidateNonce = (token) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('set_session_invalidated'), [token, true], (err) => {
    if (err)
      reject(err);
    else
      resolve(true);
  });
});

const hashPassword = (password) => new Promise((resolve, reject) => {
  bcrypt.hash(password, 12, (err, hash) => {
    if (err)
      return reject(err);
    else
      resolve(hash);
  });
});

const updateUserPassword = (userSessionToken, passwordHash) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('update_password_for_user_with_session_token'), [userSessionToken, passwordHash], (err) => {
    if (err)
      reject(err);
    else
      resolve(true);
  });
});

const resetPassword = (nonce, newPassword) => new Promise((resolve, reject) => {
  isValidNonce(nonce).then(                   // Validate nonce
    used => {
      if (used) {
        return Promise.reject(errorWithStatus('This link has already been used to reset a password.', 400));
      }
      else {
        return invalidateNonce(nonce);        // Mark nonce as used
      }
    },
    e => Promise.reject(e)
  ).then(
    _ => hashPassword(newPassword),           // Generate new password hash
    e => Promise.reject(e)
  ).then(
    hash => updateUserPassword(nonce, hash),  // Update user row
    e => Promise.reject(e)
  ).then(
    _ => resolve({ ok: true }),
    e => reject(e)
  );
});

module.exports = resetPassword;