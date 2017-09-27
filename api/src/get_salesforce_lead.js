const db = require('./database');
const { makeAPIRequest } = require('./salesforce');
const leadEnumFieldsPath = process.env.NODE_ENV === 'production' ? './LeadEnumFields' : '../../common/LeadEnumFields';
const enumFields = require(leadEnumFieldsPath);
const { e164PhoneNumber } = require('./util');

const getSalesforceLead = (agentID, leadID, shouldPersist) => new Promise((resolve, reject) => {
  const path = `/sobjects/Lead/${leadID}`;
  makeAPIRequest(agentID, path, (err, body) => {
    if (err) {
      return reject(err);
    }

    var parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      return reject(parseError);
    }
    if (!shouldPersist) return resolve(parsedBody);

    db.execute(db.sqlFromFile('find_lead_by_salesforce_id'), [leadID], (err, res) => {
      if (err) {
        return reject(err);
      }
      const existingLead = res.rows[0];
      var {
        Id,
        OwnerId,
        Status,
        LeadSource,
        Segment_calc__c,
        Industry,
        Employee_Size__c,
        Department__c,
        Address
      } = parsedBody;
      const phone = e164PhoneNumber(parsedBody.Phone) || existingLead.phone || null;
      const company = parsedBody.Company || existingLead.company || null;
      const statusInt = enumFields['status'][Status] || existingLead.status || 1999;
      const sourceInt = enumFields['source'][LeadSource] || existingLead.source || 2999;
      const segmentInt = enumFields['segment'][Segment_calc__c] || existingLead.segment || 3999;
      const industryInt = enumFields['industry'][Industry] || existingLead.industry || 4999;
      const employeeSizeInt = enumFields['employees'][Employee_Size__c] || existingLead.employees || 8999;
      const departmentInt = enumFields['department'][Department__c] || existingLead.department || 5999;
      const street = Address.street || existingLead.street || null;
      const city = Address.city || existingLead.city || null;
      const state = Address.state || existingLead.state || null;
      const postalCode = Address.postalCode || existingLead.postalCode || null;
      db.execute(db.sqlFromFile('upsert_lead_by_salesforce_id'), [Id, OwnerId, statusInt, sourceInt, phone, company, segmentInt, industryInt, employeeSizeInt, departmentInt, null, street, city, state, postalCode], (err) => {
        if (err)
          reject(err);
        else
          resolve(parsedBody);
      });
    });
  });
});

module.exports = getSalesforceLead;
