import { createAction } from 'redux-actions';
import { get, post } from '../api';
import { push } from 'react-router-redux';
import { getFilters, selectConversation } from '../conversations/actions';
import { currentUser } from '../login/auth';

export const selectFilter = createAction('SELECT_FILTER');

const loadLeads = createAction(
  'LOAD_LEADS',
  (filter, value) => value,
  (filter, _) => ({ filter }));
export const getLeads = filter => {
  return (dispatch, getState) => {
    const { auth, leads } = getState();
    dispatch(loadLeads(filter));
    get(`/leads?owner=${auth.user.id}&status=${leads.selectedLeadsFilter.status}&segment=${leads.selectedLeadsFilter.segment}`, (err, resp) => {
      if (err)
        dispatch(loadLeads(filter, err))
      else
        dispatch(loadLeads(filter, resp))
    })
  }
}

export const updateSearchQuery = createAction('UPDATE_SEARCH_QUERY');

const findLeads = createAction('FIND_LEADS');
export const searchSalesforceLeads = query => {
  return dispatch => {
    dispatch(findLeads());
    get(`/searchSalesforceLeads?q=${encodeURIComponent(query)}`, (err, resp) => {
      if (err)
        dispatch(findLeads(err));
      else
        dispatch(findLeads(resp));
    });
  }
};

const beginConversation = createAction('BEGIN_CONVERSATION', (_, payload) => payload, (id, _) => id);
export const startConversation = searchResult => {
  return dispatch => {
    // if searchResult.lead_id is defined, lead already exists in database — no need to create it
    // If searchResult.conversation_id is defined, the conversation already exists in database
    // If searchResult.conversation_owner matches the current agent ID, then the current agent owns
    //   that conversation and can be taken to it directly. Otherwise, someone else owns that conversation.
    const { Id, Name, Email } = searchResult;
    dispatch(beginConversation(Id));
    const startConversation = () => {
      post('/conversations', { email: Email }, (err, resp) => {
        if (err) return dispatch(beginConversation(Id, err));

        dispatch(beginConversation(true));  // Finish "begin conversation" flow
        const conversationID = resp.id;
        // Navigate to Conversations page
        dispatch(push('/'));
        // May have to reload conversations list
        dispatch(getFilters((err, _) => {
          if (err) {
            // TODO: More elegant error handling here
            alert('Error refreshing filters, try refreshing manually: ' + err.message);
          }
          else {
            // Select new conversation
            dispatch(selectFilter('my_active'));
            dispatch(selectConversation(conversationID));
          }
        }));
      });
    };
    if (!searchResult.lead_id) {
      // Create user for target
      // Create lead for target
      post('/leads', { salesforceID: Id, email: Email, name: Name }, (err, resp) => {
        if (err) return dispatch(beginConversation(Id, err));

        // POST /conversations with { email } — get conversation ID back
        startConversation();
      });
    }
    else {
      if (!searchResult.conversation_id)
        startConversation();
      else if (searchResult.conversation_owner === currentUser().id) {
        dispatch(push('/'));
        dispatch(beginConversation(true));
        dispatch(selectFilter('my_active'));
        dispatch(selectConversation(searchResult.conversation_id));
      }
      else {
        alert(`Trying to begin conversation with searchResult ${JSON.stringify(searchResult)}; this should not happen`);
      }
    }
  }
}
