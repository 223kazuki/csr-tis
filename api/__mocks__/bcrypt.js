const bcrypt = jest.genMockFromModule('bcrypt');

const hash = jest.fn((password, rounds, cb) => {
  cb(null, 'bcrypt-hash-fixture');
});

bcrypt.hash = hash;
module.exports = bcrypt;