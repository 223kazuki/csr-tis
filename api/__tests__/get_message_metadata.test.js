const { setTestData } = require('./test_helper');
const getMessageMetadata = require('../src/get_message_metadata');

describe('getMessageMetadata', () => {
  beforeAll(setTestData(
    'messages_metadata',
    ['id', 'metadata'],
    [['testid', {hello: 'world'}]]
  ));
  it('returns saved metadata for specified conversation if conversation exists', () => {
    return getMessageMetadata('testid').then(
      metadata => expect(metadata).toEqual({hello: 'world'})
    );
  });
  it('returns empty metadata if conversation does not exist', () => {
    return getMessageMetadata('doesnotexist').then(
      metadata => expect(metadata).toEqual({})
    )
  });
});
