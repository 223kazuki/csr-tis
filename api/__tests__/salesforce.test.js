const qs = require('querystring');
require('dotenv').config({path: '../.env'});
jest.mock('request');
const request = require('request');
const db = require('../src/database');
const { setTestData, clearTestData } = require('./test_helper');

const {
  loginURL,
  getAccessToken,
  saveAccessToken,
  refreshAccessToken,
  createLead } = require('../src/salesforce');

describe('loginURL', () => {
  it("returns a URL (string)", () => {
    expect(typeof loginURL('_')).toEqual('string')
  });
  it("returns Salesforce's OAuth2 authorize endpoint", () => {
    expect(loginURL('_')).toMatch(/^https:\/\/login.salesforce.com\/services\/oauth2\/authorize/)
  });
  it("specifies response_type=code", () => {
    expect(loginURL('_')).toMatch(/response_type=code/)
  });
  it("specifies client_id based on env variable", () => {
    expect(loginURL('_')).toMatch(new RegExp(`client_id=${process.env['SALESFORCE_KEY']}`))
  });
  it("specifies redirect_uri as /salesforce/cb", () => {
    expect(loginURL('_')).toMatch(new RegExp('redirect_uri=' + qs.escape(`${process.env['APP_HOST']}/salesforce/cb`)))
  });
  it("specifies state as the provided agentID", () => {
    expect(loginURL('agentID')).toMatch(/state=agentID/)
  });
});

describe('getAccessToken', () => {
  beforeEach(() => {
    request.post.mockClear();
  });

  it("returns a Promise", () => {
    expect(getAccessToken('_') instanceof Promise).toBeTruthy()
  });
  it("makes POST request to Salesforce's OAuth2 token endpoint", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { url } = postCall[0];
        expect(url).toEqual('https://login.salesforce.com/services/oauth2/token')
      }
    )
  });
  it("specifies grant_type=authorization_code", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.grant_type).toEqual('authorization_code')
      }
    )
  });
  it("specifies client_id based on env variable", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.client_id).toEqual(process.env['SALESFORCE_KEY'])
      }
    )
  });
  it("specifies client_secret based on env variable", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.client_secret).toEqual(process.env['SALESFORCE_SECRET'])
      }
    )
  });
  it("specifies redirect_uri as /salesforce/cb", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.redirect_uri).toEqual(`${process.env['APP_HOST']}/salesforce/cb`)
      }
    )
  });
  it("specifies code as the provided authCode", () => {
    return getAccessToken('authCode').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.code).toEqual('authCode')
      }
    )
  });
  it("rejects if response contains an error", () => {
    request.__setMockResponse({error: 'invalid_grant', error_description: 'invalid authorization code'});
    return getAccessToken('_').then(
      _ => {},
      err => {
        expect(err.error).toEqual('invalid_grant')
      }
    )
  });
  it("resolves with body if there is no error", () => {
    request.__setMockResponse({access_token: 'token', refresh_token: 'refresh'});
    return getAccessToken('_').then(
      resp => {
        expect(resp.access_token).toEqual('token')
      }
    )
  });
  it("parses body as JSON if body is a string", () => {
    request.__setMockResponse("{\"access_token\": \"token\", \"refresh_token\": \"refresh\"}");
    return getAccessToken('_').then(
      resp => {
        expect(resp.access_token).toEqual('token')
      }
    )
  })
});

describe('saveAccessToken', () => {
  beforeEach((done) => {
    clearTestData('oauth_tokens')(done);
  });

  it("returns a Promise", () => {
    expect(saveAccessToken(1000000, 'token', 'refresh') instanceof Promise).toBeTruthy();
  });
  it("creates an OAuth token record", (done) => {
    return saveAccessToken(1000000, 'token', 'refresh').then(
      _ => {
        db.execute('SELECT * FROM oauth_tokens WHERE user_id = $1 AND service = $2', [1000000, 'salesforce'], (err, res) => {
          const record = res.rows[0];
          expect(record.access_token).toEqual('token');
          expect(record.refresh_token).toEqual('refresh');
          done();
        });
      }
    )
  });
});

describe('refreshAccessToken', () => {
  const agentIDFixture = 1000000;
  beforeEach((done) => {
    request.post.mockClear();
    clearTestData('oauth_tokens')((err) => {
      if (err) {
        return done(err);
      }
      setTestData(
        'oauth_tokens',
        ['user_id', 'service', 'access_token', 'refresh_token'],
        [[agentIDFixture, 'salesforce', 'access_token_fixture', 'refresh_token_fixture']])(done);
    })
  });

  it("returns a Promise", () => {
    expect(refreshAccessToken(agentIDFixture) instanceof Promise).toBeTruthy();
  });
//   it("rejects if database returns an error", () => {
//     database.__setMockRows(new Error('Error fixture'));
//     return refreshAccessToken('_').then(
//       _ => {},
//       err => expect(err.message).toEqual('Error fixture')
//     )
//   });
  it("rejects if no existing tokens found in database", () => {
    const nonexistantAgentIDFixture = agentIDFixture + 1;
    return refreshAccessToken(nonexistantAgentIDFixture).then(
      _ => {},
      err => {
        expect(err.status).toEqual(400);
        expect(err.message).toEqual(`No existing OAuth tokens found for agent ID ${nonexistantAgentIDFixture}`);
      }
    )
  });
  it("makes POST request to Salesforce's OAuth2 token endpoint", () => {
    return refreshAccessToken(agentIDFixture).then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { url } = postCall[0];
        expect(url).toEqual('https://login.salesforce.com/services/oauth2/token')
      }
    )
  });
  it("specifies grant_type=refresh_token", () => {
    return refreshAccessToken(agentIDFixture).then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.grant_type).toEqual('refresh_token')
      }
    )
  });
  it("specifies refresh_token as the refresh token found from database", () => {
    return refreshAccessToken(agentIDFixture).then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.refresh_token).toEqual('refresh_token_fixture');
      }
    )
  });
  it("specifies client_id based on env variable", () => {
    return refreshAccessToken(agentIDFixture).then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.client_id).toEqual(process.env['SALESFORCE_KEY'])
      }
    )
  });
  it("specifies client_secret based on env variable", () => {
    return refreshAccessToken(agentIDFixture).then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.client_secret).toEqual(process.env['SALESFORCE_SECRET'])
      }
    )
  });
  it("rejects if response contains an error", () => {
    request.__setMockResponse({error: 'invalid_grant', error_description: 'invalid authorization code'});
    return refreshAccessToken(agentIDFixture).then(
      _ => {},
      err => {
        expect(err.name).toEqual('invalid_grant')
      }
    )
  });
  it("parses body as JSON if body is a string", () => {
    request.__setMockResponse("{\"error\": \"invalid_grant\", \"error_description\": \"invalid authorization code\"}");
    return refreshAccessToken(agentIDFixture).then(
      _ => {},
      err => expect(err.name).toEqual('invalid_grant')
    )
  });
  it("updates database record with new token and current refresh token", (done) => {
    request.__setMockResponse("{\"access_token\": \"new_access_token_fixture\"}");
    return refreshAccessToken(agentIDFixture).then(
      _ => {
        db.execute('SELECT * FROM oauth_tokens WHERE user_id = $1 AND service = $2', [agentIDFixture, 'salesforce'], (err, res) => {
          const record = res.rows[0];
          expect(record.access_token).toEqual('new_access_token_fixture');
          done();
        });
      }
    )
  });
});

describe('createLead', () => {
  const agentIDFixture = 1000000;
  const accessTokenFixture = 'access_token_fixture';
  const refreshTokenFixture = 'refresh_token_fixture';
  beforeEach((done) => {
    request.mockClear();
    request.__setMockResponse("{\"success\": true}");
    clearTestData('oauth_tokens')((err) => {
      if (err) { return done(err); }
      setTestData(
        'oauth_tokens',
        ['user_id', 'service', 'access_token', 'refresh_token'],
        [[agentIDFixture, 'salesforce', accessTokenFixture, refreshTokenFixture]])(done);
    });
  });

  it('returns a Promise', () => {
    expect(createLead(agentIDFixture, {}) instanceof Promise).toBeTruthy();
  });
  it('makes POST request to Lead resource', () => {
    return createLead(agentIDFixture, {}).then(
      _ => {
        const requestCall = request.mock.calls[0];
        const requestOptions = requestCall[0];
        expect(requestOptions.url).toEqual('https://na11.salesforce.com/services/data/v38.0/sobjects/Lead');
        expect(requestOptions.method).toEqual('POST');
      },
      err => Promise.reject(err)
    )
  });
});