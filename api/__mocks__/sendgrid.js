const sendgrid = jest.genMockFromModule('sendgrid');

const emptyRequestMock = jest.fn(params => params);
const apiMock = jest.fn((request, callback) => callback(null, { body: 'mock-ok' }));
const sendgridFunc = sendgridAPIKey => ({
  emptyRequest: emptyRequestMock,
  API: apiMock
});

const mailContent = jest.fn(function(mimeType, content) {
  this.mimeType = mimeType;
  this.content = content;
});
const mailEmail = jest.fn(function(emailStr) {
  this.email = emailStr
});
const mailMail = jest.fn(function(from, subject, to, content) {
  this.toJSON = function() { return {from, subject, to, content} };
});
mailMail.prototype.setReplyTo = jest.fn(function(replyTo) { return; });

sendgridFunc.mail = {
  Content: mailContent,
  Email: mailEmail,
  Mail: mailMail,
};

module.exports = sendgridFunc;