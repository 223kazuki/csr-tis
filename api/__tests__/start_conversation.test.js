const leadEmailFixture = 'prospect@company.com';
const agentIDFixture = 1000000;
const agentEmailFixture = 'agent@layer.com';
const userIDFixture = 999999;
const conversationIDFixture = 'conversation-id';

require('dotenv').config({path: '../.env'});
jest.mock('layer-api');
const LayerAPI = require('layer-api');
const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');

const startConversation = require('../src/start_conversation');

describe('startConversation', () => {
  const clearDatabase = (done) => {
    clearTestData('users')(() => {
      clearTestData('lead_users')(() => {
        clearTestData('leads')(() => {
          clearTestData('conversations')(done);
        });
      });
    });
  };
  beforeEach((done) => {
    clearDatabase(done);
  });

  it('rejects with status 400 if provided with an invalid email', () => {
    return startConversation(agentIDFixture, { email: 'notanemail' }).then(
      () => {},
      err => {
        expect(err.message).toEqual("Email address doesn't look valid");
        expect(err.status).toEqual(400);
      }
    )
  });
  it('creates a User record if none exists with provided email', (done) => {
    return startConversation(agentIDFixture, { email: leadEmailFixture }).then(
      _ => {
        db.execute('SELECT * FROM users WHERE email = $1', [leadEmailFixture], (err, res) => {
          const user = res.rows[0];
          expect(user.id).toBeDefined();
          expect(user.email).toEqual(leadEmailFixture);
          done();
        });
      }
    )
  });
  it('sets the first and last name when creating a new User record', (done) => {
    return startConversation(agentIDFixture, { email: leadEmailFixture, firstName: 'Foo', lastName: 'Bar' }).then(
      _ => {
        db.execute('SELECT * FROM users WHERE email = $1', [leadEmailFixture], (err, res) => {
          const user = res.rows[0];
          expect(user.id).toBeDefined();
          expect(user.first_name).toEqual('Foo');
          expect(user.last_name).toEqual('Bar');
          done();
        });
      }
    )
  });
  it('creates a lead and links it with provided user', (done) => {
    return startConversation(agentIDFixture, { email: leadEmailFixture }).then(
      _ => {
        db.execute('SELECT * FROM users WHERE email = $1', [leadEmailFixture], (err, res) => {
          const user = res.rows[0];
          expect(user.id).toBeDefined();
          db.execute('SELECT * FROM lead_users WHERE user_id = $1', [user.id], (err, res) => {
            const leadUser = res.rows[0];
            expect(leadUser.lead_id).toBeDefined();
            db.execute('SELECT * FROM leads WHERE id = $1', [leadUser.lead_id], (err, res) => {
              const lead = res.rows[0];
              expect(lead).toBeDefined();
              done();
            });
          });
        });
      }
    )
  });
  it('creates a new Layer conversation if the provided user is not the primary user on any conversation', (done) => {
    return startConversation(agentIDFixture, { email: leadEmailFixture }).then(
      _ => {
        db.execute('SELECT * FROM users WHERE email = $1', [leadEmailFixture], (err, res) => {
          const user = res.rows[0];
          expect(user.id).toBeDefined();
          db.execute(db.sqlFromFile('find_conversation_by_primary_user'), [user.id], (err, res) => {
            const conversation = res.rows[0];
            expect(conversation).toBeDefined();
            done();
          });
        });
      }
    )
  });
  it('sets the agent as the owner if there exists a conversation where the user is the primary user', (done) => {
    setTestData('users', ['id', 'email'], [[userIDFixture, leadEmailFixture]])(() => {
      setTestData('conversations', ['id', 'metadata'], [[conversationIDFixture, {'primary_user_id': userIDFixture}]])(() => {
        return startConversation(agentIDFixture, { email: leadEmailFixture }).then(
          _ => {
            db.execute(db.sqlFromFile('find_conversation_by_primary_user'), [userIDFixture], (err, res) => {
              const conversation = res.rows[0];
              expect(conversation.metadata.owner_id).toEqual(agentIDFixture);
              done();
            });
          }
        )
      });
    });
  });
  it('rejects with status 400 if some other agent owns a conversation where the user is the primary user', (done) => {
    setTestData('users', ['id', 'email'], [[userIDFixture, leadEmailFixture]])(() => {
      setTestData('conversations', ['id', 'metadata'], [[conversationIDFixture, {'owner_id': agentIDFixture + 1, 'primary_user_id': userIDFixture}]])(() => {
        return startConversation(agentIDFixture, { email: leadEmailFixture }).then(
          () => {},
          err => {
            expect(err.message).toEqual('Someone else is already talking to this prospect');
            expect(err.status).toEqual(400);
            done();
          }
        );
      })
    });
  });
  it('returns the conversation ID', () => {
    return startConversation(agentIDFixture, { email: leadEmailFixture }).then(
      resp => {
        expect(typeof resp.id).toEqual('number');
      }
    );
  });
});