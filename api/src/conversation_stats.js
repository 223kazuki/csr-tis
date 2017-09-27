const db = require('./database');
const { errorWithStatus } = require('./util');
const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const eachCons = require('each-cons');
const _ = require('lodash');

const ratio = (agentID, messages) => {
  // Ratio is sent / received
  const sentCount = messages.filter(m => m.sender.user_id === agentID).length;
  const receivedCount = messages.length - sentCount;
  if (receivedCount === 0)
    return 0.0;
  else
    return sentCount / receivedCount;
}

const responseTime = (messages, flipPredicate) => {
  // Precondition: messages[0] is oldest
  // Returns time in seconds
  const pairwise = eachCons(messages, 2);
  var timeSumInSeconds = 0.0;
  var flipCount = 0;
  pairwise.forEach(pair => {
    const first = pair[0];
    const second = pair[1];
    if (flipPredicate(first, second)) {
      const dateDiff = (new Date(second.sent_at)) - (new Date(first.sent_at));
      if (!_.isNaN(dateDiff)) {
        timeSumInSeconds += (dateDiff / 1000);
        flipCount++;
      }
    }
  });
  return timeSumInSeconds > 0 ? (timeSumInSeconds / flipCount) : timeSumInSeconds;
}

const leadResponseTime = (agentID, messages) => {
  // Average amount of time where message sender flips from agent to lead
  return responseTime(messages, (first, second) => {
    return first.sender.user_id === agentID && second.sender.user_id !== agentID
  });
}

const agentResponseTime = (agentID, messages) => {
  // Average amount of time where message sender flips from lead to agent
  return responseTime(messages, (first, second) => {
    return first.sender.user_id !== agentID && second.sender.user_id === agentID
  });
}

const IGNORE_MESSAGE_TYPES = ['application/email-receipt'];

const conversationStats = (agentID, conversationID) => new Promise((resolve, reject) => {
  if (conversationID.indexOf('layer') < 0)
    conversationID = `layer:///conversations/${conversationID}`;
  if (typeof agentID !== 'string')
    agentID = `${agentID}`;
  db.execute(db.sqlFromFile('get_conversation_by_id'), [conversationID], (err, res) => {
    if (err) {
      return reject(err);
    }
    else if (res.rows.length < 1) {
      return reject(errorWithStatus(`No conversation exists in database with ID ${conversationID}`), 400);
    }
    const conversation = res.rows[0];

    layer.messages.getAll(conversationID, {page_size: 100}, (err, res) => {
      if (err) {
        return reject(err);
      }
      // messages[0] is oldest. Need to reverse for response times.
      const messages = _.reverse(res.body).filter(msg => {
        const mimeType = msg.parts[0].mime_type;
        return !IGNORE_MESSAGE_TYPES.includes(mimeType);
      });

      const hardcodedStats = {
        createdAt: conversation.created_at.toJSON(),
        ratio: ratio(agentID, messages),
        leadResponseTime: leadResponseTime(agentID, messages) / 60,
        agentResponseTime: agentResponseTime(agentID, messages) / 60
      };
      resolve(hardcodedStats);
    });
  });
});

module.exports = conversationStats;