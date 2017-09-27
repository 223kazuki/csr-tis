import { createAction } from 'redux-actions';
import { get, post, patch } from '../api';

const loadTeamMembers = createAction('LOAD_TEAM_MEMBERS');
export const getTeamMembers = () => {
  return dispatch => {
    dispatch(loadTeamMembers());
    get('/teamMembers', (err, resp) => {
      if (err)
        dispatch(loadTeamMembers(err));
      else
        dispatch(loadTeamMembers(resp));
    });
  }
};

const updateRoleUI = createAction('UPDATE_ROLE_UI', 
  (_, roleName, enabled) => ({ roleName, enabled }),
  (userID) => ({ userID }));
export const toggleRole = (userID, roleName, enabled) => {
  return dispatch => {
    dispatch(updateRoleUI(userID, roleName, enabled));
    patch('/toggleRole', { roleName, enabled }, (err, res) => {
      if (err) {
        console.error(err);
        dispatch(updateRoleUI(userID, roleName, !enabled));
      }
    });
  }
};

const addPendingAgent = createAction('ADD_PENDING_AGENT', 
  (id, first_name, last_name, email) => ({ id, first_name, last_name, email }));
const updatePendingAgent = createAction('UPDATE_PENDING_AGENT',
  (_, x) => x,
  (tempID, _) => ({ tempID }));
export const inviteAgent = (firstName, lastName, email) => {
  return dispatch => {
    const temporaryID = (new Date()).getTime();
    dispatch(addPendingAgent(temporaryID, firstName, lastName, email));
    post('/inviteAgent', { firstName, lastName, email }, (err, resp) => {
      if (err)
        dispatch(updatePendingAgent(temporaryID, err));
      else
        dispatch(updatePendingAgent(temporaryID, resp));
    });
  }
};