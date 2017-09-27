const teamIDFixture = 'test-team';
const adminIDFixture = 1000000;
const adminEmailFixture = 'admin@test.com';
const adminRolesFixture = ['agent', 'admin'];
const adminFixture = { id: adminIDFixture, email: adminEmailFixture, team_id: teamIDFixture, roles: adminRolesFixture };
const agentIDFixture = 1000001;
const agentEmailFixture = 'agent@test.com';
const agentRolesFixture = ['agent'];
const agentFixture = { id: agentIDFixture, email: agentEmailFixture, team_id: teamIDFixture, roles: agentRolesFixture };
const inviteeFirstNameFixture = 'First';
const inviteeLastNameFixture = 'Last';
const inviteeEmailFixture = 'invitee@test.com';

const inviteTeamMember = require('../src/invite_team_member');

jest.mock('sendgrid');
const sendgrid = require('sendgrid')('dummy-api-key');
const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');

describe('inviteTeamMember', () => {
  const cleanDatabase = (done) => {
    clearTestData('users')(done);
  };
  beforeEach((done) => {
    sendgrid.emptyRequest.mockClear();
    sendgrid.API.mockClear();
    (require('sendgrid')).mail.Content.mockClear();
    cleanDatabase(() => {
      setTestData('users',
        ['id', 'email', 'team_id', 'roles'],
        [[adminIDFixture, adminEmailFixture, teamIDFixture, adminRolesFixture],
         [agentIDFixture, agentEmailFixture, teamIDFixture, agentRolesFixture]])(done);
    });
  });

  it('returns a Promise', () => {
    expect(inviteTeamMember(adminFixture, inviteeFirstNameFixture, inviteeLastNameFixture, inviteeEmailFixture) instanceof Promise).toBeTruthy();
  });

  it('rejects with a 403 if inviter is not an admin', () => {
    return inviteTeamMember(agentFixture, inviteeFirstNameFixture, inviteeLastNameFixture, inviteeEmailFixture).then(
      _ => Promise.reject(),
      e => {
        expect(e.status).toEqual(403);
      }
    );
  });

  it('adds an agent user to the database without a password_digest', (done) => {
    return inviteTeamMember(adminFixture, inviteeFirstNameFixture, inviteeLastNameFixture, inviteeEmailFixture).then(
      _ => {
        db.execute('SELECT * FROM users WHERE email = $1', [inviteeEmailFixture], (err, res) => {
          if (err) {
            done(err);
            return Promise.reject(err);
          }
          else {
            const user = res.rows[0];
            expect(user.id).toBeGreaterThan(0);
            expect(user.first_name).toEqual(inviteeFirstNameFixture);
            expect(user.last_name).toEqual(inviteeLastNameFixture);
            expect(user.password_digest).toBeNull();
            expect(user.team_id).toEqual(teamIDFixture);
            expect(user.roles).toContain('agent');
            done();
          }
        })
      },
      e => {
        done(e);
        return Promise.reject(e);
      }
    );
  });

  it('sends an email to the invitee', () => {
    return inviteTeamMember(adminFixture, inviteeFirstNameFixture, inviteeLastNameFixture, inviteeEmailFixture).then(
      _ => {
        const sendgridRequestCall = sendgrid.emptyRequest.mock.calls[0];
        const { method, path, body } = sendgridRequestCall[0];
        expect(method).toEqual('POST');
        expect(path).toEqual('/v3/mail/send');
        expect(body.from).toEqual({"email": adminEmailFixture});
        expect(body.to).toEqual({"email": inviteeEmailFixture});
        expect(body.content.mimeType).toEqual("text/plain");

        const sendgridAPICall = sendgrid.API.mock.calls[0];
        // Sendgrid mock `request` method returns its parameters
        const mockRequest = sendgridAPICall[0];
        expect(mockRequest.method).toEqual('POST');
      },
      e => Promise.reject(e)
    )
  });

  it('generates and includes a password reset link in email', (done) => {
    return inviteTeamMember(adminFixture, inviteeFirstNameFixture, inviteeLastNameFixture, inviteeEmailFixture).then(
      _ => {
        db.execute('SELECT * FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = $1)', [inviteeEmailFixture], (err, res) => {
          const session = res.rows[0];
          expect(session.invalidated).toBeFalsy();
          expect(session.token).toMatch(/pwreset-.+/);
          const mailHelper = require('sendgrid').mail;
          const contentCall = mailHelper.Content.mock.calls[0];
          const callBody = contentCall[1];
          expect(callBody).toMatch(session.token);
          done();
        });
      },
      e => {
        done(e);
        return Promise.reject(e);
      }
    );
  });

  it("resolves with invitee's user ID", (done) => {
    return inviteTeamMember(adminFixture, inviteeFirstNameFixture, inviteeLastNameFixture, inviteeEmailFixture).then(
      result => {
        db.execute('SELECT id FROM users WHERE email = $1', [inviteeEmailFixture], (err, res) => {
          if (err) {
            done(err);
            return Promise.reject(err);
          }
          const userID = res.rows[0].id;
          expect(result.id).toEqual(userID);
          done();
        });
      },
      e => {
        done(e);
        return Promise.reject(e);
      }
    )
  })
});