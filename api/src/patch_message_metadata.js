const LayerPatchParser = require('layer-patch');

const { errorWithStatus } = require('./util');
const db = require('./database');
const patcher = new LayerPatchParser({});
const getMessageMetadata = require('./get_message_metadata');

const patchMessageMetadata = (messageID, patchOps) => new Promise((resolve, reject) => {
  getMessageMetadata(messageID).then(
    metadata => {
      var newMetadata = metadata;
      try {
        patcher.parse({
          object: newMetadata,
          operations: Array.isArray(patchOps) ? patchOps : [patchOps]
        });
      } catch (err) {
        reject(errorWithStatus(err, 400));
      }
      db.execute(db.sqlFromFile('update_message_metadata.sql'), [messageID, newMetadata], (err, res) => {
        if (err)
          reject(errorWithStatus(err))
        else
          resolve({ ok: true, patch: patchOps, updated: res.rows[0] });
      });
    },
    err => reject(errorWithStatus(err))
  )
});

module.exports = patchMessageMetadata;