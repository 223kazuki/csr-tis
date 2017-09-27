const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const mailHelper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
const { errorWithStatus, addPrefix } = require('./util');
const db = require('./database');

const getMessageTextOpened = conversationID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_primary_user_for_conversation'), [addPrefix(conversationID, 'conversations')], (err, res) => {
    if (err) return reject(err);
    const user = res.rows[0];
    if (user)
      resolve(`${user.first_name} ${user.last_name} opened your conversation with them: \n ${process.env.UI_HOST}/c/${conversationID}`);
    else
      reject(new Error(`No primary user found for conversation ${conversationID}`));
  });
});

const getMessageTextSent = conversationID => new Promise((resolve, reject) => {
  const hackyBuffer = process.env.NODE_ENV === 'test' ? 0 : 2000;  // Buffer to help message propagate to Layer
  setTimeout(function() {
    const params = { page_size: 5 };
    layer.messages.getAll(conversationID, params, function(err, res) {
      if (err) return reject(err);
      const messages = res.body;
      const messageText = messages.reverse().map(msg => msg.parts[0].body).join("\n");
      resolve(`Last 5 messages:\n\n${messageText}`);
    });
  }, hackyBuffer);
});

const emailAgentOnProspectAction = (conversationID, action) => new Promise((resolve, reject) => {
  const fullConversationID = addPrefix(conversationID, 'conversations');
  var textFunction, subject;
  if (action === 'opened') {
    textFunction = getMessageTextOpened;
    subject = 'Lead opened conversation';
  }
  else if (action === 'sent') {
    textFunction = getMessageTextSent;
    subject = 'Lead sent you a message';
  }
  else {
    reject(errorWithStatus(`Unsupported action ${action}`), 400);
    return;
  }
  db.execute(db.sqlFromFile('get_owner_for_conversation'), [fullConversationID], (err, res) => {
    if (err) return reject(err);
    textFunction(conversationID).then(
      messageText => {
        const ownerEmail = res.rows[0].email;
        const toEmail = new mailHelper.Email(ownerEmail);
        const fromEmail = new mailHelper.Email('noreply@dom.layer.com');
        const content = new mailHelper.Content('text/plain', messageText);
        const mail = new mailHelper.Mail(fromEmail, subject, toEmail, content);
        const request = sendgrid.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON()
        });
        sendgrid.API(request, (err) => {
          if (err) reject(new Error(JSON.stringify(err.response)));
          else resolve({ ok: true })
        });
      },
      err => reject(err)
    )
  });
});

module.exports = emailAgentOnProspectAction;