const bcrypt = require('bcrypt');
const db = require('./database');
const { errorWithStatus } = require('./util');
const identityToken = require('./identity_token');

// Ported from https://github.com/layerhq/instastart-identity-provider/blob/5af05e7986/app/controllers/authentication_controller.rb

const extractParams = (params) => {
  let { email, password } = params;
  if (!email || !password)  {
    const user = params.user;
    email = user.email;
    password = user.password;
  }
  return { email, password };
}

const identityProviderAuthenticate = (params) => new Promise((resolve, reject) => {
  const { email, password } = extractParams(params);
  const nonce = params.nonce;
  db.execute(db.sqlFromFile('find_user_by_email.sql'), [email], (err, res) => {
    const error = errorWithStatus('Authentication failed: verify your credentials and try again.', 401);
    const record = res.rows[0];
    if (err) {
      reject(errorWithStatus(err));
      return;
    }
    if (!record) {
      reject(error);
      return;
    }
    bcrypt.compare(password, record.password_digest, (err, res) => {
      if (err || !res) {
        reject(error);
        return;
      }
      const token = identityToken(record, nonce);
      resolve({ identity_token: token, layer_identity_token: token });
    });
  });
});

module.exports = identityProviderAuthenticate;