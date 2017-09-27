const agentIDFixture = 1000000;
const agentEmailFixture = 'agent@test.com';
const agentOAuthFixture = 'zd-oauth-token';
const userIDFixture = 1000001;
const userEmailFixture = 'user@test.com';
const zendeskUserIDFixture = 'zd-user-remote-id';

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
  ticketsForUser } = require('../src/zendesk');

describe('loginURL', () => {
  it("returns a URL (string)", () => {
    expect(typeof loginURL('_')).toEqual('string')
  });
  it("returns Zendesk's OAuth2 authorize endpoint", () => {
    expect(loginURL('_')).toMatch(/^https:\/\/layer.zendesk.com\/oauth\/authorizations\/new/)
  });
  it("specifies response_type=code", () => {
    expect(loginURL('_')).toMatch(/response_type=code/)
  });
  it("specifies client_id based on env variable", () => {
    expect(loginURL('_')).toMatch(new RegExp(`client_id=${process.env['ZENDESK_IDENTIFIER']}`))
  });
  it("specifies redirect_uri as /zendesk/cb", () => {
    expect(loginURL('_')).toMatch(new RegExp('redirect_uri=' + qs.escape(`${process.env['APP_HOST']}/zendesk/cb`)))
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
  it("makes POST request to Zendesk's OAuth2 token endpoint", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { url } = postCall[0];
        expect(url).toEqual('https://layer.zendesk.com/oauth/tokens')
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
        expect(form.client_id).toEqual(process.env['ZENDESK_IDENTIFIER'])
      }
    )
  });
  it("specifies client_secret based on env variable", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.client_secret).toEqual(process.env['ZENDESK_SECRET'])
      }
    )
  });
  it("specifies redirect_uri as /zendesk/cb", () => {
    return getAccessToken('_').then(
      _ => {
        const postCall = request.post.mock.calls[0];
        const { form } = postCall[0];
        expect(form.redirect_uri).toEqual(`${process.env['APP_HOST']}/zendesk/cb`)
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
    expect(saveAccessToken(1000000, 'token') instanceof Promise).toBeTruthy();
  });
  it("creates an OAuth token record", (done) => {
    return saveAccessToken(1000000, 'token').then(
      _ => {
        db.execute('SELECT * FROM oauth_tokens WHERE user_id = $1 AND service = $2', [1000000, 'zendesk'], (err, res) => {
          const record = res.rows[0];
          expect(record.access_token).toEqual('token');
          done();
        });
      }
    )
  });
});

describe('ticketsForUser', () => {
  beforeEach((done) => {
    jest.unmock('request');
    clearTestData('users')(() => {
      setTestData('users', ['id', 'email'], [[agentIDFixture, agentEmailFixture], [userIDFixture, userEmailFixture]])(() => {
        setTestData('oauth_tokens', ['user_id', 'service', 'access_token'], [agentIDFixture, 'zendesk', agentOAuthFixture])(done)
      });
    });
  });
  it("returns a Promise", () => {
    expect(ticketsForUser(agentIDFixture, userIDFixture) instanceof Promise).toBeTruthy();
  });
  it("searches Zendenk for a user ID corresponding to user email if one doesn't exist", (done) => {
    request.__setMockResponse((params) => {
      if (params.url.match(/layer\.zendesk\.com\/api\/v2\/users\/search.json/))
        return {users: [{ id: zendeskUserIDFixture }]};
      else
        return {};
    });
    ticketsForUser(agentIDFixture, userIDFixture).then(
      _ => {
        db.execute('SELECT remote_id FROM integration_ids WHERE user_id = $1 AND service = $2', [userIDFixture, 'zendesk'], (err, res) => {
          if (err) {
            return done(err);
          }
          const row = res.rows[0];
          expect(row.remote_id).toEqual(zendeskUserIDFixture);
          done();
        });
      },
      err => done(err)
    )
  });
  it("gets all Zendesk tickets where the provided user is the requester", () => {
    request.__setMockResponse({ tickets: [{ foo: 'bar' }] });
    ticketsForUser(agentIDFixture, userIDFixture).then(
      res => {
        const tickets = res.tickets;
        expect(tickets[0].foo).toEqual('bar');
      }
    )
  });
})