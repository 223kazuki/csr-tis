const { addPrefix } = require('../src/util');

const userIDFixture = 1000000;
const userEmailFixture = 'user@test.com';
const agentIDFixture = 999999;
const agentEmailFixture = 'agent@test.com';
const conversationIDFixture = 'conversation-id';
const prefixedConversationIDFixture = addPrefix(conversationIDFixture, 'conversations');
const conversationMetadataFixture = { owner_id: agentIDFixture, primary_user_id: userIDFixture };
const agentFixture = { id: agentIDFixture, email: agentEmailFixture, first_name: 'Agent' };

jest.mock('layer-api');
const LayerAPI = require('layer-api');
jest.mock('sendgrid');
const sendgrid = require('sendgrid')('dummy-api-key');
const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');

const emailMessagesToProspect = require('../src/email_messages_to_prospect');

describe('emailMessagesToProspect', () => {
  beforeEach((done) => {
    sendgrid.emptyRequest.mockClear();
    sendgrid.API.mockClear();
    (require('sendgrid')).mail.Content.mockClear();
    clearTestData('conversations')(() => {
      clearTestData('users')(() => {
        setTestData('users', ['id', 'email'], [[agentIDFixture, agentEmailFixture], [userIDFixture, userEmailFixture]])(() => {
          setTestData('conversations', ['id', 'metadata'], [[prefixedConversationIDFixture, conversationMetadataFixture]])(done);
        });
      });
    });
  });

  it('returns a Promise', () => {
    expect(emailMessagesToProspect(agentFixture, [], conversationIDFixture) instanceof Promise).toBeTruthy();
  });
  it('fetches content of each message from Layer', () => {
    const fixtureMessageIDs = ['123', '456', '789'];
    return emailMessagesToProspect(agentFixture, fixtureMessageIDs, conversationIDFixture).then(
      _ => {
        const getMessageCalls = (new LayerAPI()).messages.get.mock.calls;
        const messageIDs = getMessageCalls.map(call => call[0]);
        expect(messageIDs).toEqual(fixtureMessageIDs);
      }
    )
  });
  it("creates a session token for primary user", (done) => {
    return emailMessagesToProspect(agentFixture, ['123'], conversationIDFixture).then(
      _ => {
        db.execute('SELECT * FROM sessions', [], (err, res) => {
          const session = res.rows[0];
          expect(session.user_id).toEqual(userIDFixture);
          expect(session.token).toMatch(/^user-.+/);
          done();
        });
      }
    );
  });
  it("includes link to conversation with session token in message body", () => {
    return emailMessagesToProspect(agentFixture, ['123'], conversationIDFixture).then(
      _ => {
        const mailHelper = require('sendgrid').mail;
        const contentCall = mailHelper.Content.mock.calls[0];
        const callBody = contentCall[1];
        expect(callBody).toMatch(/conversation\/conversation-id\?st\=user-/);
      }
    );
  });
  it('sends email via SendGrid', () => {
    return emailMessagesToProspect(agentFixture, ['123'], conversationIDFixture).then(
      _ => {
        const sendgridRequestCall = sendgrid.emptyRequest.mock.calls[0];
        const { method, path, body } = sendgridRequestCall[0];
        expect(method).toEqual('POST');
        expect(path).toEqual('/v3/mail/send');
        expect(body.from).toEqual({"email": agentEmailFixture});
        expect(body.subject).toEqual("Agent has sent you a message");
        expect(body.to).toEqual({"email": userEmailFixture});
        expect(body.content.mimeType).toEqual("text/html");

        const sendgridAPICall = sendgrid.API.mock.calls[0];
        // Sendgrid mock `request` method returns its parameters
        const mockRequest = sendgridAPICall[0];
        expect(mockRequest.method).toEqual('POST');
      }
    )
  });
});