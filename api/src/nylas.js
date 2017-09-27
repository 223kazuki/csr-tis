const qs = require('querystring');
const request = require('request');
const db = require('./database');
const Nylas = require('nylas').config({
  appId: process.env['NYLAS_API_ID'],
  appSecret: process.env['NYLAS_API_SECRET']
});
const { errorWithStatus, stripPrefix } = require('./util');
const patchMessageMetadata = require('./patch_message_metadata');
const LayerAPI = require('layer-api');
const layer = new LayerAPI({
  token: process.env.LAYER_SAPI_TOKEN,
  appId: process.env.LAYER_APP_ID
});

const callbackEndpoint = () => `${process.env['APP_HOST']}/nylas/cb`;
const loginURL = (agent) => {
  const query = {
    client_id: process.env['NYLAS_API_ID'],
    response_type: 'code',
    scope: 'email',
    login_hint: agent.email,
    redirect_uri: callbackEndpoint(),
    state: agent.id
  };
  return `https://api.nylas.com/oauth/authorize?${qs.stringify(query)}`;
};

const getAccessToken = (token) => new Promise((resolve, reject) => {
  // https://nylas.com/cloud/docs#step_3
  const body = {
    client_id: process.env['NYLAS_API_ID'],
    client_secret: process.env["NYLAS_API_SECRET"],
    grant_type: 'authorization_code',
    code: token
  };
  request.post({ url: 'https://api.nylas.com/oauth/token', form: body }, (err, _, body) => {
    if (err) return reject(err);
    const resp = (typeof body === 'string') ? JSON.parse(body) : body;
    if (resp.error)
      reject(resp)
    else
      resolve(resp)
  });
});

const saveAccessToken = (agentID, tokenResponse) => new Promise((resolve, reject) => {
  // https://nylas.com/cloud/docs#step_4
  const provider = tokenResponse.provider;
  const accountID = tokenResponse.account_id;
  const accessToken = tokenResponse.access_token;
  const nylasMetadata = { provider, accountID };
  const findPrimaryCalendar = (calendars) => new Promise((resolve, reject) => {
    // "The primary calendar of the account is usually named the same as the email address,
    // or sometimes simply called “Calendar.”"
    // https://nylas.com/cloud/docs?curl#calendars
    db.execute(db.sqlFromFile('find_user_by_id'), [agentID]).then(
      res => {
        const user = res.rows[0];
        if (!user)
          return reject(errorWithStatus(`No user found for agent ID ${agentID}`, 400));
        const email = user.email;
        const primaryCalendar = calendars.find(cal => cal.name === 'Calendar' || cal.name === email);
        if (!primaryCalendar)
          console.log(`Unable to find primary calendar for agent ${agentID}. All calendars: ${JSON.stringify(calendars)}`);
        resolve(primaryCalendar);
      },
      err => reject(err)
    );
  });
  db.execute(db.sqlFromFile('upsert_oauth_token'), [agentID, 'nylas', accessToken, null, nylasMetadata]).then(
    _ => {
      return db.execute(db.sqlFromFile('upsert_integration_id'), [agentID, 'nylas', accountID, { provider }]);
    },
    err => Promise.reject(err)
  ).then(
    _ => {
      return Nylas.with(accessToken).calendars.list();
    },
    err => Promise.reject(err)
  ).then(
    calendars => {
      return findPrimaryCalendar(calendars);
    },
    err => Promise.reject(err)
  ).then(
    primaryCalendar => {
      if (!primaryCalendar) {
        return Promise.resolve();  // Not necessarily a fatal issue at this point
      }
      else {
        return db.execute(db.sqlFromFile('upsert_integration_id'), [agentID, 'nylas-primary-calendar', primaryCalendar.id, { provider, accountID }]);
      }
    },
    err => Promise.reject(err)
  ).then(
    _ => resolve({ ok: true }),
    err => reject(errorWithStatus(err))
  );
});

const freeTimes = (agentID, rangeStart, rangeEnd, minDuration) => new Promise((resolve, reject) => {
  // Assumption: Only `timespan` events indicate that the agent is busy during that time
  // https://nylas.com/cloud/docs?node#timespan
  // minDuration is interpreted as an integer — minimum duration of returned ranges in seconds
  // It is optional; if not provided, all free time ranges will be returned
  const busyEvent = event => event.when.start_time && event.when.end_time;
  const sortedTimespanUnion = timespans => {
    const testBeginningOverlap = (timespanBase, timespanTarget) => {
      /************************************************************
      *
      *                      ====================
      *                      |                  |
      *   <------- Target ------->      Base    |
      *                      |                  |
      *                      ====================
      *
      *************************************************************/
      return timespanTarget.start_time < timespanBase.start_time &&
              timespanTarget.end_time >= timespanBase.start_time &&
              timespanTarget.end_time <= timespanBase.end_time;
    };
    const testEndingOverlap = (timespanBase, timespanTarget) => {
      /************************************************************
      *
      *    ====================
      *    |                  |
      *    |   Base      <------- Target ------->
      *    |                  |
      *    ====================
      *
      *************************************************************/
      return timespanTarget.start_time >= timespanBase.start_time &&
              timespanTarget.start_time <= timespanBase.end_time &&
              timespanTarget.end_time > timespanBase.end_time;
    };
    const testFullOverlap = (timespanBase, timespanTarget) => {
      /************************************************************
      *
      *    ======================
      *    |    Base            |
      *    |                    |
      *    |  <--- Target --->  |
      *    =====================
      *
      *************************************************************/
      return timespanTarget.start_time >= timespanBase.start_time &&
              timespanTarget.start_time <= timespanBase.end_time &&
              timespanTarget.end_time >= timespanBase.start_time &&
              timespanTarget.end_time <= timespanBase.end_time;
    };
    const testAnyOverlap = (base, target) => testBeginningOverlap(base, target) || testEndingOverlap(base, target) || testFullOverlap(base, target);
    const existingOverlapIndex = (existingSet, timespanTarget) => {
      return existingSet.findIndex((timespanBase) => testAnyOverlap(timespanBase, timespanTarget));
    };
    const unifyOverlap = (timespanBase, timespanTarget) => {
      if (testBeginningOverlap(timespanBase, timespanTarget)) {
        const newBase = Object.assign({}, timespanBase);
        newBase.start_time = timespanTarget.start_time;
        return newBase;
      }
      else if (testEndingOverlap(timespanBase, timespanTarget)) {
        const newBase = Object.assign({}, timespanBase);
        newBase.end_time = timespanTarget.end_time;
        return newBase;
      }
      else
        return timespanBase;
    };
    return timespans.reduce((unionSet, timespan) => {
      const overlapIndex = existingOverlapIndex(unionSet, timespan);
      if (overlapIndex >= 0) {
        unionSet[overlapIndex] = unifyOverlap(unionSet[overlapIndex], timespan);
        return unionSet
      }
      else {  // No overlap
        return unionSet.concat(timespan);
      }
    }, []).sort((timespan1, timespan2) => {
      if (timespan1.start_time < timespan2.start_time)
        return -1;
      else if (timespan1.start_time > timespan2.start_time)
        return 1;
      else
        return 0;
    });
  };
  const timespanDifference = (originalTimespan, removals) => {
    // Precondition: removals must be a sorted array of mutually-exclusive timespans.
    // It really should be the output of sortedTimespanUnion()
    if (removals.length < 1)
      return originalTimespan;
    const difference = removals.map((timespan, index) => {
      if (index === 0)
        return { start_time: originalTimespan.start_time, end_time: timespan.start_time };
      else
        return { start_time: removals[index - 1].end_time, end_time: timespan.start_time };
    });
    return difference.concat({ start_time: removals[removals.length - 1].end_time, end_time: originalTimespan.end_time });
  };
  console.log('agentID: ' + agentID);
  db.execute(db.sqlFromFile('get_integration_id_for_service_for_user'), [agentID, 'nylas-primary-calendar']).then(
    res => {
      const row = res.rows[0];
      console.log('res rows: ');
      console.dir(res.rows);
      if (!row)
        return Promise.reject(errorWithStatus(`No primary calendar found for agent ${agentID}. Try reconnecting your calendars (in the Settings page)`));
      const primaryCalendarID = row.remote_id;
      return Promise.all([
        Promise.resolve(primaryCalendarID),
        db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'nylas'])
      ]);
    },
    err => Promise.reject(err)
  ).then(
    ([primaryCalendarID, oauthRes]) => {
      const row = oauthRes.rows[0];
      if (!row)
        return Promise.reject(errorWithStatus(`No Nylas OAuth token found for agent ${agentID}`));
      const token = row.access_token;
      console.log(`NYLAS START: ${rangeStart} END: ${rangeEnd}`);
      return Nylas.with(token).events.list({
        expand_recurring: true,
        calendar_id: primaryCalendarID,
        starts_after: rangeStart - 1,
        starts_before: rangeEnd
      });
    },
    err => Promise.reject(err)
  ).then(
    events => {
      console.log("Nylas events: " + JSON.stringify(events));
      const busyEvents = events.filter(busyEvent);
      const busyTimes = busyEvents.map(evt => evt.when);
      const sortedBusyTimes = sortedTimespanUnion(busyTimes);
      let freeTimes = timespanDifference({ start_time: rangeStart, end_time: rangeEnd }, sortedBusyTimes);
      if (minDuration && minDuration > 0) {
        freeTimes = freeTimes.filter(timespan => timespan.end_time - timespan.start_time >= minDuration);
      }
      resolve({ ok: true, freeTimes });
    },
    err => reject(err)
  );
});

// TODO: remove hardcoding of 'user' object in index.js, make sure this if else fix works well below
const saveResponse = (user, messageID, selectedIndex, title, startString, endString, ownerID) => new Promise((resolve, reject) => {
  const patchOp = {
    operation: "set",
    property: `votes.${user.id}`,
    value: parseInt(selectedIndex, 10)
  };
  patchMessageMetadata(stripPrefix(messageID), [patchOp]).then(
    _ => {
      return new Promise((resolve, reject) => {
        if (ownerID)
          resolve(ownerID);
        else {
          layer.messages.getFromUser(user.id, messageID, (err, res) => {
            if (err)
              reject(err)
            else {
              const message = res.body;
              const senderID = message.sender.id;
              //console.log('Sender ID: ' + senderID);
              resolve(stripPrefix(senderID));
            }
          })
        }
      });
    },
    err => {
      return Promise.reject(err);
    }
  ).then(
    agentID => {
      const agent = db.execute(db.sqlFromFile('find_user_by_id'), [agentID]);
      const calendarID = db.execute(db.sqlFromFile('get_integration_id_for_service_for_user'), [agentID, 'nylas-primary-calendar']);
      const agentAuth = db.execute(db.sqlFromFile('find_oauth_token_for_user_and_service'), [agentID, 'nylas']);
      return Promise.all([agent, calendarID, agentAuth]);
    },
    err => Promise.reject(err)
  ).then(
    ([agentRes, calendarIDRes, oauthRes]) => {
      const agent = agentRes.rows[0];
      const calendarIDRow = calendarIDRes.rows[0];
      if (!calendarIDRow)
        return Promise.reject(errorWithStatus(`No primary calendar found for agent ${agent.id}`));
      const primaryCalendarID = calendarIDRow.remote_id;
      const oauthRow = oauthRes.rows[0];
      if (!oauthRow)
        return Promise.reject(errorWithStatus(`No Nylas OAuth tokens found for agent ${agent.id}`));
      const oauthToken = oauthRow.access_token;
      const nylas = Nylas.with(oauthToken);
      const event = nylas.events.build({
        title: title,
        calendarId: primaryCalendarID,
        when: { start_time: (new Date(startString)).getTime() / 1000, end_time: (new Date(endString)).getTime() / 1000 },
        participants: [{ email: user.email, name: `${user.first_name} ${user.last_name}` }, { email: agent.email, name: `${agent.first_name} ${agent.last_name}`}]
      });
      return event.save({notify_participants: true});
    },
    err => Promise.reject(err)
  )
  .then(
    _ => {
      resolve({ ok: true, patch: patchOp });
    },
    err => {
      reject(err);
    }
  );
});

module.exports = {
  loginURL,
  getAccessToken,
  saveAccessToken,
  freeTimes,
  saveResponse
};
