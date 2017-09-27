const db = require('./database');

const filteredConversations = agentID => new Promise((resolve, reject) => {
  if (typeof agentID !== 'string')
    agentID = `${agentID}`;
  const unclaimedPromise = new Promise((resolve, reject) => {
    db.execute(db.sqlFromFile('find_unassigned_conversations'), [], (err, res) => {
      if (err)
        return reject(err);
      resolve({ unclaimed: res.rows });
    });
  });
  const activePromise = new Promise((resolve, reject) => {
    db.execute(db.sqlFromFile('find_active_conversations'), [agentID], (err, res) => {
      if (err)
        return reject(err);
      const rows = res.rows;
      const unanswered = rows.filter(conversation => {
        const lastMessage = conversation.last_message;
        if (!lastMessage)
          return false;
        return lastMessage.sender.user_id !== agentID;
      });
      const active = rows.filter(conversation => {
        const lastMessage = conversation.last_message;
        if (!lastMessage)
          return true;
        return lastMessage.sender.user_id === agentID
      });
      resolve({ my_unanswered: unanswered, my_active: active });
    });
  });
  const archivedPromise = new Promise((resolve, reject) => {
    db.execute(db.sqlFromFile('find_archived_conversations'), [agentID], (err, res) => {
      if (err)
        return reject(err);
      resolve({ archived: res.rows });
    });
  });

  Promise.all([unclaimedPromise, activePromise, archivedPromise]).then(
    sets => resolve(sets.reduce((aggregate, nextSet) => Object.assign({}, aggregate, nextSet), {})),
    err => reject(err)
  );
});

module.exports = filteredConversations;