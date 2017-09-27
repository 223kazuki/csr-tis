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

exports.up = function(db, callback) {
  db.runSql(fs.readFileSync('migrations/create_conversations.sql', 'utf8'), [], callback);
};

exports.down = function(db, callback) {
  db.dropTable('conversations', {}, callback);
};

exports._meta = {
  "version": 1
};
