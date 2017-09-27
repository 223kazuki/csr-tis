/******************** Usage ********************
 `npm run seed <filename>`
   <filename> can either be an absolute path
    or the name of a file in the seeds/ dir
 `npm run seed`
   Will run all SQLs in seeds/ dir
***********************************************/

if (process.env.NODE_ENV !== 'production')
  require('dotenv').config({path: '../.env'});
const pg = require('pg').native;
const fs = require('fs');
const path = require('path');

const thisFilename = process.argv[1];
const seedsDirPath = path.resolve(thisFilename, '../seeds');

// Copied from layer-webhooks-listener/src/database for now
const PGClient = pg.Client;
const client = process.env.NODE_ENV === 'production' ? new PGClient(process.env.DATABASE_URL) : new PGClient();
client.connect();

const execute = (sql, args) => new Promise((resolve, reject) => {
  client.query(sql, args, (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res);
  });
});

var filenameArg = process.argv[2];
if (filenameArg) {
  if (filenameArg.indexOf('.sql') < 1)
    filenameArg = `${filenameArg}.sql`;
  if (!path.isAbsolute(filenameArg))
    filenameArg = path.resolve(seedsDirPath, filenameArg);

  execute(fs.readFileSync(filenameArg, 'utf8'), []).then(
    (_) => {
      console.log(`Executed ${filenameArg} successfully`)
      return Promise.resolve();
    },
    (err) => {
      console.error(`Error executing ${filenameArg}: ${err}`)
      return Promise.resolve();
    }
  ).then(
    (_) => client.end()
  );
}
else {
  // Run all seeds
  const filenames = fs.readdirSync(seedsDirPath).map(fn => path.resolve(seedsDirPath, fn));
  const promises = filenames.map(fn => execute(fs.readFileSync(fn, 'utf8'), []));
  Promise.all(promises).then(
    (_) => {
      console.log(`Ran all seeds successfully`);
      return Promise.resolve()
    },
    (err) => {
      console.error(`Error running seed: ${err}`);
      return Promise.resolve()
    }
  ).then(
    (_) => client.end()
  );
}