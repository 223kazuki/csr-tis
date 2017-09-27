const agentIDFixture = 999999;
const userIDFixture = 1000000;
const userEmailFixture = 'user@test.com';
const leadIDFixture = 2000000;
const leadSalesforceIDFixture = 'abc';
const leadCompanyFixture = 'Test company';
const leadStatusFixture = 99;

const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');
const userProfile = require('../src/user_profile');
jest.mock('../src/get_salesforce_lead');
const getSalesforceLeadMock = require('../src/get_salesforce_lead');
getSalesforceLeadMock.mockImplementation(() => new Promise((resolve, reject) => {
  db.execute('UPDATE leads SET status = $1 WHERE id = $2', [leadStatusFixture, leadIDFixture], (err, res) => {
    if (err)
      reject(err);
    else
      resolve();
  });
}));

describe('userProfile', () => {
  const clearDatabase = (done) => {
    clearTestData('users')(() => {
      clearTestData('lead_users')(() => {
        clearTestData('leads')(done);
      });
    });
  };
  beforeEach((done) => {
    clearDatabase(() => {
      setTestData('users', ['id', 'email'], [[userIDFixture, userEmailFixture]])(() => {
        setTestData('leads', ['id', 'salesforce_id', 'company'], [[leadIDFixture, leadSalesforceIDFixture, leadCompanyFixture]])(() => {
          setTestData('lead_users', ['lead_id', 'user_id'], [[leadIDFixture, userIDFixture]])(done)
        });
      });
    });
  });
  it('returns a Promise', () => {
    expect(userProfile() instanceof Promise).toBeTruthy();
  });
  // it('rejects Promise if database returns an error', () => {
  //   require(DATABASE_PATH).__setMockRows(new Error('Database error'));
  //   userProfile().then(
  //     () => {},
  //     err => expect(err.message).toEqual('Database error')
  //   );
  // });
  it('can return a user and lead profile', () => {
    return userProfile(agentIDFixture, userIDFixture, false).then(
      user => {
        expect(user.id).toEqual(userIDFixture);
        expect(user.email).toEqual(userEmailFixture);
        expect(user.company).toEqual(leadCompanyFixture);
      }
    );
  });
  it('can return an empty object', (done) => {
    clearDatabase(() => {
      return userProfile(agentIDFixture, userIDFixture, false).then(
        record => {
          expect(Object.keys(record).length).toEqual(0);
          done();
        }
      );
    });
  });

  describe('refreshing from Salesforce', () => {
    it('rejects with error if user ID does not exist in database', () => {
      const nonexistantUserIDFixture = userIDFixture + 1;
      return userProfile(agentIDFixture, nonexistantUserIDFixture, true).then(
        _ => {},
        err => {
          expect(err.status).toEqual(400);
          expect(err.message).toEqual(`No lead or user found for user ID ${nonexistantUserIDFixture}`);
        }
      )
    });
    it('calls getSalesforceLead', () => {
      return userProfile(agentIDFixture, userIDFixture, true).then(
        _ => {
          const mockCall = getSalesforceLeadMock.mock.calls[0];
          expect(mockCall[0]).toEqual(agentIDFixture);
          expect(mockCall[1]).toEqual(leadSalesforceIDFixture);
          expect(mockCall[2]).toBeTruthy();
        }
      )
    });
    it('returns updated user and lead profile', () => {
      return userProfile(agentIDFixture, userIDFixture, true).then(
        user => {
          expect(user.id).toEqual(userIDFixture);
          expect(user.status).toEqual(leadStatusFixture);
        }
      )
    });
  });
});