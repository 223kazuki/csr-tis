const db = require('./database');
const _ = require('lodash');

const teamMembers = (teamID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_team_members'), [teamID], (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.rows.map(user => {
        const withoutPassword = _.omit(user, 'password_digest');
        if (!user.password_digest || user.password_digest.length < 1)
          withoutPassword.pending = true;
        return withoutPassword;
      }));
  });
});

module.exports = teamMembers;