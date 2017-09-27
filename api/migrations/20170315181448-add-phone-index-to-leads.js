'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, cb) {
  db.addIndex('leads', 'phone_idx', ['phone'], cb);
};

exports.down = function(db, cb) {
  db.removeIndex('leads', 'phone_idx', cb);
};

exports._meta = {
  "version": 1
};
