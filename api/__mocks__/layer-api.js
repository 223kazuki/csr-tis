const layer = jest.genMockFromModule('layer-api');

const conversationCreate = jest.fn((options, cb) => cb(null, { body: {id: 888} }));
const getMessageInConversation = jest.fn((mid, cid, cb) => cb(null, {
  body: {
    parts: [{ body: 'Layer mock message body' }]
  }
}));
const getAllMessagesInConversation = jest.fn((cid, params, cb) => cb(null, {
  body: [{ parts: [{ body: 'Layer mock message body' }] }]
}));

module.exports = jest.fn(function(config) {
  this.conversations = {
    create: conversationCreate,
    setMetadataProperties: jest.fn((conversationID, metadata, cb) => cb(null, {})),
    // createAsync:
  };
  this.messages = {
    get: getMessageInConversation,
    getAll: getAllMessagesInConversation
  }
});