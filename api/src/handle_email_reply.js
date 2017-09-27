const base64 = require('base-64');
const EmailReplyParser = require('emailreplyparser').EmailReplyParser;
const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const db = require('./database');
const { errorWithStatus } = require('./util');

const cleanEmail = parsedEmail => {
  // Taken from node-layer-webhooks-services-sendgrid
  var cleanEmail = parsedEmail;
  if (cleanEmail.indexOf('<') !== -1) cleanEmail = cleanEmail.replace(/^.*<(.*?)>.*$/m, '$1');
  return cleanEmail;
};

const stripEmailPlusSuffix = emailAddress => {
  if (emailAddress.indexOf('+') >= 0)
    return emailAddress.replace(/\+.*?@/, '');
  else
    return emailAddress;
};

// Returns target conversation ID if valid, or throws an exception if not
const toToConversationID = toFull => {
  var to = toFull.split(/\s*,\s*/).filter(recipient => {
    return recipient.indexOf(process.env.SENDGRID_EMAIL_DOMAIN) !== -1;
  })[0];
  to = cleanEmail(to);
  to = to.replace(/@.*$/, '');

  console.log(`Email reply toFull: ${toFull}, to: ${to}, decoded to: ${base64.decode(to)}`);
  var toObj = JSON.parse(base64.decode(to));
  if (toObj.env !== process.env.NODE_ENV)
    throw new Error(`NODE_ENV ${toObj.env} in received message doesn't match system NODE_ENV ${process.env.NODE_ENV}`);
  else if (toObj.host !== process.env.APP_HOST)
    throw new Error(`APP_HOST ${toObj.host} in received message doesn't match system APP_HOST ${process.env.APP_HOST}`);
  else if (!toObj.cid)
    throw new Error(`Malformed toObj ${toObj} doesn't contain a 'cid'`);
  else
    return toObj.cid;
};

const messageText = rawText => {
  // Taken from node-layer-webhooks-services-sendgrid

  // Gmail may do a line wrapping due to our very long TO field;
  // this line wrapping breaks the EmailReplyParser.
  // Unwrap the line in the email that refers to the to field.
  var lines = rawText.split(/\r?\n/);
  // for (var i = 0; i < lines.length; i++) {
  //   if (lines[i].indexOf(to) === 0) {
  //     lines[i - 1] += lines[i];
  //     lines.splice(i, 1);
  //     break;
  //   }
  // }

  // Get the text of the email, with hidden sections stripped out. (signatures, replies, etc..)
  var text = EmailReplyParser.read(lines.join('\n')).fragments.filter(function(fragment) {
    return !fragment.hidden;
  }).map(function(fragment) {
    return fragment.content;
  }).join('\n');

  return text;
}

const handleEmailReply = payload => new Promise((resolve, reject) => {
  var conversationID;
  try {
    conversationID = toToConversationID(payload.to)
  } catch (error) {
    return reject(error);
  }

  const fromEmail = cleanEmail(payload.from).toLowerCase();
  db.execute(db.sqlFromFile('find_user_by_email'), [fromEmail], (err, res) => {
    if (err) return reject(err);
    if (res.rows.length < 1) return reject(errorWithStatus(`No user found for sender email ${fromEmail}`), 400);
    const senderID = `${res.rows[0].id}`;
    const text = messageText(payload.text);

    layer.messages.sendTextFromUser(conversationID, senderID, text, (err) => {
      if (err) return reject(err);
      resolve({ ok: true });
    })
  })
});

module.exports = handleEmailReply;
