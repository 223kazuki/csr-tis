const bcrypt = require('bcrypt');
const db = require('./database');
const { errorWithStatus } = require('./util');
const createSessionForUser = require('./createSessionForUser');
const _ = require('lodash');

const agentAuthenticate = params => new Promise((resolve, reject) => {
  const { email, password } = params;
  db.execute(db.sqlFromFile('find_user_by_email.sql'), [email], (err, res) => {
    const requestError = errorWithStatus('Could not authenticate with provided email and password', 400);
    const record = res.rows[0];
    if (err) {
      reject(errorWithStatus(err));
      return;
    }
    if (!record) {
      reject(requestError);
      return;
    }
    bcrypt.compare(password, record.password_digest, (err, res) => {
      if (err || !res) {
        reject(requestError);
        return;
      }

      createSessionForUser(record, true).then(
        sessionToken => resolve({ token: sessionToken, user: _.omit(record, ['password_digest']) }),
        err => reject(errorWithStatus(err))
      );
    });
  });
});

module.exports = agentAuthenticate;