import { get, post } from '../api';
import cookie from 'react-cookie';
import { parseQueryString, readCookie } from '../utils';

const COOKIE_SESSION_KEY = 'DOM_SESSION_TOKEN';
const LOCALSTORAGE_USER_KEY = 'DOM_USER';
export { COOKIE_SESSION_KEY, LOCALSTORAGE_USER_KEY };

const documentQueries = parseQueryString(document.location.search);

const sessionToken = () => readCookie(COOKIE_SESSION_KEY) || documentQueries['st'];
const isAuthenticated = () => sessionToken() && localStorage[LOCALSTORAGE_USER_KEY];
const tryResolvingSessionToken = callback => {
  get('/current_user', (err, resp) => {
    if (err) return callback(err);
    // TODO: Deduplicate with login actions
    // cookie.save(COOKIE_SESSION_KEY, documentQueries.st, { path: '/', maxAge: 7776000 });  // Max age 3 months
    localStorage[LOCALSTORAGE_USER_KEY] = JSON.stringify(resp);
    callback(null, resp);
  });
}
export { isAuthenticated, tryResolvingSessionToken };

const login = (email, password, cb) => {
  post('/login', { email, password }, (err, resp) => {
    if (err)
      cb(err, resp);
    else
      cb(null, resp);
  });
}
export { login };

const currentUser = () => JSON.parse(localStorage[LOCALSTORAGE_USER_KEY]);  // && evaluates to its second argument

const currentSessionToken = () => documentQueries.st || cookie.load(COOKIE_SESSION_KEY);
export { currentUser, currentSessionToken };

const isUserMode = () => window.location.pathname.indexOf('conversation/') > 0;
export { isUserMode };

const logout = () => {
  delete localStorage[LOCALSTORAGE_USER_KEY];
  cookie.remove(COOKIE_SESSION_KEY);
};
export { logout };
