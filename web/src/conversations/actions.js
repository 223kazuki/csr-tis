import _ from 'lodash';
import { createAction } from 'redux-actions';
import { get, post, patch } from '../api';
import { conversationWithID, stripPrefix } from '../utils';
import { currentUser } from '../login/auth';
import { WebSDK, LayerSDK } from '../Layer';
import { push } from 'react-router-redux';
import { messagePartsForEmailReceipt } from './cards/EmailReceipt';
import { messagePartsForSMSReceipt } from './cards/SMSReceipt';

const identity2 = (_, x) => x;

const loadProfile = createAction(
  'LOAD_PROFILE',
  identity2,
  (userID, _) => ({ userID }));
export const getProfile = userID => {
  return (dispatch, getState) => {
    const ui = getState().ui;
    if (ui.isDemo) {
      dispatch(loadProfile(userID, ui.demo.users[userID]));
      return;
    }
    dispatch(loadProfile(userID));
    get(`/profile?userID=${userID}&upstreamRefresh=true`, (err, resp) => {
      if (err)
        dispatch(loadProfile(userID, err));
      else
        dispatch(loadProfile(userID, resp));
    });
  }
};

const loadZendeskTickets = createAction('LOAD_ZENDESK_TICKETS', identity2, (uid, _) => uid);
export const getZendeskTickets = (primaryUserID) => {
  return (dispatch, getState) => {
    const { zendeskTickets } = getState().conversations;
    // TODO: Cache expiration
    if (!zendeskTickets[primaryUserID]) {
      dispatch(loadZendeskTickets(primaryUserID, undefined));
      get(`/zendesk/tickets?userID=${primaryUserID}`, (err, resp) => {
        if (err)
          dispatch(loadZendeskTickets(primaryUserID, err));
        else
          dispatch(loadZendeskTickets(primaryUserID, resp));
      });
    }
    else return;
  }
}

const hydrateDemoConversations = demoConversations => {
  const currentUserID = `${currentUser().id}`;
  const hydratedConversations = {};
  Object.keys(demoConversations).forEach(key => {
    const fullConversations = demoConversations[key].map(c => {
      const primaryUserID = c.primary_user.id;
      const userIdentity = new LayerSDK.Identity({ id: primaryUserID, client: WebSDK });
      const participants = [currentUserID, primaryUserID];
      const layerConversation = WebSDK.createConversation({ participants, distinct: false });
      let messages = [];
      if (c.messages && c.messages.length > 0) {
        messages = c.messages.map(m => {
          const layerMessage = layerConversation.createMessage(m.content);
          layerMessage.sender = m.sender === 'agent' ? WebSDK.user : userIdentity;
          return layerMessage;
        });
      }
      console.log(`CID ${layerConversation.id}, MIDs: ${messages.map(m => m.id)}`);
      return {
        created_at: (new Date()).toISOString(),
        id: layerConversation.id,
        last_message: null,
        metadata: { owner_id: currentUserID, primary_user_id: primaryUserID, status: '' },
        messages: messages,
        participants: participants,
        primary_user_email: c.primary_user.email,
        primary_user_first_name: c.primary_user.first_name,
        primary_user_last_name: c.primary_user.last_name
      };
    });
    hydratedConversations[key] = fullConversations;
  });
  return hydratedConversations;
};

const loadFilters = createAction('LOAD_FILTERS');
export const getFilters = callback => {  // callback … can this be done better?
  return (dispatch, getState) => {
    const { ui } = getState();
    if (ui.isDemo) {
      dispatch(loadFilters(hydrateDemoConversations(ui.demo.conversations)));
      return;
    }
    dispatch(loadFilters());
    get('/filters', (err, resp) => {
      if (err)
        dispatch(loadFilters(err));
      else
        dispatch(loadFilters(resp));

      const selectedConversation = getState().conversations.selectedConversation;
      // Overlap with `selectConversation` below
      // This codepath is necessary if loading a `/c/:cid` route on page load
      // Since a conversation will have been selected but the conversation list has not yet loaded
      if (selectedConversation) {
        const requestedConversation = conversationWithID(getState(), selectedConversation);
        if (requestedConversation && requestedConversation.metadata) {
          const primaryUserID = requestedConversation.metadata.primary_user_id;
          dispatch(getProfile(primaryUserID));
          dispatch(getZendeskTickets(primaryUserID));
        }
      }

      if (callback)
        callback(err, resp);
    });
  }
};
export const reloadFilters = () => {
  return (dispatch, getState) => {
    get('/filters', (err, resp) => {
      if (err)
        dispatch(loadFilters(err));
      else
        dispatch(loadFilters(resp));
    })
  }
};

const updateProfile = createAction(
  'UPDATE_PROFILE',
  (lid, fn, value) => value,
  (leadID, fieldName, _) => ({ leadID, fieldName }));
export const editProfile = ({ fieldName, value }) => {
  return (dispatch, getState) => {
    const selectedProfile = getState().conversations.selectedProfile;
    const leadID = selectedProfile.lead_id;
    // Optimistically update UI
    dispatch(updateProfile(leadID, fieldName, value));
    const payload = { [fieldName]: value };
    patch(`/editProfile?leadID=${leadID}`, payload, (err, resp) => {
      if (err)
        dispatch(updateProfile(leadID, fieldName, err));
      // No need to do anything if request succeeds
    });
  }
};

const loadStats = createAction(
  'LOAD_STATS',
  identity2,
  (conversationID, _) => ({ conversationID }));
export const getStats = conversationID => {
  return dispatch => {
    dispatch(loadStats(conversationID));
    get(`/getStats?conversationID=${conversationID}`, (err, resp) => {
      if (err)
        dispatch(loadStats(conversationID, err))
      else
        dispatch(loadStats(conversationID, resp))
    });
  }
}

const basicSelectConversation = createAction('SELECT_CONVERSATION');
export const selectConversation = (conversationID, firstLoad) => {
  return (dispatch, getState) => {
    dispatch(basicSelectConversation(conversationID));
    if (!firstLoad)
      dispatch(push(`/c/${stripPrefix(conversationID)}`));
    // Update stats and profile to match selected conversation
    // Current implementation naïvely allows a race condition:
    // If multiple conversations are selected in rapid succession,
    // the async network calls aren't guaranteed to match each other
    // or the selected conversation. This is unlikely given our controlled
    // running environment (fast servers and internet), so low priority for now
    dispatch(getStats(stripPrefix(conversationID)));
    const requestedConversation = conversationWithID(getState(), conversationID);
    if (requestedConversation && requestedConversation.metadata) {
      const primaryUserID = requestedConversation.metadata.primary_user_id;
      dispatch(getProfile(primaryUserID));
      dispatch(getZendeskTickets(primaryUserID));
    }
  };
};

export const updateConversationPreview = createAction(
  'UPDATE_CONVERSATION_PREVIEW',
  identity2,
  (conversationID, _) => ({ conversationID }));

export const updateComposerContent = createAction('UPDATE_COMPOSER_CONTENT');

export const setCreateConversationWidgetState = createAction('SET_CREATE_CONVERSATION_WIDGET_STATE');
export const inviteToChat = (email, firstName, lastName) => {
  return dispatch => {
    dispatch(setCreateConversationWidgetState('loading'));
    post(`/conversations`, { email, firstName, lastName }, (err, resp) => {
      if (err) {
        dispatch(setCreateConversationWidgetState(err));
        setTimeout(() => dispatch(setCreateConversationWidgetState('default')), 3500);
      }
      else {
        const conversationID = resp.id;
        dispatch(setCreateConversationWidgetState('invited'))
        setTimeout(() => dispatch(setCreateConversationWidgetState('default')), 2000);
        dispatch(getFilters((err, resp) => {
          if (err)  // TODO: Better handle error here
            dispatch(setCreateConversationWidgetState(err));
          else {
            dispatch(selectConversation(conversationID));
          }
        }))
      }
    });
  }
};

export const activate = createAction('ACTION_BAR_ACTIVATE');
export const deactivate = createAction('ACTION_BAR_DEACTIVATE');
export const selectMessage = createAction('SELECT_MESSAGE');
export const deselectMessage = createAction('DESELECT_MESSAGE');
export const deselectAllMessages = createAction('DESELECT_ALL_MESSAGES');

export const setSendEmailButtonState = createAction('SET_SEND_EMAIL_BUTTON_STATE');
export const sendEmail = () => {
  return (dispatch, getState) => {
    const conversationID = getState().conversations.selectedConversation;
    const messageIDs = _.uniq(getState().conversations.ui.actionBar.selectedMessages);
    dispatch(setSendEmailButtonState('sending'));
    post('/sendEmail', { conversationID, messageIDs }, (err, resp) => {
      if (err) {
        dispatch(setSendEmailButtonState(err));
        setTimeout(() => dispatch(setSendEmailButtonState('default')), 5000);
      }
      else {
        dispatch(setSendEmailButtonState('sent'));
        setTimeout(() => {
          dispatch(deselectAllMessages());
          dispatch(setSendEmailButtonState('default'));
          document.querySelectorAll('.layer-message-action-select').forEach(checkbox => checkbox.checked = false);
        }, 3500);
        const conversationInstance = WebSDK.getConversation(conversationID, true);
        const message = conversationInstance.createMessage({
          parts: messagePartsForEmailReceipt(messageIDs.length)
        });
        message.send();
      }
    })
  }
}

export const setSendSMSButtonState = createAction('SET_SEND_SMS_BUTTON_STATE');
export const sendSMS = () => {
  return (dispatch, getState) => {
    const conversationID = getState().conversations.selectedConversation;
    const messageIDs = _.uniq(getState().conversations.ui.actionBar.selectedMessages);
    dispatch(setSendSMSButtonState('sending'));
    post('/sendSMS', { conversationID, messageIDs }, (err, resp) => {
      if (err) {
        dispatch(setSendSMSButtonState(err));
        setTimeout(() => dispatch(setSendSMSButtonState('default')), 5000);
      }
      else {
        dispatch(setSendSMSButtonState('sent'));
        setTimeout(() => {
          dispatch(deselectAllMessages());
          dispatch(setSendSMSButtonState('default'));
          document.querySelectorAll('.layer-message-action-select').forEach(checkbox => checkbox.checked = false);
        }, 3500);
        const conversationInstance = WebSDK.getConversation(conversationID, true);
        const message = conversationInstance.createMessage({
          parts: messagePartsForSMSReceipt(messageIDs.length)
        });
        message.send();
      }
    })
  }
}

export const setRemoveBotButtonState = createAction('SET_REMOVE_BOT_BUTTON_STATE');
export const removeBot = () => {
  return (dispatch, getState) => {
    const conversationID = getState().conversations.selectedConversation;
    dispatch(setRemoveBotButtonState('removing'));
    post(`/removeBot?cid=${conversationID}`, {}, (err, resp) => {
      if (err) {
        dispatch(setRemoveBotButtonState(err));
        setTimeout(() => dispatch(setRemoveBotButtonState('default')), 5000);
      }
      else {
        dispatch(setRemoveBotButtonState('done'));
        setTimeout(() => dispatch(setRemoveBotButtonState('default')), 3500);
      }
    });
  }
}

export const jumpFilter = createAction('JUMP_FILTER');

export const selectTab = createAction('SELECT_TAB');

export const createLead = createAction('CREATE_LEAD');
export const createSalesforceLead = cb => {
  return (dispatch, getState) => {
    const profile = getState().conversations.selectedProfile;
    console.log('Profile: %o', profile);
    const leadID = profile['lead_id'];
    // TODO: Do something with profile; should get salesforce ID back to update selected profile state
    post(`/createLead?lid=${leadID}`, {}, (err, resp) => {
      if (err) {
        dispatch(createLead(err));
        cb(err);
      }
      else {
        const sfID = resp.id;
        setTimeout(() => { dispatch(createLead(sfID)) }, 1500);
      }
      cb(err, resp);
    })
  }
}

export const toggleAssignees = createAction('TOGGLE_ASSIGNEES');
export const setAssignees = createAction('SET_ASSIGNEES');
export const showOtherAgents = () => {
  return (dispatch, getState) => {
    var agents = getState().conversations.assignees;
    if (!agents) {
      get('/agents', (err, resp) => {
        if (err)
          dispatch(setAssignees(err));
        else
          dispatch(setAssignees(resp));
      });
    }
    dispatch(toggleAssignees(true));
  }
}

export const reassignSelectedConversation = createAction('REASSIGN_SELECTED_CONVERSATION');
export const reassignToAgent = newAgentID => {
  return (dispatch, getState) => {
    dispatch(reassignSelectedConversation(newAgentID))
    const conversationID = getState().conversations.selectedConversation;
    post('/reassign', { agentID: newAgentID, conversationID }, (err, resp) => {
      if (err)
        alert('Error reassigning conversation: ' + err);
      else
        dispatch(reassignSelectedConversation(newAgentID));
    });
  }
}
