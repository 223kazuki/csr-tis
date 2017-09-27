const db = require('./database');

const getMessageMetadata = messageID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_metadata_by_message_id'), [messageID], (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.rows[0] ? res.rows[0].metadata : {});
  });
});

module.exports = getMessageMetadata;