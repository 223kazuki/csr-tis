const bcrypt = require('bcrypt');
const db = require('./database');

const registerAgent = (email, password, firstName, lastName) => new Promise((resolve, reject) => {
  bcrypt.hash(password, 12, (_, hash) => {
    db.execute(db.sqlFromFile('create_user'), [email.toLowerCase(), hash, firstName, lastName], (err, res) => {
      if (err)
        reject(err);
      else
        resolve(res.rows[0].id);  // Returns inserted ID
    });
  });
});

module.exports = registerAgent;