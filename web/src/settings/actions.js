import { createAction } from 'redux-actions';
import { get, post } from '../api';
import { API_HOST } from '../api';
import { currentUser, currentSessionToken } from '../login/auth';

const connectZoom = createAction('CONNECT_ZOOM');
const disconnectZoom = createAction('DISCONNECT_ZOOM');
const loadingZoom = createAction('LOADING_ZOOM');
export const setZoomConnection = (connection) => {
  return dispatch => {
    if (connection === 'connected') {
      dispatch(loadingZoom());
      post('/zoom/connect', {}, (err, resp) => {
        if (err) {
          dispatch(connectZoom(err));
          return;
        } else {
          const { zoomHostID } = resp;
          dispatch(connectZoom(zoomHostID));
        }
      });
    } else if (connection === 'disconnected') {
      post('/zoom/disconnect', {}, (err, resp) => {
        if (err) {
          dispatch(disconnectZoom(err));
          return;
        } else {
          dispatch(disconnectZoom());
        }
      })
    }
  }
}

export const getZoomAccount = () => {
  return dispatch => {
    get('/zoom/account', (err, resp) => {
      if (err || resp.connectionStatus === 'disconnected')
        dispatch(disconnectZoom(err));
      else {
        dispatch(connectZoom(resp));
      }
    });
  }
}

const connectTimekit = createAction('CONNECT_TIMEKIT');
const disconnectTimekit = createAction('DISCONNECT_TIMEKIT');
const loadingTimekit = createAction('LOADING_TIMEKIT');
export const setTimekitConnection = (connection) => {
  return dispatch => {
    if (connection === 'connected') {
      dispatch(loadingTimekit());
      window.location = API_HOST + `/timekit/connect?st=${currentSessionToken()}`;
    } else if (connection === 'disconnected') {
      post('/timekit/disconnect', {}, (err, resp) => {
        if (err) {
          dispatch(disconnectTimekit(err));
          return;
        } else {
          dispatch(disconnectTimekit());
        }
      })
    }
  }
}

export const getTimekitAccount = () => {
  return dispatch => {
    const id = currentUser().id;
    get(`/timekit/account?id=${id}`, (err, resp) => {
      if (err || resp.connectionStatus === 'disconnected')
        dispatch(disconnectTimekit(err));
      else {
        dispatch(connectTimekit(resp));
      }
    });
  }
}