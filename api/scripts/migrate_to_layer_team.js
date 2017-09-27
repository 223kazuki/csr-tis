require('dotenv').config({path: '../.env'});

const db = require('../src/database');
const fs = require('fs');

const createLayerTeam = () => new Promise((resolve, reject) => {
  db.execute(
    fs.readFileSync('./create_team.sql', 'utf8'),
    [process.env.LAYER_APP_ID, process.env.LAYER_SAPI_TOKEN],
    (err, res) => {
      if (err)
        reject(err)
      else
        resolve(res.rows[0]);
    }
  );
});

const assignLayerUsersToTeam = (teamID) => new Promise((resolve, reject) => {
  db.execute(
    fs.readFileSync('./assign_layer_user_to_team.sql', 'utf8'),
    [teamID, ['agent']],
    (err, res) => {
      if (err)
        reject(err);
      else
        resolve(res.rows[0]);
    }
  );
});

const execute = () => new Promise((resolve, reject) => {
  // https://github.com/brianc/node-postgres/wiki/Transactions
  const rollback = (client, done) => {
    client.query('ROLLBACK', (err) => done(err));
  };
  db.pool.connect((err, client, done) => {
    if (err)
      throw err;
    client.query('BEGIN', (err) => {
      if (err) {
        rollback(client, done);
        reject(err);
      }

      process.nextTick(() => {
        createLayerTeam().then(
          team => assignLayerUsersToTeam(team.app_id),
          err => Promise.reject(err)
        ).then(
          _ => client.query('COMMIT', () => {
            done();
            resolve(true);
          }),
          err => {
            rollback(client, done);
            reject(err);
          }
        );
      });
    });
  });
});

execute().then(
  _ => console.log('Success'),
  err => console.log('Error: ' + err)
);