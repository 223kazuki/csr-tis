const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const db = require('./database');
const { addPrefix } = require('./util');
const _ = require('lodash');

const setAgentAsConversationOwner = (agentID, fullConversationID) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_conversation_by_id'), [fullConversationID]).then(
    res => {
      const conversation = res.rows[0];
      const agentIDStr = `${agentID}`;
      const newMetadata = Object.assign({}, conversation.metadata, {status: 'active', owner_id: agentIDStr});
      const newParticipants = [agentIDStr].concat(conversation.participants);
      const updateMetadataPromise = db.execute(db.sqlFromFile('update_conversation_metadata'), [fullConversationID, newMetadata]);
      const updateParticipantsPromise = db.execute(db.sqlFromFile('update_conversation_participants'), [fullConversationID, newParticipants]);
      const updateLayerMetadataPromise = layer.conversations.setMetadataPropertiesAsync(fullConversationID, newMetadata);
      const updateLayerParticipantsPromise = layer.conversations.addParticipantsAsync(fullConversationID, [agentIDStr]);
      return Promise.all([updateMetadataPromise, updateParticipantsPromise, updateLayerMetadataPromise, updateLayerParticipantsPromise]);
    }
  ).then(
    _ => resolve(),
    e => reject(e)  // Back out changes if anything fails
  )
});

const addAnotherAgentToConversation = (agentID, conversationID) => new Promise((resolve, reject) => {
  reject(new Error('Not implemented yet'));
});

const addAgentToConversation = (agentID, conversationID) => new Promise((resolve, reject) => {
  const fullConversationID = addPrefix(conversationID, 'layer:///conversations/');
  db.execute(db.sqlFromFile('get_conversation_by_id'), [fullConversationID]).then(
    res => {
      const conversation = res.rows[0];
      const metadata = conversation.metadata;
      // if (!metadata.owner_id)
      return setAgentAsConversationOwner(agentID, fullConversationID);
      // else
        // return addAnotherAgentToConversation(agentID, fullConversationID);
    }
  ).then(
    _ => resolve({ ok: true }),
    e => reject(e)
  );
});

const availableAgents = () => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('get_all_agents'), []).then(
    res => resolve(res.rows.map(agent => _.pick(agent, ['id', 'first_name', 'last_name']))),
    err => reject(err)
  );
});

module.exports = { addAgentToConversation, availableAgents };
