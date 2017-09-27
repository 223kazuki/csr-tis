const db = require('./database');
const _ = require('lodash');

const setTeamRole = (user, roleName, enabled) => new Promise((resolve, reject) => {
  let newRoles = _.clone(user.roles);
  if (!enabled || enabled === 'false')
    _.remove(newRoles, role => role === roleName);
  else
    newRoles.push(roleName);
  db.execute(db.sqlFromFile('update_roles_for_user'), [user.id, _.uniq(newRoles)], (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res.rows);
  });
});

module.exports = setTeamRole;