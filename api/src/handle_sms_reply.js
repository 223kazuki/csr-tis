const db = require('./database');
const { e164PhoneNumber, stripPrefix } = require('./util');
const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});

const phoneToConversationAndSenderID = fromPhone => new Promise((resolve, reject) => {
  const phone = e164PhoneNumber(fromPhone);
  db.execute(db.sqlFromFile('find_conversation_and_sender_id_for_primary_user_phone'), [phone], (err, res) => {
    if (err)
      return reject(err);
    resolve(res.rows[0]);
  });
});

const sendMessage = (conversationID, senderID, text) => new Promise((resolve, reject) => {
  layer.messages.sendTextFromUser(stripPrefix(conversationID), `${senderID}`, text, (err) => {
    if (err)
      return reject(err);
    resolve({ ok: true });
  });
});

const handleSMSReply_twilio = (request) => new Promise((resolve, reject) => {
  const from = request["From"];
  const text = request["Body"];
  phoneToConversationAndSenderID(from).then(
    ({ conversation_id, sender_id }) => sendMessage(conversation_id, sender_id, text),
    err => Promise.reject(err)
  ).then(
    _ => resolve({ ok: true }),
    err => reject(err)
  );
});

module.exports = handleSMSReply_twilio;