import initialState from './initialState';
import { deepAssign } from '../utils';

const leads = (state = initialState, action) => {
  switch(action.type) {
    case 'UPDATE_SEARCH_QUERY':
      return deepAssign(state, {ui: {searchQuery: action.payload}});
    case 'FIND_LEADS':
      if (typeof action.payload === 'undefined')
        return deepAssign(state, {ui: {searchLoading: true}, searchResults: undefined});
      else
        return deepAssign(state, {ui: {searchLoading: false}, searchResults: action.payload});
    case 'BEGIN_CONVERSATION':
      if (typeof action.payload === 'undefined')
        return deepAssign(state, {ui: {startingConversationWith: action.meta}});
      else if (!action.error)
        return deepAssign(state, {ui: {startingConversationWith: undefined}});
      else  // Error case
        return deepAssign(state, {ui: {startingConversationWith: action.payload}});
    case 'SELECT_FILTER':
      state.selectedLeadsFilter = Object.assign({}, state.selectedLeadsFilter, action.payload);
      return state;
    case 'LOAD_LEADS':
      if (action.payload)
        return Object.assign({}, state, {leads: action.payload.leads});
      else
        return state;
    default:
      return state;
  }
};

export default leads;
