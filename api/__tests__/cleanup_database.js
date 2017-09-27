const db = require('../src/database');

const tables = [
  'conversations',
  'lead_users',
  'leads',
  'messages_metadata',
  'oauth_tokens',
  'sessions',
  'users'
];

const truncate = (tableName) => new Promise((resolve, reject) => {
  db.execute(`TRUNCATE ${tableName}`, [], (err, res) => {
    if (err) {
      console.log(`Error truncating ${tableName}: ${err}`);
      reject(err);
    }
    resolve();
  });
});

Promise.all(tables.map(tableName => truncate(tableName))).then(
  _ => {
    console.log('Database cleaned successfully');
    process.exit(0);
  },
  err => {
    console.log('Cleaning database failed');
    process.exit(1);
  }
);