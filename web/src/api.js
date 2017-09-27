import { currentSessionToken } from './login/auth';

var API_HOST;
const host = window.location.host;
if (host.indexOf('localhost') >= 0)
  API_HOST = 'http://localhost:3001';
else if (host === 'dom-ui-prod.herokuapp.com' || host === 'csr.layer.com' || host === 'demo.layer.com')
  API_HOST = 'https://layer-dom-prod.herokuapp.com';
else if (host === 'dom-ui.herokuapp.com' || host === 'csr-staging.layer.com' || host === 'demo-staging.layer.com')
  API_HOST = 'https://layer-dom.herokuapp.com';
else if (host.indexOf('csr-ui.com') >= 0)
  API_HOST = 'http://csr-api.com:3001';
else {
  alert("You are running from an unsupported host: " + host);
  API_HOST = 'https://layer-dom.herokuapp.com';
}

export { API_HOST };

const fullURL = url => {
  if (url.indexOf('http') === 0)
    return url;
  else
    return `${API_HOST}${url}`;
};

const get = function(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('load', evt => {
    if (xhr.status >= 400 && xhr.status < 600) {
      let resp = xhr.responseText;
      try {
        resp = JSON.parse(resp);
        if (resp.error)
          callback(new Error(resp.error));
        else
          callback(new Error(xhr.responseText));
      } catch (_) {
        callback(new Error(xhr.responseText));
      }
      return;
    }
    const resp = xhr.responseText;
    var parsedResp;
    if (xhr.status === 204)
      parsedResp = null;
    else {
      try {
        parsedResp = JSON.parse(resp);
      }
      catch (e) {
        console.error(`JSON parse error making GET request to ${url}`);
        callback(e, null);
      }
    }
    callback(null, parsedResp);
  });
  // TODO: Dispatch error event
  xhr.addEventListener('error', evt => callback(new Error('XHR error'), null));
  xhr.open('GET', fullURL(url));
  xhr.withCredentials = true;
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('authorization', currentSessionToken());
  xhr.send();
}

const _dataReq = function(method, url, params, callback) {
  const urlEncode = (params) => Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
  const encodedParams = params.raw || urlEncode(params);
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('load', evt => {
    const status = xhr.status;
    const resp = xhr.responseText;
    var parsedResp;
    if (status >= 400) {
      try {
        parsedResp = JSON.parse(resp);
        if (parsedResp.severity === 'ERROR')
          callback(new Error(parsedResp.messageDetail));
        else if (parsedResp.error)
          callback(new Error(parsedResp.error));
        else
          callback(new Error(parsedResp))
      } catch (e) {
        callback(new Error(resp));
      }
      return;
    }

    if (status === 204)
      parsedResp = null;
    else {
      try {
        parsedResp = JSON.parse(resp);
      }
      catch (e) {
        console.error(`JSON parse error making ${method} request to ${url}: %o`, resp);
        callback(e, null);
      }
    }
    callback(null, parsedResp);
  });
  // TODO: Dispatch error event
  xhr.addEventListener('error', evt => callback(new Error('XHR error'), null));
  xhr.open(method, fullURL(url));
  xhr.setRequestHeader('authorization', currentSessionToken());
  xhr.withCredentials = true;
  const contentType = params.raw ? 'application/json' : 'application/x-www-form-urlencoded';
  xhr.setRequestHeader('Content-Type', contentType);
  xhr.send(encodedParams);
}

const post = _dataReq.bind(null, 'POST');
const patch = _dataReq.bind(null, 'PATCH');

export { get, post, patch };
