import initialState from './initialState';
import _ from 'lodash';
const LOADING_SIGNAL = undefined;
import { deepAssign, conversationWithID } from '../utils';

const _matches = (source, regex) => {
  if (!source)
    return false;
  const result = source.match(regex);
  if (!result)
    return false;
  return result.length > 0;
};
const filteredConversations = (allConversations, jumpFilter) => {
  let result = {};
  Object.keys(allConversations).forEach(key => {
    const conversations = allConversations[key];
    result[key] = conversations.filter(c => {
      const email = c.primary_user_email;
      const firstName = c.primary_user_first_name;
      const lastName = c.primary_user_last_name;
      const matcher = new RegExp("^" + jumpFilter, 'i');
      return _matches(email, matcher) || _matches(firstName, matcher) || _matches(lastName, matcher);
    });
  });
  return result;
};

const conversations = (state = initialState, action) => {
  switch(action.type) {
    case 'SELECT_CONVERSATION':
      return Object.assign({}, state, {selectedConversation: action.payload});
    case 'LOAD_FILTERS':
      if (!action.payload)
        return Object.assign({}, state, {conversations: {}})
      else if (action.error) {
        // Breaking out the filters like this should probably be handled in Filters.js, not here
        const conversations = {
          unanswered_unassigned: null,
          my_unanswered: null,
          my_active: null,
          archived: null
        };
        return Object.assign({}, state, { conversations, allConversations: conversations });
      }
      else
        return Object.assign({}, state, {conversations: action.payload, allConversations: action.payload});
    case 'LOAD_PROFILE':
      if (!action.payload)
        return Object.assign({}, state, {selectedProfile: LOADING_SIGNAL});
      else
        return Object.assign({}, state, {selectedProfile: action.payload});
    case 'UPDATE_PROFILE':
      if (action.error) {
        console.error('Need to better handle error in UPDATE_PROFILE: ' + action.payload);
        return state;
      }
      else {
        if (action.meta.fieldName !== 'name') {
          const profileUpdate = { [action.meta.fieldName]: action.payload };
          return deepAssign(state, { selectedProfile: profileUpdate });
        }
        else {
          // Need to update conversation as well
          const [first, last] = action.payload.split(/\s+/);
          const profileUpdate = { 'first_name': first, 'last_name': last };
          const newStateWithProfile = deepAssign(state, { selectedProfile: profileUpdate });
          const selectedConversationPointer = conversationWithID({ conversations: newStateWithProfile }, state.selectedConversation);
          selectedConversationPointer.primary_user_first_name = first;
          selectedConversationPointer.primary_user_last_name = last;
          return newStateWithProfile;
        }
      }
    case 'CREATE_LEAD':
      if (action.error) {
        console.error('Unhandled error in UPDATE_LEADS: ' + action.payload);
        return state;
      }
      else {
        const sfID = action.payload;
        const profileUpdate = {'salesforce_id': sfID};
        return deepAssign(state, { selectedProfile: profileUpdate });
      }
    case 'LOAD_STATS':
      if (!action.payload)
        return Object.assign({}, state, {selectedConversationStats: LOADING_SIGNAL});
      else
        return Object.assign({}, state, {selectedConversationStats: action.payload});
    case 'UPDATE_CONVERSATION_PREVIEW':
      const conversationID = action.meta.conversationID;
      var stateCopy = _.cloneDeep(state);
      // Mutate the copy by iterating through all conversations
      // and setting last_message on matching conversation to action.payload
      const conversations = stateCopy.conversations;
      Object.keys(conversations).forEach(key => conversations[key].forEach(conversation => {
        if (conversation.id === conversationID) {
          // action.payload is a `Message` object that might get mutated
          // Specifically, its `parts` might become `null`
          // Causing the issue in CS-239
          conversation.last_message = _.cloneDeep(action.payload);
        }
      }));
      return stateCopy;
    case 'SET_CREATE_CONVERSATION_WIDGET_STATE':
      return deepAssign(state, { ui: { createConversationWidgetState: action.payload }});
    case 'ACTION_BAR_ACTIVATE':
      return deepAssign(state, { ui: { actionBar: { active: true } }});
    case 'ACTION_BAR_DEACTIVATE':
      return deepAssign(state, { ui: { actionBar: { active: false } }});
    case 'UPDATE_COMPOSER_CONTENT':
      return deepAssign(state, { ui: { composerContent: action.payload }});
    case 'SELECT_MESSAGE':
      const afterSelect = state.ui.actionBar.selectedMessages.concat([action.payload]);
      return deepAssign(state, { ui: { actionBar: { selectedMessages: afterSelect }}});
    case 'DESELECT_MESSAGE':
      const afterDeselect = _.without(state.ui.actionBar.selectedMessages, action.payload);
      return deepAssign(state, { ui: { actionBar: { selectedMessages: afterDeselect }}});
    case 'DESELECT_ALL_MESSAGES':
      return deepAssign(state, { ui: { actionBar: { selectedMessages: [] }}});
    case 'SET_REMOVE_BOT_BUTTON_STATE':
      return deepAssign(state, { ui: { actionBar: { removeBotState: action.payload }}});
    case 'SET_SEND_EMAIL_BUTTON_STATE':
      return deepAssign(state, { ui: { actionBar: { sendEmailState: action.payload }}});
    case 'SET_SEND_SMS_BUTTON_STATE':
      return deepAssign(state, { ui: { actionBar: { sendSMSState: action.payload }}});
    case 'TOGGLE_ASSIGNEES':
      return deepAssign(state, { ui: { actionBar: { showAssignees: action.payload }}});
    case 'SET_ASSIGNEES':
      return deepAssign(state, { assignees: action.payload });
    case 'JUMP_FILTER':
      const jumpFilterValue = action.payload.trim();
      if (jumpFilterValue && jumpFilterValue.length > 0) {
        let changes = {
          ui: { jumpFilterValue },
          conversations: filteredConversations(state.conversations, jumpFilterValue)
        };
        if (state.ui.jumpFilterValue.length < 1) // No filter in place
          changes.allConversations = state.conversations;
        return deepAssign(state, changes);
      }
      else {
        return deepAssign(state, { ui: { jumpFilterValue: '' }, conversations: state.allConversations });
      }
    case 'LOAD_ZENDESK_TICKETS':
      const userID = action.meta;
      var tickets;
      if (action.error)
        tickets = { [userID]: action.payload };
      else if (action.payload)
        tickets = { [userID]: action.payload.tickets };
      else
        tickets = { [userID]: undefined };
      return deepAssign(state, { zendeskTickets: tickets });
    case 'SELECT_TAB':
      return deepAssign(state, { ui: { profileSelectedTab: action.payload }});
    case 'REASSIGN_SELECTED_CONVERSATION':
      stateCopy = _.cloneDeep(state);
      const selectedConversationID = state.selectedConversation;
      // Object.keys(stateCopy.allConversations).forEach(key => {
      //   stateCopy.allConversations[key].forEach(c => {
      //     if (c.id === selectedConversationID) {
      //       c.metadata.owner_id = action.payload;
      //       c.participants.push(action.payload);
      //       break;
      //     }
      //   })
      // });
      Object.keys(stateCopy.conversations).forEach(key => {
        stateCopy.conversations[key].forEach(c => {
          if (c.id === selectedConversationID) {
            c.metadata.owner_id = action.payload;
            c.participants.push(action.payload);
          }
        })
      });
      return stateCopy;
    default:
      return state
  }
}

export default conversations;
