const sf = require('./salesforce');
const findSF = require('./find_salesforce_leads');
const db = require('./database');
const { errorWithStatus } = require('./util');

const updateSalesforceLeads = (agentID, leadID) => new Promise((resolve, reject) => {
	// For that userID, go through each column of db in leads and use api to update information
	// const leads = sf.findSalesforceLeads(agentID, leadID);
	// TODO: add error checking
	db.execute('SELECT * FROM leads WHERE id=$1', [leadID], (err, res) => {
		if (err)
	      reject(err);
	    const data = res.rows[0];
	    if (res.rowCount < 1) {
	      reject(errorWithStatus(`No Salesforce data found for leadID ${leadID}`, 400));
	    }
	    else {
	    	console.log('data: ' + JSON.stringify(data));
	    	sf.createLead(agentID, data).then(
	    		r => resolve(r),
	    		e => reject(e)
	    	)
	     }
	  });
});

const getFields = (agentID) => new Promise((resolve, reject) => {
	const path = '/sobjects/Lead/00Q4A00001C0GqaUAF';
	const res = sf.makeAPIRequest(agentID, {path: path, method: 'GET'}, (err, res) => {
		if (err)
			reject(err);
		else
			resolve(res);
	});
})

module.exports = { updateSalesforceLeads, getFields };