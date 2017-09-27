const db = require('../src/database');

const promisifiedInsert = (tableName, fieldNames, rowTuple) => new Promise((resolve, reject) => {
  const sqlColumnNames = fieldNames.join(', ');
  const sqlValuePlaceholders = fieldNames.map((_, idx) => `$${idx + 1}`).join(', ');
  const sql = `INSERT INTO ${tableName} (${sqlColumnNames}) VALUES (${sqlValuePlaceholders})`;
  db.execute(sql, rowTuple, (err, res) => {
    if (err)
      reject(err);
    else
      resolve(res);
  });
});

module.exports = {
  setTestData: (tableName, fieldNames, rowTuples) => {
    const inserts = rowTuples.map((tuple) => promisifiedInsert(tableName, fieldNames, tuple));
    return (done) => {
      return Promise.all(inserts).then(
        results => done(),
        error => done(error)
      );
    }
  },
  clearTestData: (tableName) => {
    return (done) => {
      db.execute(`TRUNCATE ${tableName}`, [], (err) => {
        if (err) {
          return done(err);
        }
        done();
      });
    }
  }
}