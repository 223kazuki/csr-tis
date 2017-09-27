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
  db.runSql(fs.readFileSync('migrations/add_salesforce_id_to_users.sql', 'utf8'), [], cb);
};

exports.down = function(db, cb) {
  db.removeColumn('users', 'salesforce_id', cb);
  db.removeIndex('users', 'salesforce_id_idx', cb);
};

exports._meta = {
  "version": 1
};
