const db = require('../src/database');
const { setTestData } = require('./test_helper');
const patchMessageMetadata = require('../src/patch_message_metadata');

describe('patchMessageMetadata', () => {
  beforeAll(setTestData(
    'messages_metadata',
    ['id', 'metadata'],
    [['message1', {}]]
  ));
  it('sets updated metadata for specified message', (done) => {
    return patchMessageMetadata('message1', [{operation: 'add', property: 'hello', value: 'world'}]).then(
      _ => {
        db.execute(`SELECT * FROM messages_metadata WHERE id = $1`, ['message1'], (err, res) => {
          expect(res.rows[0].metadata).toEqual({"hello": ["world"]});
          done();
        });
      }
    )
  });
});
