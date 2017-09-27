const db = require('./database');

const findLeadSQL = db.sqlFromFile('select_leads_order_by_last_message');
const leads = params => new Promise((resolve, reject) => {
  const { segment, status, owner } = params;
  db.execute(findLeadSQL, [segment, status, owner], (err, res) => {
    if (err)
      reject(err);
    else
      resolve({ leads: res.rows });
  });
});

module.exports = leads;
