const db = require('./database');

const getTeamMembers = (teamID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_users_by_team_id'), [teamID], (err, res) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(res.rows);
  });
});

module.exports = getTeamMembers;