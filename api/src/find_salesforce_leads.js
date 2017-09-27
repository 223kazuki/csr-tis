const db = require('./database');
const { executeQuery } = require('./salesforce');

const keyBy = (arrayOfObjects, keyField) => {
  return arrayOfObjects.reduce((kvMap, obj) => Object.assign(kvMap, { [obj[keyField]]: obj }), {});
};

// TODO: Needs tests
const findSalesforceLeads = (agentID, query) => new Promise((resolve, reject) => {
  const queryString = `${encodeURIComponent(query)}&sobject=Lead&Lead.fields=id,name,email`;
  executeQuery(agentID, queryString).then(
    salesforceResults => {
      const resultSalesforceIDs = salesforceResults.map(r => r['Id']);
      const existingLeads = new Promise((resolve, reject) => {
        db.execute('SELECT * FROM leads WHERE salesforce_id = ANY($1)', [resultSalesforceIDs], (err, res) => {
          if (err)
            reject(err);
          else
            resolve(keyBy(res.rows, 'salesforce_id'));
        });
      });
      const existingConversations = new Promise((resolve, reject) => {
        db.execute(db.sqlFromFile('find_existing_conversations_by_lead_salesforce_ids'), [resultSalesforceIDs], (err, res) => {
          if (err)
            reject(err);
          else
            resolve(keyBy(res.rows, 'salesforce_id'));
        });
      });
      Promise.all([existingLeads, existingConversations]).then(
        ([leads, conversations]) => {
          const annotatedResults = salesforceResults.map(result => {
            const output = Object.assign({}, result);
            const leadID = result['Id'];
            const databaseLead = leads[leadID];
            if (databaseLead)
              output.lead_id = databaseLead.id;
            const databaseConversation = conversations[leadID];
            if (databaseConversation) {
              output.conversation_id = databaseConversation.conversation_id;
              output.conversation_owner = parseInt(databaseConversation.metadata.owner_id, 10);
            }
            return output;
          });
          resolve(annotatedResults);
        },
        err => {
          reject(err);
        }
      )
    },
    err => {
      reject(err);
    }
  );
});

module.exports = findSalesforceLeads;