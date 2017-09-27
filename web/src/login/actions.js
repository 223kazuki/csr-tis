import { createAction } from 'redux-actions';
import { login, COOKIE_SESSION_KEY, LOCALSTORAGE_USER_KEY } from './auth';
import cookie from 'react-cookie';
import { push } from 'react-router-redux';
import { connectWebSDK } from '../Layer';
import { post } from '../api';

const updateLoginState = createAction('UPDATE_LOGIN_STATE');
export const authenticate = () => {
  return (dispatch, getState) => {
    const authState = getState().auth;
    const { email, password } = authState;
    if (!email || !password) {
      dispatch(updateLoginState(new Error("Can't login without email or password")));
      return;
    }
    if (email.indexOf('layer.com') < 2) {
      dispatch(updateLoginState(new Error("Login with your @layer.com email")));
      return;
    }
    dispatch(updateLoginState('loading'));
    login(email, password, (err, resp) => {
      if (err) {
        dispatch(updateLoginState(err));
        return;
      }
      const { token, user } = resp;
      cookie.save(COOKIE_SESSION_KEY, token, { path: '/', maxAge: 7776000 });  // Max age 3 months
      localStorage[LOCALSTORAGE_USER_KEY] = JSON.stringify(user);
      connectWebSDK();
      dispatch(updateLoginState(user));
      dispatch(push('/'));
    });
  }
}

export const toggleResetMode = createAction('TOGGLE_RESET_MODE');

const updateResetRequestState = createAction('UPDATE_RESET_REQUEST_STATE');
export const requestReset = () => {
  return (dispatch, getState) => {
    const { email } = getState().auth;
    if (!email) {
      dispatch(updateResetRequestState(new Error("Can't reset password without email")));
      return;
    }
    dispatch(updateResetRequestState('loading'));
    post('/requestReset', { email }, (err, resp) => {
      if (err) {
        dispatch(updateResetRequestState(err));
        return;
      };
      dispatch(updateResetRequestState('Password reset email sent'));
    });
  }
}

const updateResetState = createAction('UPDATE_RESET_STATE');
export const resetPassword = (nonce) => {
  return (dispatch, getState) => {
    const { password } = getState().auth;
    if (!password) {
      dispatch(updateResetState(new Error("No new password provided")));
      return;
    }
    dispatch(updateResetState('loading'));
    post('/resetPassword', { nonce, password }, (err, resp) => {
      if (err) {
        dispatch(updateResetState(err));
        return;
      }
      dispatch(updateResetRequestState('Password reset successfully'));
    });
  }
};