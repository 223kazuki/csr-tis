'use strict';

var dbm;
var type;
var seed;

const fs = require('fs');

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
  db.runSql(fs.readFileSync('migrations/add_created_at_to_conversations.sql', 'utf8'), [], cb);
};

exports.down = function(db, cb) {
  db.removeColumn('conversations', 'created_at', cb);
};

exports._meta = {
  "version": 1
};
