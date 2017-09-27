if (process.env.NODE_ENV !== 'production')
  require('dotenv').config({path: '../.env'});

const fs = require('fs');
if (!process.env.LAYER_APP_ID) {
  try {
    const config = JSON.parse(fs.readFileSync('./LayerConfiguration.json', 'utf8'));
    process.env.LAYER_APP_ID = config[0]['app_id'];
  } catch (e) {
    console.log("✘✘✘ Unable to configure `LAYER_APP_ID`. Error trying to read LayerConfiguration.json:\n" + e);
  }
}

if (process.env.NODE_ENV === 'production')
  require('newrelic');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const util = require('./src/util');

const src = (filename) => require(`./src/${filename}`);
const authenticatedUser = src('authenticated_user');
const filteredConversations = src('filtered_conversations');
const conversationStats = src('conversation_stats');
const userProfile = src('user_profile');
const updateLeadProfile = src('update_lead_profile');
const leadsList = src('leads');
const importLead = src('import_lead');
const sendPasswordResetEmail = src('send_password_reset_email');
const resetPassword = src('reset_password');
const agentAuthenticate = src('agent_authenticate');
const identityProviderAuthenticate = src('identity_provider_authenticate');
const registerAgent = src('register_agent');
const layerAuthenticate = src('layer_authenticate');
const startConversation = src('start_conversation');
const getMessageMetadata = src('get_message_metadata');
const patchMessageMetadata = src('patch_message_metadata');
const zoom = src('zoom');
const emailMessagesToProspect = src('email_messages_to_prospect');
const smsMessagesToProspect = src('sms_messages_to_prospect');
const emailAgentOnProspectAction = src('email_agent_on_prospect_action');
const salesforce = src('salesforce');
const findSalesforceLeads = src('find_salesforce_leads');
const createSalesforceLeads = src('create_salesforce_leads');
const getSalesforceLead = src('get_salesforce_lead');
const handleEmailReply = src('handle_email_reply');
const handleSMSReply = src('handle_sms_reply');
const getMetaTags = src('get_meta_tags');
const teamMembers = src('team_members');
const setTeamRole = src('set_team_role');
const inviteTeamMember = src('invite_team_member');
const zendesk = src('zendesk');
const nylas = src('nylas');
const inboundConversation = src('inbound_conversation');
const addAgentToConversation = src('add_agent_to_conversation');

const app = require('koa')();
const compose = require('koa-compose');
const cors = require('koa-cors');
const bodyParser = require('koa-bodyparser');
const multer = require('koa-multer');
const serve = require('koa-static');
const lodash = require('lodash');
const handlebars = require('handlebars');

const errorPageTemplate = handlebars.compile(fs.readFileSync('./public/500.html', 'utf8'));
// https://github.com/koajs/koa/wiki/Error-Handling
const errorHandler = function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    if (this.request.type === 'application/json')
      this.body = { ok: false, error: err.message, stack: err.stack };
    else
      this.body = errorPageTemplate({ stack: err.stack }).replace('          ', '');
    this.app.emit('error', err, this);
  }
}

/************************************************************
***                                                       ***
***                   Public routes                       ***
***                                                       ***
************************************************************/

const publicRouter = require('koa-router')();
publicRouter
  .get('/ping', function *(next) {
    this.body = 'PONG';
  })
  .get('/fail', function *(next) {
    throw new Error('Epic fail');
  })
  .post('/login', function *(next) {
    // Body should have parameters `email`, `password`
    this.body = yield agentAuthenticate(this.request.body);
  })
  .post('/requestReset', function *(next) {
    this.body = yield sendPasswordResetEmail(this.request.body.email);
  })
  .post('/resetPassword', function *(next) {
    this.body = yield resetPassword(this.request.body.nonce, this.request.body.password);
  })
  .get('/register', function *(next) {
    if (process.env.ENABLE_SIGNUP === 'true') {
      this.type = 'html';
      this.body = fs.readFileSync('./src/register.html', 'utf8');
    }
    else {
      this.type = 'text';
      this.body = 'DOM is currently not open to signups';
    }
  })
  .post('/register', function *(next) {
    const { email, password, first_name, last_name } = this.request.body;
    const agentID = yield registerAgent(email, password, first_name, last_name);
    this.redirect(`/salesforce/auth?agentID=${agentID}`);
  })
  .post('/authenticate', function *(next) {
    // Implement IIP authentication for consistency
    // https://github.com/layerhq/instastart-identity-provider#user-authentication
    this.body = yield identityProviderAuthenticate(this.request.body);
  })
  .post('/layer_authenticate', function *(next) {
    // Body should have parameters 'session_token' and `nonce` from Layer
    const body = this.request.body;
    if (!body.session_token)
      body.session_token = this.cookies.get('DOM_SESSION_TOKEN');
    console.log('Body: ' + JSON.stringify(body));
    this.body = yield layerAuthenticate(body);
  })
  .get('/message/:message_id', function *(next) {
    this.body = yield getMessageMetadata(this.params.message_id);
  })
  .patch('/message/:message_id', function *(next) {
    this.body = yield patchMessageMetadata(this.params.message_id, this.request.body);
  })
  .post('/trigger/:action', function *(next) {
    const { conversationID } = this.request.body;
    this.body = yield emailAgentOnProspectAction(conversationID, this.params.action);
  })
  .get('/salesforce/auth', function *(next) {
    console.log('Salesforce auth ' + this.query.agentID);
    this.redirect(salesforce.loginURL(this.query.agentID));
  })
  .get('/salesforce/cb', function *(next) {
    const agentID = this.query.state;
    console.log('Salesforce callback state: ' + agentID + ', code: ' + this.query.code);
    const tokenResponse = yield salesforce.getAccessToken(this.query.code);
    const { access_token, refresh_token } = tokenResponse;
    const saveResponse = yield salesforce.saveAccessToken(agentID, access_token, refresh_token);
    if (saveResponse.ok)
      this.redirect(process.env['UI_HOST']);
    else {
      this.status = 500;
      this.body = `Error saving access token: ${saveResponse}`;
    }
  })
  .post('/sendgrid/reply', function *(next) {
    yield handleEmailReply(this.req.body);
    this.body = 'ok';
  })
  .post('/bandwidth/reply', function *(next) {
    yield handleSMSReply(this.request.body);
    this.body = 'ok';
  })
  .post('/twilio/reply', function *(next) {
    yield handleSMSReply(this.request.body);
    // TODO: Better error handling — for example, the sender should be notified
    // if we can't find their number in the database
    this.body = '<Response></Response>';
  })
  .get('/meta', function *(next) {
    this.body = yield getMetaTags(this.query.uri);
  })
  .get('/zendesk/auth', function *(next) {
    this.redirect(zendesk.loginURL(this.query.agentID));
  })
  .get('/zendesk/cb', function *(next) {
    const agentID = this.query.state;
    const tokenResponse = yield zendesk.getAccessToken(this.query.code);
    if (tokenResponse.error)
      throw util.errorWithStatus(tokenResponse.error_description, 400);
    const { access_token } = tokenResponse;
    const saveResponse = yield zendesk.saveAccessToken(agentID, access_token);
    this.redirect(`${process.env['UI_HOST']}/settings`);
  })
  .get('/nylas/cb', function *(next) {
    const tokenResponse = yield nylas.getAccessToken(this.query.code);
    if (tokenResponse.error)
      throw util.errorWithStatus(tokenResponse.reason);
    const agentID = this.query.state;
    const saveResponse = yield nylas.saveAccessToken(agentID, tokenResponse);
    this.redirect(`${process.env['UI_HOST']}/settings`);
  })
  .get('/demo', function *(next) {
    const embedLayer = this.query.embedLayer;
    const conversationLink = (cid, token) => `${process.env.UI_HOST}/conversation/${util.stripPrefix(cid)}?st=${token}${embedLayer ? '&embedLayer=true' : ''}`;
    const sessionToken = this.cookies.get('DOM_SESSION_TOKEN') || this.header['authorization'] || this.query.st;
    if (sessionToken) {
      try {
        const { conversationID } = yield inboundConversation.getExistingConversation(sessionToken);
        this.redirect(conversationLink(conversationID, sessionToken));
      } catch (e) {
        // TODO: Handle this — has session token, but no associated conversation
      }
    }
    else {
      try {
        const { conversationID, sessionToken } = yield inboundConversation.createConversation();
        this.cookies.set('DOM_SESSION_TOKEN', sessionToken, { path: '/', maxAge: 31540000, httpOnly: false });  // Max age 12 months
        console.log(conversationLink(conversationID, sessionToken));
        this.redirect(conversationLink(conversationID, sessionToken));
      } catch (e) {
        this.body = e;
      }
    }
  })
  .get('/join', function *(next) {
    // TODO: This endpoint should be authenticated
    const conversationID = this.query.cid;
    try {
      yield inboundConversation.removeBotFromConversation(conversationID);
    } catch (e) {
      console.log("Error removing bot from conversation:");
      console.log(e);
    }
    this.redirect(`${process.env.UI_HOST}/c/${util.stripPrefix(conversationID)}`);
  })
.get('/getSfFields', function *(next) {
  this.body = yield createSalesforceLeads.getFields(this.state.user.id);
})


const publicRoutes = compose([publicRouter.routes(), publicRouter.allowedMethods()]);

/************************************************************
***                                                       ***
***                    Agent routes                       ***
***                                                       ***
************************************************************/

const requestUser = function *(next) {
  const sessionToken = this.cookies.get('DOM_SESSION_TOKEN') || this.header['authorization'] || this.query.st;
  if (!sessionToken || (typeof sessionToken === 'undefined') || sessionToken.length < 1) {
    this.state.user = undefined;
    yield next;
    return;
  }
  // Make `this.state.user` available to endpoints that care about it
  try {
    this.state.user = yield authenticatedUser(sessionToken);
  } catch (err) {
    this.state.user = undefined;
  }
  yield next;
};

const enforceRequestUser = function *(next) {
  if (!this.state.user) {
    this.status = 401;
    this.body = { ok: false, error: 'Not authenticated or bad session token' }
  }
  else if (!this.state.user.id) {
    this.status = 500;
    this.body = { ok: false, error: `Authenticated user missing ID: ${JSON.stringify(this.state.user)}` };
  }
  else {
    yield next;
  }
};
const agentRouter = require('koa-router')();
agentRouter
  .get('/current_user', function *(next) {
    this.body = this.state.user;
  })
  .get('/filters', function *(next) {
    this.body = yield filteredConversations(this.state.user.id);
  })
  .get('/getStats', function *(next) {
    this.body = yield conversationStats(this.state.user.id, this.query.conversationID);
  })
  .get('/profile', function *(next) {
    const agentID = this.state.user.id;
    this.body = yield userProfile(agentID, this.query.userID, (this.query.upstreamRefresh === 'true'));
  })
  .get('/leads', function *(next) {
    this.body = yield leadsList(this.query);
  })
  .patch('/editProfile', function *(next) {
    // This will need more robust error handling
    const agentID = this.state.user.id;
    this.body = yield updateLeadProfile.updateLeadProfile(agentID, this.query.leadID, this.request.body);
  })
  .post('/leads', function *(next) {
    this.body = yield importLead(this.request.body);
  })
  .post('/conversations', function *(next) {
    const agentID = this.state.user.id;
    this.body = yield startConversation(agentID, this.request.body);
  })
  .get('/zoom/account', function *(next) {
     this.body = yield zoom.getAccount(this.state.user.id);
  })
  .post('/zoom/create', function *(next) {
    const agentID = this.state.user.id;
    this.body = yield zoom.createMeeting(this.request.body.messageID, agentID);
  })
  .post('/zoom/connect', function *(next) {
    this.body = yield zoom.connect(this.state.user);
  })
  .post('/zoom/disconnect', function *(next) {
    this.body = yield zoom.disconnect(this.state.user.id);
  })
  .post('/sendEmail', function *(next) {
    var { conversationID, messageIDs } = this.request.body;
    if ((typeof messageIDs) === 'string')
      messageIDs = messageIDs.split(',');
    this.body = yield emailMessagesToProspect(this.state.user, messageIDs, conversationID);
  })
  .post('/sendSMS', function *(next) {
    var { conversationID, messageIDs } = this.request.body;
    if ((typeof messageIDs) === 'string')
      messageIDs = messageIDs.split(',');
    this.body = yield smsMessagesToProspect(this.state.user, messageIDs, conversationID);
  })
  .get('/searchSalesforceLeads', function *(next) {
    const query = this.query.q;
    const agentID = this.state.user.id;
    this.body = yield findSalesforceLeads(agentID, query);
  })

  .get('/salesforce/lead/:id', function *(next) {
    const agentID = this.state.user.id;
    this.body = yield getSalesforceLead(agentID, this.params.id, (this.query.persist === 'true'));
  })
  .get('/teamMembers', function *(next) {
    if (!this.state.user.team_id) {
      this.status = 500;
      this.body = { ok: false, error: `Authenticated user missing team_id: ${JSON.stringify(this.state.user)}` };
    }
    else {
      this.body = yield teamMembers(this.state.user.team_id);
    }
  })
  .patch('/toggleRole', function *(next) {
    const { roleName, enabled } = this.request.body;
    this.body = yield setTeamRole(this.state.user, roleName, enabled);
  })
  .post('/inviteAgent', function *(next) {
    const { firstName, lastName, email } = this.request.body;
    this.body = yield inviteTeamMember(this.state.user, firstName, lastName, email);
  })
  .get('/zendesk/tickets', function *(next) {
    const { userID } = this.query;
    const agentID = this.state.user.id;
    this.body = yield zendesk.ticketsForUser(agentID, userID);
  })
  .get('/nylas/auth', function *(next) {
    if (this.query.agentID) {
      console.log("here")
      const data = {
        'email': this.query.email,
        'id': this.query.agentID
      };
      this.redirect(nylas.loginURL(data));
    }
    else
      this.redirect(nylas.loginURL(this.state.user));
  })
  .get('/freeTimes', function *(next) {
    const { debug, duration } = this.query;
    const start = parseInt(this.query.start);
    const end = parseInt(this.query.end);
    if (!Number.isInteger(start) || !Number.isInteger(end))
      throw util.errorWithStatus('`start` and `end` query parameters should be UNIX timestamps', 400);
    // Check if bot --> need real agentID
    const timespans = yield nylas.freeTimes(this.state.user.id, start, end, duration);
    console.log("state user id: " + this.state.user.id);
    if (debug) {
      this.body = timespans.freeTimes.map((timespan) => {
        const startString = (new Date(timespan.start_time * 1000)).toLocaleString();
        const endString = (new Date(timespan.end_time * 1000)).toLocaleString();
        return `${startString} (${timespan.start_time}) – ${endString} (${timespan.end_time})`;
      });
    }
    else {
      this.body = timespans;
    }
  })
  .post('/scheduleEvent', function *(next) {
    // Addedd ownerID
    const { messageID, selectedIndex, title, start, end, ownerID } = this.request.body;

    // HARDCODED to Maddy for now
    this.body = yield nylas.saveResponse(this.state.user, messageID, selectedIndex, title, start, end, ownerID);
  })
  .post('/removeBot', function *(next) {
    const conversationID = this.query.cid;
    try {
      yield inboundConversation.removeBotFromConversation(conversationID);
    } catch (e) {
      console.log("Error removing bot from conversation:");
      console.log(e);
    }
    this.body = { ok: true };
  })
  .post('/autofillLeads', function *(next) {
    const conversationID = this.query.cid;
    //const leadID = this.query.leadID;
    const res = yield updateLeadProfile.autofillLeadProfile(conversationID);
    console.log('res: ' + JSON.stringify(res));
    this.body = { ok: true };
  })
  .post('/createLead', function *(next) {
    const agentID = this.state.user.id;
    var response = {ok: false, foo: 'bar'};
    try {
      response = yield createSalesforceLeads.createLeads(agentID, this.query.lid);
      this.body = response;
    } catch (e) {
      console.log("Error creating lead with leadID: " + this.query.lid);
      console.log(e);
      this.status = 400;
      this.body = e.message;
    }
  })
  .get('/agents', function *(next) {
    this.body = yield addAgentToConversation.availableAgents();
  })
  .post('/reassign', function *(next) {
    const { agentID, conversationID } = this.request.body;
    try {
      this.body = yield addAgentToConversation.addAgentToConversation(agentID, util.addPrefix(conversationID, 'conversations'));
    } catch (e) {
      console.log('Error reassigning conversation: ' + e);
      this.body = e;
    }
  })

const agentRoutes = compose([requestUser, enforceRequestUser, agentRouter.routes(), agentRouter.allowedMethods()]);

/************************************************************
***                                                       ***
***.                    App setup                         ***
***                                                       ***
************************************************************/

app
  .use(cors({ credentials: true, origin: true, methods: ['GET', 'POST', 'PATCH'] }))
  .use(serve('./public'))
  .use(errorHandler)
  .use(requestUser)
  .use(function *(next) {
    if (this.request.path == '/sendgrid/reply')
      // https://github.com/Foxandxss/koa-unless/blob/master/index.js#L27
      yield *multer().call(this, next);
    yield next;
  })
  .use(bodyParser())
  // .use(multer())
  .use(publicRoutes)
  .use(agentRoutes)
  .listen(process.env.PORT || 3001);
