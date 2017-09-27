const database = jest.genMockFromModule('./database');

let mockRows = [];
const __setMockRows = rowsOrError => {
  mockRows = rowsOrError;
}

const execute = jest.fn((sql, args, cb) => {
  if (mockRows instanceof Error)
    cb(mockRows, null);
  else
    cb(null, { rows: mockRows });
});

const __setExecute = executeFn => {
  database.execute = jest.fn(executeFn);
}

database.__setMockRows = __setMockRows;
database.execute = execute;
database.__setExecute = __setExecute;
database.__mockedExecute = execute;
database.__resetMockExecute = () => database.execute = execute;
database.sqlFromFile = sqlFileName => sqlFileName;

module.exports = database;