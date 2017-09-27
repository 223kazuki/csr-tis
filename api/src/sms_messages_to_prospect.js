const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const db = require('./database');
const { errorWithStatus, addPrefix } = require('./util');
const Twilio = require('twilio');
const { authenticatedLinkToConversation, shortenLink } = require('./links');

const getMessageInConversation = (mid, cid) => new Promise((resolve, reject) => {
  layer.messages.get(mid, cid, (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.body);
  });
});

const getPrimaryUser = cid => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_primary_lead_for_conversation'), [cid], (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.rows[0]);
  });
});

const layerMessageToText = layerMessage => {
  return layerMessage.parts[0].body;
}

const smsMessagesToProspect_twilio = (_, messagesIDs, conversationID) => new Promise((resolve, reject) => {
  getPrimaryUser(conversationID).then(
    user => {
      const phone = user.phone;
      if (!phone || phone.length < 1)
        return Promise.reject(errorWithStatus("Recipient doesn't have a phone number", 400));
      else
        return Promise.all([Promise.resolve(user)].concat(authenticatedLinkToConversation(user, conversationID)));
    },
    err => Promise.reject(err)
  ).then(
    ([user, conversationLink]) => {
      return Promise.all([Promise.resolve(user), conversationLink, shortenLink(conversationLink)]);
    },
    err => Promise.reject(err)
  ).then(
    ([user, fullLink, shortRes]) => {
      const messagesPromises = messagesIDs.map(mid => getMessageInConversation(mid, addPrefix(conversationID, 'conversations')));
      const link = shortRes.data.url || fullLink;
      const allPromises = [Promise.resolve(user), Promise.resolve(link)].concat(messagesPromises);
      return Promise.all(allPromises);
    },
    err => Promise.reject(err)
  ).then(
    ([user, link, ...messages]) => {
      let smsText = messages.map(layerMessageToText).join("\n\n");
      if (typeof link === 'string') {
        const shorterLink = link.replace(/http:\/\/|https:\/\//, '');
        smsText = smsText + "\n\n" + shorterLink;
      }
      const twilio = new Twilio.RestClient(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      const sms = {
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone,
        body: smsText
      };
      return new Promise((resolve, reject) => {
        twilio.messages.create(sms, (err, message) => {
          if (err) {
            const twilioErr = `Twilio error ${err.code}: ${err.message}`;
            return reject(twilioErr);
          }
          else
            resolve(message);
        });
      });
    },
    err => Promise.reject(err)
  ).then(
    message => resolve({ ok: true, twilio_message_id: message.sid }),
    err => reject(errorWithStatus(err))
  );
});

module.exports = smsMessagesToProspect_twilio;