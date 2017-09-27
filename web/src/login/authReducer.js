const initialState = {
  email: '',
  password: '',
  result: undefined,
  user: undefined,
  loading: undefined,
  resetMode: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_EMAIL':
      return Object.assign({}, state, { email: action.payload, result: null, loading: false });
    case 'UPDATE_PASSWORD':
      return Object.assign({}, state, { password: action.payload, result: null, loading: false });
    case 'UPDATE_LOGIN_STATE':
      if (action.error)  // Login error
        return Object.assign({}, state, { result: action.payload, loading: false });
      else if (action.payload === 'loading')  // Login begun
        return Object.assign({}, state, { result: null, user: null, loading: true });
      else  // Login finished with user and without error
        return Object.assign({}, state, { result: null, user: action.payload, loading: false });
    case 'TOGGLE_RESET_MODE':
      return Object.assign({}, state, { resetMode: !state.resetMode, result: undefined });
    case 'UPDATE_RESET_REQUEST_STATE':
      if (action.error)
        return Object.assign({}, state, { result: action.payload, loading: false });
      else if (action.payload === 'loading')
        return Object.assign({}, state, { result: null, loading: true });
      else
        return Object.assign({}, state, { result: action.payload, loading: false });
    case 'UPDATE_RESET_STATE':
      if (action.error)
        return Object.assign({}, state, { result: action.payload, loading: false });
      else if (action.payload === 'loading')
        return Object.assign({}, state, { result: null, loading: true });
      else
        return Object.assign({}, state, { result: action.payload, loading: false });
    default:
      return state;
  }
}
export default reducer;