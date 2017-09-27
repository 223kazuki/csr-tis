const db = require('./database');

const createConversationIfNecessary = function(job, done) {
  const conversation = job.data.conversation;
  const participants = conversation.participants || [];
  const insertArgs = [conversation.id, participants, conversation.metadata];
  db.execute(db.sqlFromFile('create_conversation_if_necessary.sql'), insertArgs, (err, _) => {
    if (err)
      console.error(`Error inserting conversation ID '${conversation.id}' into database: ${err}`);
    done();
  });
};

module.exports = createConversationIfNecessary;