const util = require('../src/util');

describe('errorWithStatus', () => {
  it('returns an instance of Error when provided with a string', () => {
    expect(util.errorWithStatus('Test message') instanceof Error).toBeTruthy();
  })
  it('returns an instance of Error when provided with an error', () => {
    expect(util.errorWithStatus(new Error()) instanceof Error).toBeTruthy();
  })
  it('returns an error with provided message if message is a string', () => {
    expect(util.errorWithStatus('Test message').message).toEqual('Test message');
  })
  it('returns provided error if called with an Error instance', () => {
    const err = new Error();
    expect(util.errorWithStatus(err)).toEqual(err);
  })
  it('does not change status if provided with an Error with a status', () => {
    const err = new Error();
    err.status = 400;
    expect(util.errorWithStatus(err).status).toEqual(400)
  })
  it('returns an error with provided status', () => {
    expect(util.errorWithStatus('', 400).status).toEqual(400);
  });
  it('returns an error with status 500 if no status is provided', () => {
    expect(util.errorWithStatus('').status).toEqual(500);
  })
});

describe('validEmail', () => {
  it('returns true if provided with an email that matches simpleEmailRegex', () => {
    expect(util.validEmail('feifan@layer.com')).toBeTruthy();
  });
  it('returns false if provided with an email that does not match simpleEmailRegex', () => {
    expect(util.validEmail('invalid')).toBeFalsy();
  });
});