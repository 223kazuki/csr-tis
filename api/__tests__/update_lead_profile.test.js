const { setTestData, clearTestData } = require('./test_helper');
const db = require('../src/database');

const updateLeadProfile = require('../src/update_lead_profile');

describe('updateLeadProfile', () => {
  // it('rejects Promise if database returns an error', () => {
  //   require(DATABASE_PATH).__setMockRows(new Error('Database error'));
  //   updateLeadProfile(52, {phone: '12345'}).then(
  //     () => {},
  //     err => expect(err.message).toEqual('Database error')
  //   );
  // })
  it('rejects Promise if no lead exists with provided leadID', () => {
    return updateLeadProfile(49, {company: 'MLM'}).then(
      () => {},
      err => expect(err.message).toEqual('No lead found for ID 49')
    )
  });
  it('updates existing lead when one key is provided', (done) => {
    // This test doesn't really test actual UPDATE functionality
    // require(DATABASE_PATH).__setMockRows([{ id: 82 }]);
    setTestData('leads', ['id'], [[82]])(() => {
      return updateLeadProfile(82, {'segment': 1000}).then(
        updateRes => {
          expect(updateRes.lead_id).toEqual(82);
          db.execute('SELECT * FROM leads WHERE id = $1', [82], (err, res) => {
            const lead = res.rows[0];
            expect(lead.segment).toEqual(1000);
            done();
          });
        }
      );
    });
  });
  it('updates existing lead when multiple keys are provided', (done) => {
    setTestData('leads', ['id'], [[27]])(() => {
      return updateLeadProfile(27, {'industry': 1000, 'employees': 499, 'department': 2000}).then(
        updateRes => {
          expect(updateRes.lead_id).toEqual(27);
          db.execute('SELECT * FROM leads WHERE id = $1', [27], (err, res) => {
            const lead = res.rows[0];
            expect(lead.industry).toEqual(1000);
            expect(lead.employees).toEqual(499);
            expect(lead.department).toEqual(2000);
            done();
          });
        }
      );
    });
  });
  it('succeeds but includes unallowed_keys in response if request includes unallowed keys', (done) => {
    setTestData('leads', ['id'], [[49]])(() => {
      return updateLeadProfile(49, {'email': 'test@layer.com', 'company': 'Blue Ocean'}).then(
        updateRes => {
          expect(updateRes.lead_id).toEqual(49);
          expect(updateRes.unallowed_keys).toEqual(['email']);
          done();
        }
      )
    });
  });
});