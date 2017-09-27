jest.mock('bcrypt');
const bcrypt = require('bcrypt');
const db = require('../src/database');
const { clearTestData } = require('./test_helper');

const registerAgent = require('../src/register_agent');

describe('registerAgent', () => {
  beforeEach((done) => {
    bcrypt.hash.mockClear();
    clearTestData('users')(done);
  });

  it('returns a Promise', () => {
    expect(registerAgent('_', '_', '_', '_') instanceof Promise).toBeTruthy()
  });
  it('hashes provided password', () => {
    return registerAgent('_', 'password', '_', '_').then(
      _ => {
        const hashCall = bcrypt.hash.mock.calls[0];
        expect(hashCall[0]).toEqual('password');
      }
    )
  });
  it('creates a User record', (done) => {
    return registerAgent('email', 'password', 'fname', 'lname').then(
      _ => {
        db.execute(`SELECT * FROM users WHERE email = $1`, ['email'], (err, res) => {
          if (err) {
            return done(err);
          }
          const user = res.rows[0];
          expect(user.email).toEqual('email');
          expect(user.password_digest).toEqual('bcrypt-hash-fixture');
          expect(user.first_name).toEqual('fname');
          expect(user.last_name).toEqual('lname');
          done();
        });
      }
    )
  })
})