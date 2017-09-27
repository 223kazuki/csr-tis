const db = require('./database');
const _ = require('lodash');
const { errorWithStatus } = require('./util');

const getSalesforceLead = require('./get_salesforce_lead');

const findLeadSQL = db.sqlFromFile('find_lead_for_user');
const userProfile = (agentID, userID, shouldRefresh) => new Promise((resolve, reject) => {
  const core = () => {
    db.execute(findLeadSQL, [userID], (err, results) => {
      if (err)
        reject(err);
      else {
        const user = results.rows[0];
        resolve(user || {});
      }
    });
  };

  // TODO: Better handle a user ID that doesn't point to anything
  if (shouldRefresh) {
    db.execute(findLeadSQL, [userID], (err, res) => {
      if (err) return reject(err);
      if (res.rows.length < 1) return reject(errorWithStatus(`No lead or user found for user ID ${userID}`, 400));

      const salesforceID = res.rows[0].salesforce_id;
      if (!salesforceID)
        core();
      else
        getSalesforceLead(agentID, salesforceID, true).then(
          _ => {
            // Re-run query to load updated results
            core();
          },
          err => {
            reject(err)
          }
        );
    });
  }
  else {
    core();
  }
});

module.exports = userProfile;