import _ from 'lodash';
import initialState from './TeamInitialState';

const team = (state = initialState, action) => {
  switch(action.type) {
    case 'LOAD_TEAM_MEMBERS':
      if (action.error)
        return Object.assign({}, state, { members: action.payload });
      else if (!action.payload)
        return Object.assign({}, state, { members: undefined });
      else
        return Object.assign({}, state, { members: action.payload });
    case 'UPDATE_ROLE_UI': {
      const { userID } = action.meta;
      const { roleName, enabled } = action.payload;
      let newState = _.cloneDeep(state);
      newState.members.forEach(member => {
        if (member.id !== userID)
          return;
        if (enabled)
          member.roles.push(roleName);
        else
          _.remove(member.roles, role => role === roleName);
      });
      return newState;
    }
    case 'ADD_PENDING_AGENT':
      const newMember = Object.assign(
        { pending: true, roles: ['agent'] }, 
        action.payload
      );
      return Object.assign({}, state, { members: state.members.concat(newMember) });
    case 'UPDATE_PENDING_AGENT': {
      const { tempID } = action.meta;
      let newState = _.cloneDeep(state);
      newState.members.forEach(member => {
        if (member.id !== tempID)
          return;
        if (action.error)
          member.error = action.payload;
        else
          member.id = action.payload.id;
      });
      return newState;
    }
    default:
      return state;
  }
}

export default team;