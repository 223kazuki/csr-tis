const crypto = require('crypto');
const urlsafeBase64 = require('urlsafe-base64');
const db = require('./database');
const mailHelper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

const dispatchEmail = (email, nonce) => new Promise((resolve, reject) => {
  const toEmail = new mailHelper.Email(email);
  const fromEmail = new mailHelper.Email('noreply@dom.layer.com');
  const subject = 'DOM password reset email';
  const content = new mailHelper.Content('text/plain', `${process.env.UI_HOST}/reset/password?nonce=${nonce}`);
  const mail = new mailHelper.Mail(fromEmail, subject, toEmail, content);
  const request = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });
  sendgrid.API(request, (err) => {
    if (err) {
      reject(new Error(JSON.stringify(err.response)));
      return;
    }
    resolve({ ok: true });
  });
});

const sendPasswordResetEmail = (email) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_user_by_email'), [email], (err, res) => {
    if (err) {
      reject(err);
      return;
    }
    const user = res.rows[0];
    if (!user) {
      reject(new Error('No user found for email ' + email));
      return;
    }

    crypto.randomBytes(64, (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      const token = `pwreset-${urlsafeBase64.encode(buffer)}`;
      db.execute(db.sqlFromFile('create_session'), [user.id, token], (err) => {
        if (err) {
          reject(err);
          return;
        }
        dispatchEmail(email, token).then(
          _ => resolve({ ok: true }),
          err => reject(err)
        );
      });
    });
  });
});

module.exports = sendPasswordResetEmail;