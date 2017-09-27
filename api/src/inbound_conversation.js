const db = require('./database');
const LayerAPI = require('layer-api');
const { addAgentToConversation } = require('./add_agent_to_conversation');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const importLead = require('./import_lead');
const createSessionForUser = require('./createSessionForUser');
const { errorWithStatus, stripPrefix } = require('./util');
const mailHelper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

const getExistingConversation = (sessionToken) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_user_by_session_token'), [sessionToken]).then(
    res => {
      const user = res.rows[0];
      return db.execute(db.sqlFromFile('find_conversation_by_primary_user'), [user.id]);
    }
  ).then(
    res => {
      const conversation = res.rows[0];
      if (!conversation || !conversation.id)
        reject(errorWithStatus(`No existing conversation found with session token ${sessionToken}`, 400));
      else
        resolve({ conversationID: conversation.id });
    },
    e => reject(e)
  )
});

const notifyAgentOfNewConversation = (agentID, conversationID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_user_by_id'), [agentID]).then(
    res => {
      const agent = res.rows[0];
      if (!agent || !agent.email)
        return reject(new Error(`No agent or email found for ID ${agentID}`));
      const toEmail = new mailHelper.Email(agent.email);
      const fromEmail = new mailHelper.Email(`noreply@csr.layer.com`);
      const subject = 'CSR — inbound prospect new conversation';
      const content = new mailHelper.Content('text/plain', `${process.env.APP_HOST}/join?cid=${stripPrefix(conversationID)}`);
      const mail = new mailHelper.Mail(fromEmail, subject, toEmail, content);
      const request = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
      });
      sendgrid.API(request, (err, resp) => {
        if (err)
          reject(new Error(JSON.stringify(err.response)));
        else
          resolve(resp);
      });
    },
    e => reject(e)
  );
});

const createConversation = () => new Promise((resolve, reject) => {
  // Create lead and user
  importLead({ salesforceID: null, email: '', name: 'Inbound Prospect' }).then(
    res => {
      // Create session for user
      const userID = res.rows[0].user_id;
      const createSessionPromise = createSessionForUser({ id: userID, email: 'inbound@user.com' });
      return Promise.all([userID, createSessionPromise]);
    }
  ).then(
    ([userID, sessionToken]) => {
      // Create Layer conversation
      const userIDStr = `${userID}`;
      const metadata = { primary_user_id: userIDStr };
      const participants = [userIDStr];
      const createConversationPromise = layer.conversations.createAsync({ participants, metadata });
      return Promise.all([userID, sessionToken, metadata, participants, createConversationPromise]);
    }
  ).then(
    ([userID, sessionToken, metadata, participants, layerRes]) => {
      // Save conversation to database
      const conversationID = layerRes.body.id;
      const insertConversationPromise = db.execute(db.sqlFromFile('insert_new_conversation'), [conversationID, participants, metadata]);
      return Promise.all([userID, sessionToken, conversationID, insertConversationPromise]);
    }
  ).then(
    ([userID, sessionToken, conversationID]) => {
      // Add agent to conversation
      const addAgent = addAgentToConversation(process.env.DEMO_AGENT_ID, conversationID);
      const addBot = layer.conversations.addParticipantsAsync(conversationID, [process.env.DEMO_BOT_ID]);
      // Notify agent of new conversation
      const notifyAgent = notifyAgentOfNewConversation(process.env.DEMO_AGENT_ID, conversationID);
      return Promise.all([userID, sessionToken, conversationID, addAgent, addBot, notifyAgent]);
    }
  ).then(
    ([userID, sessionToken, conversationID, _]) => {
      // Send initial messages
      const callback = (err, res) => {
        if (err) {
          console.log(`Error sending initial message for demo conversation ${conversationID}`);
          console.log(err);
        }
      };
      const firstMessage = {
        sender: { user_id: process.env.DEMO_BOT_ID },
        parts: [{ body: 'Hi there! Welcome to Layer', mime_type: 'text/plain' }]
      };
      const secondMessage = {
        sender: { user_id: process.env.DEMO_BOT_ID },
        parts: [{ body: 'Play around by clicking the Plus button below, or just say "hi"', mime_type: 'text/plain' }]
      };
      layer.messages.send(conversationID, firstMessage, callback);
      setTimeout(() => { layer.messages.send(conversationID, secondMessage, callback) }, 500);
      // Generate response
      resolve({ userID, sessionToken, conversationID })
    },
    e => {
      console.log(e);
      reject(e);
    }
  );
});

const removeBotFromConversation = (conversationID) => layer.conversations.removeParticipantsAsync(conversationID, [process.env.DEMO_BOT_ID]);

module.exports = { createConversation, getExistingConversation, removeBotFromConversation };
