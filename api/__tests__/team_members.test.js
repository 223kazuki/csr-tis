const teamIDFixture = 'test-team';
const adminIDFixture = 1000000;
const adminEmailFixture = 'admin@test.com';
const adminRolesFixture = ['agent', 'admin'];
const agentIDFixture = 1000001;
const agentEmailFixture = 'agent@test.com';
const agentRolesFixture = ['agent'];
const otherAgentIDFixture = 1000002;
const otherAgentEmailFixture = 'otheragent@test.com';
const otherAgentRolesFixture = ['agent'];
const teamMembers = require('../src/team_members');

const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');

describe('teamMembers', () => {
  const clearDatabase = (done) => {
    clearTestData('users')(done);
  };
  beforeEach((done) => {
    clearDatabase(() => {
      setTestData('users', 
        ['id', 'email', 'password_digest', 'team_id', 'roles'],
        [[adminIDFixture, adminEmailFixture, 'dummydigest', teamIDFixture, adminRolesFixture],
         [agentIDFixture, agentEmailFixture, null, teamIDFixture, agentRolesFixture],
         [otherAgentIDFixture, otherAgentEmailFixture, null, 'foo', otherAgentRolesFixture]])(done);
    });
  });

  it('returns a Promise', () => {
    expect(teamMembers(teamIDFixture) instanceof Promise).toBeTruthy();
  });

  it('returns a list of users in the team', () => {
    return teamMembers(teamIDFixture).then(
      users => {
        expect(users.length).toEqual(2);
        const userIDs = users.map(u => u.id);
        expect(userIDs).toContain(adminIDFixture);
        expect(userIDs).toContain(agentIDFixture);
      },
      e => Promise.reject(e)
    )
  });

  it('includes roles for each returned user', () => {
    return teamMembers(teamIDFixture).then(
      users => {
        const roles = users.map(u => u.roles);
        expect(roles[0]).toContain('agent');
        expect(roles[0]).toContain('admin');
        expect(roles[1]).toContain('agent');
      },
      e => Promise.reject(e)
    );
  });

  it('does not include password_digest on returned users', () => {
    return teamMembers(teamIDFixture).then(
      users => {
        const digests = users.map(u => u.password_digest);
        expect(typeof digests[0]).toEqual('undefined');
        expect(typeof digests[1]).toEqual('undefined');
      },
      e => Promise.reject(e)
    );
  });

  it('sets pending:true on users without password_digests', () => {
    return teamMembers(teamIDFixture).then(
      users => {
        const pending = users.map(u => u.pending);
        expect(pending[0]).toBeFalsy();
        expect(pending[1]).toBeTruthy();
      },
      e => Promise.reject(e)
    );
  });

  it('does not return users who are not part of the team', () => {
    return teamMembers(teamIDFixture).then(
      users => {
        const userIDs = users.map(u => u.id);
        expect(userIDs.indexOf(otherAgentIDFixture)).toEqual(-1);
      },
      e => Promise.reject(e)
    );
  });
});