import { get } from './api';

const _cache = {};

const IdentityCache = {
  getDisplayNameForID: (userID, callback) => {
    if (_cache[userID]) {
      callback(this._cache[userID]);
      return;
    }

    get(`/users/${userID}`, (err, res) => {
      if (err)
        callback(userID);
      else {
        const name = `${res.first_name} ${res.last_name}`
        _cache[userID] = name;
        callback(name);
      }
    });
  }
}

export default IdentityCache;