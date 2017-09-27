const db = require('./database');
const { errorWithStatus } = require('./util');
const crypto = require('crypto');
const urlsafeBase64 = require('urlsafe-base64');
const mailHelper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

const createAgent = (teamID, firstName, lastName, email) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('create_agent_user'), [email, firstName, lastName, teamID, ['agent']], (err, res) => {
    if (err)
      return reject(err);
    else
      resolve(res.rows[0].id);
  });
});

const createResetToken = (userID) => new Promise((resolve, reject) => {
  // TODO: Deduplicate with send_password_reset_email
  crypto.randomBytes(64, (err, buffer) => {
    if (err) {
      reject(err);
      return;
    }
    const token = `pwreset-${urlsafeBase64.encode(buffer)}`;
    db.execute(db.sqlFromFile('create_session'), [userID, token], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    });
  });
});

const sendInviteEmail = (to, from, nonce) => new Promise((resolve, reject) => {
  // TODO: Deduplicate with send_password_reset_email
  const toEmail = new mailHelper.Email(to);
  const fromEmail = new mailHelper.Email(from);
  const subject = 'Team invitation';
  const content = new mailHelper.Content('text/plain', `Click here to set your password: ${process.env.UI_HOST}/reset/password?nonce=${nonce}`);
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

const inviteTeamMember = (inviter, firstName, lastName, email) => new Promise((resolve, reject) => {
  if (!inviter.roles.includes('admin')) {
    reject(errorWithStatus('Only admins can invite team members', 403));
    return;
  }

  var userID;
  createAgent(inviter.team_id, firstName, lastName, email).then(
    id => {
      userID = id;
      return createResetToken(id)
    },
    err => Promise.reject(err)
  ).then(
    nonce => sendInviteEmail(email, inviter.email, nonce),
    err => Promise.reject(err)
  ).then(
    _ => resolve({ id: userID }),
    err => reject(err)
  );
});

module.exports = inviteTeamMember;