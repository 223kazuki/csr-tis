const db = require('./database');
const createConversationIfNecessary = require('./new_conversation');

const processNewMessage = function(job, done) {
  // TODO: Need to verify that the conversation exists, or create it before updating its last_message
  // https://layer.slack.com/archives/platform/p1479683340003411
  const message = job.data.message;
  const conversationID = message.conversation.id;
  createConversationIfNecessary({ data: { conversation: { id: conversationID }}}, () => {
    const updateArgs = [conversationID, message];
    db.execute(db.sqlFromFile('update_last_message_in_conversation.sql'), updateArgs, (err, _) => {
      if (err)
        console.error(`Error updating last message for conversation ID '${conversationID}': ${err}`);
      done();
    });
  });
};

module.exports = processNewMessage;