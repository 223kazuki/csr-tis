import initialState from './initialState';
import { deepAssign } from '../utils';

const settings = (state = initialState, action) => {
  switch(action.type) {
    case 'CONNECT_ZOOM':
      return deepAssign(state, { zoom: { zoomHostID: action.payload, connectionStatus: 'connected' }});
    case 'DISCONNECT_ZOOM':
      return deepAssign(state, { zoom: { zoomHostID: undefined, connectionStatus: 'disconnected' }});
    case 'LOADING_ZOOM':
      return deepAssign(state, { zoom: { zoomHostID: undefined, connectionStatus: 'loading' }});
    case 'CONNECT_TIMEKIT':
      return deepAssign(state, { timekit: { userID: action.payload.userID, connectionStatus: 'connected' }});
    case 'DISCONNECT_TIMEKIT':
      return deepAssign(state, { timekit: { userID: undefined, connectionStatus: 'disconnected' }});
    case 'LOADING_TIMEKIT':
      return deepAssign(state, { timekit: { userID: undefined, connectionStatus: 'loading' }});
    default:
      return state;
  }
};

export default settings;