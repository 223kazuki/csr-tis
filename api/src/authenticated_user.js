const db = require('./database');
const _ = require('lodash');

const authenticatedUser = sessionToken => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_user_by_session_token'), [sessionToken], (err, res) => {
    if (err)
      reject(err);
    else {
      const user = res.rows[0];
      resolve(user ? _.omit(res.rows[0], 'password_digest') : undefined);
    }
  });
});

module.exports = authenticatedUser;