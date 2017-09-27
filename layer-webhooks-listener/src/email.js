const fs = require('fs');
const db = require('./database');

const selectEmailSQL = fs.readFileSync('./src/sql/select_email_for_user_ids.sql', 'utf8');
const getEmailAddressesForIDs = (ids, cb) => {
  const userIDs = (Array.isArray(ids) ? ids : [ids]).map(x => parseInt(x, 10));
  db.execute(selectEmailSQL, userIDs, (err, results) => {
    if (err)
      cb(err);
    else
      cb(results.rows);
  });
}

const getEmailIdentityForUserID = (id, cb) => {
  const userID = parseInt(id, 10);
  if (userID === 1) {  // Hack
    cb({email: 'feifan@layer.com', name: 'Feifan Zhou'});
    return;
  }
  db.execute(db.sqlFromFile('get_user_for_id.sql'), [userID], (err, results) => {
    if (err) {
      cb(err);
      return;
    }
    const user = results.rows[0];
    cb(null, {email: user.email, name: `${user.first_name} ${user.last_name}`});
  });
};

const notificationBodyForMessage = lyrMessage => {
  return lyrMessage.parts[0].body;
};

module.exports = {
  getEmailIdentityForUserID
}