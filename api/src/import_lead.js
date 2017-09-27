const db = require('./database');

// TODO: Needs tests
const importLead = params => {
  // TODO: No-op if lead already exists
  const { salesforceID, email, name } = params;
  const nameSplit = name.split(' ');
  const firstName = nameSplit[0];
  const lastName = nameSplit.slice(1).join(' ');
  return db.execute(db.sqlFromFile('create_lead_and_user'), [salesforceID, email.toLowerCase(), firstName, lastName]);
};

module.exports = importLead;