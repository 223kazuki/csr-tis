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
  db.runSql(fs.readFileSync('migrations/add_sex_birthday_milage_to_leads.sql', 'utf8'), [], cb);
};

exports.down = function(db, cb) {
  db.removeColumn('leads', 'sex', cb);
  db.removeColumn('leads', 'birthday', cb);
  db.removeColumn('leads', 'milage', cb);
};

exports._meta = {
  "version": 1
};
