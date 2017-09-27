export function addClass(element, newClass) {
  var currentClasses = element.className.split(/\s+/);
  if (currentClasses.indexOf(newClass) >= 0)
    return;
  else if (currentClasses.length === 0)
    element.className = newClass;
  else
    element.className += (' ' + newClass);
};
export function removeClass(element, targetClass) {
  var classes = element.className.split(/\s+/);
  var targetIndex = classes.indexOf(targetClass);
  if (targetIndex < 0)
    return;
  else {
    classes.splice(targetIndex, 1);
    element.className = classes.join(' ');
  }
};

export function conversationWithID(state, conversationID) {
  if (!conversationID)
    return undefined;
  const conversations = state.conversations.conversations;
  var requestedConversation;
  Object.keys(conversations).forEach(filter => conversations[filter].forEach(conversation => {
    if (conversation.id === conversationID)
      requestedConversation = conversation;
  }));
  return requestedConversation;
};

export function stripPrefix(prefixedLayerID) {
  const pieces = prefixedLayerID.split('/');
  return pieces[pieces.length - 1];
}

export function assignKeyPath(state, keypath, newValue) {
  if (keypath.length < 1)
    return state;
  let pieces = Array.isArray(keypath) ? keypath : keypath.split('.');
  if (pieces.length === 1) {
    let newObj = {};
    newObj[pieces[0]] = newValue;
    return Object.asign(state, newObj);
  }
  else {
    let newObj = {};
    newObj[pieces[0]] = assignKeyPath(state[pieces[0]], keypath.slice(1), newValue);
    return Object.assign(state, newObj);
  }
}

export function deepAssign(state, assignment) {
  let stateCopy = Object.assign({}, state);
  for (var key in assignment) {
    if (!assignment.hasOwnProperty(key))
      continue;
    let value = assignment[key];
    if (value instanceof Error)  // Don't mangle error `message`
      stateCopy[key] = value;
    else if (typeof value === 'object' && !Array.isArray(value))      // Recurse on all other objects
      stateCopy[key] = deepAssign(state[key], value);
    else
      stateCopy[key] = value;
  }
  return stateCopy;
}

export function isStaging() {
  return (window.location.host.indexOf('herokuapp') >= 0 && window.location.host.indexOf('prod') < 0)
         || window.location.host.indexOf('staging') >= 0;
}

export function isDev() {
  return window.location.host.indexOf('localhost') >= 0;
}

export function snakeCaseToTitle(snake) {
  return snake.split('_').map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`).join(' ');
}

export function uuid4() {
  // https://gist.github.com/jed/982883#gistcomment-45104
  return(""+1e7+-1e3+-4e3+-8e3+-1e11).replace(/1|0/g,function(){return(0|Math.random()*16).toString(16)})
}

const querySplitRegex = /[?&]?([^=]+)=([^&]*)/g;
export function parseQueryString(qs) {
  qs = qs.split('+').join(' ');
  var params = {},
      tokens;

  while (tokens = querySplitRegex.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }
  return params;
}

// https://stackoverflow.com/a/5639455
var cookies;
export function readCookie(name,c,C,i) {
    if(cookies){ return cookies[name]; }

    c = document.cookie.split('; ');
    cookies = {};

    for(i=c.length-1; i>=0; i--){
       C = c[i].split('=');
       cookies[C[0]] = C[1];
    }

    return cookies[name];
}
