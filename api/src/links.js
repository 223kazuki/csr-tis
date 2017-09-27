const Bitly = require('bitly');
const bitly = new Bitly(process.env['BITLY_ACCESS_TOKEN']);
const createSessionForUser = require('./createSessionForUser');
const { stripPrefix } = require('./util');

const authenticatedLinkToConversation = (recipientUser, conversationID) => new Promise((resolve, reject) => {
  createSessionForUser(recipientUser, true).then(
    sessionToken => {
      const link = `${process.env.UI_HOST}/conversation/${stripPrefix(conversationID)}?st=${sessionToken}`;
      resolve(link);
    },
    err => reject(err)
  );
});

const shortenLink = (link) => bitly.shorten(link);  // Returns a Promise

module.exports = {
  authenticatedLinkToConversation,
  shortenLink
};