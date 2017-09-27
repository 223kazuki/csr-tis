const { addPrefix } = require('../src/util');

const userIDFixture = 1000000;
const userEmailFixture = 'user@test.com';
const agentIDFixture = 999999;
const agentEmailFixture = 'agent@test.com';
const conversationIDFixture = 'conversation-id';
const prefixedConversationIDFixture = addPrefix(conversationIDFixture, 'conversations');
const conversationMetadataFixture = { owner_id: agentIDFixture, primary_user_id: userIDFixture };

jest.mock('layer-api');
const LayerAPI = require('layer-api');
jest.mock('sendgrid');
const sendgrid = require('sendgrid')('dummy-api-key');
const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');

const emailAgentOnProspectAction = require('../src/email_agent_on_prospect_action');

describe('emailAgentOnProspectAction', () => {
  beforeAll((done) => {
    clearTestData('conversations')(() => {
      clearTestData('users')(() => {
        setTestData('users', ['id', 'email'], [[agentIDFixture, agentEmailFixture], [userIDFixture, userEmailFixture]])(() => {
          setTestData('conversations', ['id', 'metadata'], [[prefixedConversationIDFixture, conversationMetadataFixture]])(done);
        });
      });
    });
  });
  beforeEach(() => {
    sendgrid.emptyRequest.mockClear();
    sendgrid.API.mockClear();
    (require('sendgrid')).mail.Content.mockClear();
  });

  describe('opened', () => {
    it('returns a Promise', () => {
      expect(emailAgentOnProspectAction(conversationIDFixture, 'opened') instanceof Promise).toBeTruthy();
    });
    it('sends email via SendGrid', () => {
      return emailAgentOnProspectAction(conversationIDFixture, 'opened').then(
        _ => {
          const sendgridRequestCall = sendgrid.emptyRequest.mock.calls[0];
          const { method, path, body } = sendgridRequestCall[0];
          expect(method).toEqual('POST');
          expect(path).toEqual('/v3/mail/send');
          expect(body.subject).toEqual("Lead opened conversation");
          expect(body.to).toEqual({"email": agentEmailFixture});
          expect(body.content.mimeType).toEqual("text/plain");

          const sendgridAPICall = sendgrid.API.mock.calls[0];
          // Sendgrid mock `request` method returns its parameters
          const mockRequest = sendgridAPICall[0];
          expect(mockRequest.method).toEqual('POST');
        }
      )
    });
  });

  describe('sent', () => {
    it('returns a Promise', () => {
      expect(emailAgentOnProspectAction(conversationIDFixture, 'sent') instanceof Promise).toBeTruthy();
    });
    it('gets five most recent messages in conversation from Layer', (done) => {
      return emailAgentOnProspectAction(conversationIDFixture, 'sent').then(
        _ => {
          const getAllMessagesCall = (new LayerAPI()).messages.getAll.mock.calls[0];
          expect(getAllMessagesCall[0]).toEqual(conversationIDFixture);
          expect(getAllMessagesCall[1]).toEqual({ page_size: 5});
          done();
        }
      )
    });
    it('sends email via SendGrid', (done) => {
      return emailAgentOnProspectAction(conversationIDFixture, 'sent').then(
        _ => {
          const sendgridRequestCall = sendgrid.emptyRequest.mock.calls[0];
          const { method, path, body } = sendgridRequestCall[0];
          expect(method).toEqual('POST');
          expect(path).toEqual('/v3/mail/send');
          expect(body.subject).toEqual('Lead sent you a message');
          expect(body.to).toEqual({"email": agentEmailFixture});
          expect(body.content.mimeType).toEqual("text/plain");

          const sendgridAPICall = sendgrid.API.mock.calls[0];
          // Sendgrid mock `request` method returns its parameters
          const mockRequest = sendgridAPICall[0];
          expect(mockRequest.method).toEqual('POST');
          done();
        }
      )
    });
  });
});