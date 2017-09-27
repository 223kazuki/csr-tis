const teamIDFixture = 'test-team';
const adminIDFixture = 1000000;
const adminEmailFixture = 'admin@test.com';
const adminRolesFixture = ['agent', 'admin'];
const adminFixture = { id: adminIDFixture, roles: adminRolesFixture };
const agentIDFixture = 1000001;
const agentEmailFixture = 'agent@test.com';
const agentRolesFixture = ['agent'];
const agentFixture = { id: agentIDFixture, roles: agentRolesFixture };

const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');
const setTeamRole = require('../src/set_team_role');

describe('setTeamRole', () => {
  const clearDatabase = (done) => {
    clearTestData('users')(done);
  };
  beforeEach((done) => {
    clearDatabase(() => {
      setTestData('users', 
        ['id', 'email', 'team_id', 'roles'],
        [[adminIDFixture, adminEmailFixture, teamIDFixture, adminRolesFixture],
         [agentIDFixture, agentEmailFixture, teamIDFixture, agentRolesFixture]])(done);
    });
  });

  it('returns a Promise', () => {
    expect(setTeamRole(agentFixture, 'admin', true) instanceof Promise).toBeTruthy();
  });

  it('allows a role to be added', (done) => {
    return setTeamRole(agentFixture, 'admin', true).then(
      _ => {
        db.execute('SELECT roles FROM users WHERE id = $1', [agentIDFixture], (err, res) => {
          if (err) {
            done(err);
            return Promise.reject(err);
          }
          const user = res.rows[0];
          expect(user.roles).toContain('agent');
          expect(user.roles).toContain('admin');
          done();
        });
      },
      e => Promise.reject(e)
    )
  });

  it('prevents duplicate roles from being added', (done) => {
    return setTeamRole(agentFixture, 'agent', true).then(
      _ => {
        db.execute('SELECT roles FROM users WHERE id = $1', [agentIDFixture], (err, res) => {
          if (err) {
            done(err);
            return Promise.reject(err);
          }
          const user = res.rows[0];
          expect(user.roles.length).toEqual(1);
          expect(user.roles).toContain('agent');
          done();
        });
      },
      e => Promise.reject(e)
    )
  })

  it('allows a role to be removed', (done) => {
    return setTeamRole(adminFixture, 'admin', false).then(
      users => {
        db.execute('SELECT roles FROM users WHERE id = $1', [agentIDFixture], (err, res) => {
          if (err) {
            done(err);
            return Promise.reject(err);
          }
          const user = res.rows[0];
          expect(user.roles).not.toContain('admin');
          done();
        });
      },
      e => Promise.reject(e)
    );
  });

  it('allows a role to be removed when `enabled` is a string', (done) => {
    return setTeamRole(adminFixture, 'admin', 'false').then(
      users => {
        db.execute('SELECT roles FROM users WHERE id = $1', [agentIDFixture], (err, res) => {
          if (err) {
            done(err);
            return Promise.reject(err);
          }
          const user = res.rows[0];
          expect(user.roles).not.toContain('admin');
          done();
        });
      },
      e => Promise.reject(e)
    );
  });
});