// const request = jest.genMockFromModule('request');
let mockResponse = {};

const request = jest.fn((options, cb) => {
  const response = (typeof mockResponse === 'function') ? mockResponse(options) : mockResponse;
  cb(null, { statusCode: 200 }, response);
});

const post = jest.fn((params, cb) => {
  const response = (typeof mockResponse === 'function') ? mockResponse(params) : mockResponse;
  cb(null, {}, response);
});
request.post = post;

const get = jest.fn((params, cb) => {
  const response = (typeof mockResponse === 'function') ? mockResponse(params) : mockResponse;
  cb(null, {}, response);
});
request.get = get;

request.__setMockResponse = mr => mockResponse = mr;

module.exports = request;