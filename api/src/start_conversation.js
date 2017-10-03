const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const { validEmail, errorWithStatus } = require('./util');

const db = require('./database');

const findOrCreateUserWithEmail = (email, firstName, lastName) => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_user_by_email'), [email], (err, res) => {
    if (err)
      return reject(err);

    if (res.rows.length === 0) {  // No prospect exists with that email — create one
      db.execute(db.sqlFromFile('create_user'), [email, null, firstName, lastName], (err, res) => {
        if (err)
          reject(err);
        else
          resolve(res.rows[0].id);  // Insertion ID: http://on.feif.me/2gNW2su
      });
    }
    else {
      resolve(res.rows[0].id);
    }
  });
});

const findOrCreateLeadForUser = userID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_lead_user_by_user_id'), [userID], (err, res) => {
    if (err) {
      reject(err);
      return;
    }

    const rows = res.rows;
    if (rows.length > 0) {
      resolve({ leadID: rows[0].lead_id, userID: userID});
    }
    else {
      db.execute(db.sqlFromFile('create_lead_for_user'), [userID], (err, res) => {
        if (err)
          reject(err);
        else
          resolve({ leadID: res.rows[0].lead_id, userID: userID });
      });
    }
  });
});

const existingPrimaryConversation = prospectUserID => new Promise((resolve, reject) => {
  db.execute(db.sqlFromFile('find_conversation_by_primary_user'), [prospectUserID], (err, res) => {
    if (err)
      reject(err);
    else
      resolve({ conversation: res.rows[0], prospectUserID });
  });
});

const createNewConversation = (agentID, prospectID) => new Promise((resolve, reject) => {
  let participants;
  if (process.env.DEMO_BOT_ID)
    participants = [`${agentID}`, `${prospectID}`, process.env.DEMO_BOT_ID];
  else
    participants = [`${agentID}`, `${prospectID}`];
  const metadata = {status: 'active', owner_id: `${agentID}`, primary_user_id: `${prospectID}`};
  layer.conversations.create({ participants, metadata, distinct: true }, (err, res) => {
    if (err)
      return reject(err);

    const conversationID = res.body.id;
    db.execute(db.sqlFromFile('insert_new_conversation'), [conversationID, participants, metadata], (err) => {
      if (err)
        reject(err);
      else
        resolve(conversationID);
    });
  });
});

const claimExistingConversation = (agentID, conversation) => new Promise((resolve, reject) => {
  const conversationOwnerID = parseInt(conversation.metadata.owner_id, 10);
  if (!isNaN(conversationOwnerID) && conversationOwnerID !== agentID) {  // Conversation already owned by someone else
    // TODO: Provide information on who "someone else" is
    return reject(errorWithStatus("Someone else is already talking to this prospect", 400));
  }
  else {  // Update conversation status and return ID
    const newMetadata = Object.assign({}, conversation.metadata, {status: 'active', owner_id: agentID});
    layer.conversations.setMetadataProperties(conversation.id, newMetadata, (err) => {
      if (err)
        return reject(err);

      db.execute(db.sqlFromFile('update_conversation_metadata'), [conversation.id, newMetadata], (err) => {
        if (err)
          reject(err);
        else
          resolve(conversation.id);
      });
    });
  }
})

/* Things that can happen:
 * Invalid email: Error. Fix email and retry
 * New prospect: Create user from email. Create Layer conversation. Owner is agent, primary user is user
 * Existing prospect, no primary conversation: Create Layer conversation. Owner is agent, primary user is user
 * Existing conversation between agent and user: Move conversation to `active` and return conversation ID
 * Existing conversation between another agent and user: Error. Resolve manually (in real world) */
const startConversation = (layerAgentID, prospect) => new Promise((resolve, reject) => {
  const { email, firstName, lastName } = prospect;
  if (!validEmail(email))
    return reject(errorWithStatus("Email address doesn't look valid", 400));

  findOrCreateUserWithEmail(email.toLowerCase(), firstName, lastName).then(  // Make sure we have a user
    userID => findOrCreateLeadForUser(userID),
    err => reject(errorWithStatus(err))
  ).then(
    ({ _, userID }) => existingPrimaryConversation(userID),
    err => reject(errorWithStatus(err))
  ).then(                                         // Setup conversation
    ({ conversation, prospectUserID }) => {
      if (conversation)  // Conversation exists
        return claimExistingConversation(layerAgentID, conversation);
      else
        return createNewConversation(layerAgentID, prospectUserID);
    },
    err => reject(errorWithStatus(err))
  ).then(                                         // Shape response
    conversationID => resolve({ id: conversationID }),
    err => reject(errorWithStatus(err))
  );
});

module.exports = startConversation;
