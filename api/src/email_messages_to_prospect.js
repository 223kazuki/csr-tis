const fs = require('fs');
const base64 = require('base-64');
const LayerAPI = require('layer-api');
const handlebars = require('handlebars');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const mailHelper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
const { errorWithStatus, stripPrefix, addPrefix } = require('./util');
const { authenticatedLinkToConversation } = require('./links');

const db = require('./database');

const getMessageInConversation = (mid, cid) => new Promise((resolve, reject) => {
  layer.messages.get(mid, cid, (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.body);
  });
});

const getPrimaryUser = cid => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_primary_user_for_conversation'), [cid], (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.rows[0]);
  });
});

const emailTemplate = fs.readFileSync('./emails/email_messages_to_prospect/messages-inlined.html', 'utf8');
const handlebarsTemplate = handlebars.compile(emailTemplate);
const messagesContent = (agent, messages, link) => {
  const content = messages.map(msg => msg.parts)
                  .map(parts => parts[0])
                  .map(part => part.body)
                  .join("<br /><br />");
  const firstName = agent.first_name;
  const now = new Date();
  const timestamp = `${now.getMonth() + 1}/${now.getDate()}, ${now.getHours()}:${now.getMinutes()}`;
  const templated = handlebarsTemplate({ firstName, timestamp, content, link });
  return templated.replace('&#x3D;', '=');  // Hack to undo Handlebars escaping
};

const sendEmail = (agent, body, to, replyTo) => new Promise((resolve, reject) => {
  const toEmail = new mailHelper.Email(to);
  const fromEmail = new mailHelper.Email(agent.email);
  const replyToEmail = new mailHelper.Email(replyTo);
  const subject = `${agent.first_name} has sent you a message`;
  const content = new mailHelper.Content('text/html', body);
  const mail = new mailHelper.Mail(fromEmail, subject, toEmail, content);
  mail.setReplyTo(replyToEmail);
  const request = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });
  sendgrid.API(request, (err, resp) => {
    if (err)
      reject(new Error(JSON.stringify(err.response)));
    else
      resolve(resp);
  });
});

const emailMessagesToProspect = (agent, messageIDs, conversationID) => new Promise((resolve, reject) => {
  const messagesPromises = messageIDs.map(mid => getMessageInConversation(mid, conversationID));
  conversationID = addPrefix(conversationID, 'conversations');
  const promises = [getPrimaryUser(conversationID)].concat(messagesPromises);
  Promise.all(promises).then(
    results => {
      const user = results[0];
      authenticatedLinkToConversation(user, conversationID).then(
        link => {
          const messages = results.slice(1);
          const content = messagesContent(agent, messages, link);
          const replyToData = {
            host: process.env.APP_HOST,
            env: process.env.NODE_ENV,
            cid: stripPrefix(conversationID)
          };
          const replyTo = `${base64.encode(JSON.stringify(replyToData))}@${process.env.SENDGRID_EMAIL_DOMAIN}`;
          return sendEmail(agent, content, user.email, replyTo);
        },
        err => Promise.reject(err)
      ).then(
        _ => resolve({ ok: true }),
        error => reject(errorWithStatus(error))
      )
    },
    error => {
      reject(errorWithStatus(error))
    }
  );
});

module.exports = emailMessagesToProspect;