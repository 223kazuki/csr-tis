if (process.env.NODE_ENV !== 'production')
  require('dotenv').config({path: '../.env'});
const db = require('./src/database');
const webhooks = require('./src/webhooks');
const fs = require('fs');

const createConversationIfNecessary = require('./src/new_conversation');
const processNewMessage = require('./src/new_message');

webhooks.registerProcessor(webhooks.NEW_CONVERSATION_TYPE, createConversationIfNecessary);
webhooks.registerProcessor(webhooks.NEW_MESSAGE_TYPE, processNewMessage);
webhooks.start();