const pg = require('pg').native;
const fs = require('fs');
const url = require('url');

// Yes it'll load these env vars automatically
// But better to be explicit and avoid magic loading
var dbConfig;
if (process.env.NODE_ENV !== 'production')
  dbConfig = {
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    max: 10,
    idleTimeoutMillis: 30000
  };
else {
  const dbParams = url.parse(process.env.DATABASE_URL);
  const dbAuth = dbParams.auth.split(':');
  dbConfig = {
    user: dbAuth[0],
    password: dbAuth[1],
    host: dbParams.hostname,
    port: dbParams.port,
    database: dbParams.pathname.split('/')[1],
    ssl: true,
    idleTimeoutMillis: 30000
  }
}

const pool = new pg.Pool(dbConfig);

const execute = function(sql, args, callback) {
  const _execute = (cb) => {
    pool.connect((err, client, done) => {
      if (err) {
        cb(err, null);
        return;
      }
      client.query(sql, args, (err, result) => {
        done();
        if (err)
          cb(err, null);
        else
          cb(null, result);
      });
    });
  };
  if (callback)
    _execute(callback);
  else
    return new Promise((resolve, reject) => {
      _execute((err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
};

const sqlFromFile = function(filename) {
  if (filename.indexOf('.sql') < 0)
    filename = `${filename}.sql`;
  return fs.readFileSync(`./src/sql/${filename}`, 'utf8');
};

module.exports = {
  pool,
  execute,
  sqlFromFile
};