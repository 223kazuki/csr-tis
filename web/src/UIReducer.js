// import _ from 'lodash';
import initialState from './UIInitialState';

const uiReducer = (state = initialState, action) => {
  switch(action.type) {
    case 'SET_LOGO':
      return Object.assign({}, state, { logo: action.payload });
    default:
      return state;
  }
}

export default uiReducer;