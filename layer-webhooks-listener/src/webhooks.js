const redisURL = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
const redis = require('redis').createClient(redisURL);
const queue = require('kue').createQueue({ redis: redisURL });

const { getEmailIdentityForUserID } = require('./email');

const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});
const WebhookServices = require('layer-webhooks-services');
const lws = new WebhookServices({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID,
  redis: redis
});

const NEW_CONVERSATION_TYPE = 'NEW_CONVERSATION';
const NEW_MESSAGE_TYPE = 'NEW_MESSAGE';
const UNREAD_MESSAGE_TYPE = 'UNREAD_MESSAGE';
const UNREAD_TRIGGER_DELAY = '1s';
const secret = 'thereisnosecret';

const newConversationsHook = {
  name: NEW_CONVERSATION_TYPE,
  events: ['conversation.created'],
  path: '/new_conversation'
};
const newMessagesHook = {
  name: NEW_MESSAGE_TYPE,
  events: ['message.sent'],
  path: '/new_message'
};

const registerProcessor = function(type, proc) {
  queue.process(type, proc);
};

const app = require('express')();

const start = function() {
  app.get('/ping', function(req, res) {
    res.send('PONG');
  });
  app.listen(process.env.PORT || 3002);
  lws.listen({
    expressApp: app,
    secret: secret,
    hooks: [newConversationsHook, newMessagesHook]
  });
};

module.exports = {
  NEW_CONVERSATION_TYPE,
  NEW_MESSAGE_TYPE,
  registerProcessor,
  start
};