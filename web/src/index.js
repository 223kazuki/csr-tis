import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, browserHistory } from 'react-router'
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux'
import { Provider } from 'react-redux'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import promise from 'redux-promise'
import { isAuthenticated, tryResolvingSessionToken, logout } from './login/auth'
import './index.css'
import { connectWebSDK } from './Layer'
import conversationsReducer from './conversations/Reducer'
import authReducer from './login/authReducer'
import leadsReducer from './leads/Reducer'
import teamReducer from './team/TeamReducer'
import settingsReducer from './settings/Reducer'
import uiReducer from './UIReducer'
import Conversations from './conversations/Conversations'
import EndUserContainer from './conversations/EndUserContainer'
import ResetPassword from './login/ResetPassword'
import FindLead from './leads/FindLead'
import Leads from './leads/Leads'
import Accounts from './accounts/Accounts'
import Team from './team/Team'
import Settings from './settings/Settings'
import Login from './login/Login'
import { selectConversation } from './conversations/actions'
import applyPrimaryColor from './colorScheme'
import { isDev } from './utils'

import { loadTranslations, setLocale, syncTranslationWithStore, i18nReducer } from 'react-redux-i18n'

const LOCALE_LANGUAGE = 'ja'
const translationsObject = require(`./data/i18n/${LOCALE_LANGUAGE}.json`)

console.log('translationsObject', translationsObject)
const routeMiddleware = routerMiddleware(browserHistory)
const store = createStore(
  combineReducers({
    conversations: conversationsReducer,
    leads: leadsReducer,
    team: teamReducer,
    routing: routerReducer,
    auth: authReducer,
    settings: settingsReducer,
    ui: uiReducer,
    i18n: i18nReducer
  }),
  applyMiddleware(thunk, promise, routeMiddleware))

syncTranslationWithStore(store)
store.dispatch(loadTranslations(translationsObject))
store.dispatch(setLocale(LOCALE_LANGUAGE))

if (isDev()) window._reduxStore = store

const history = syncHistoryWithStore(browserHistory, store)

const ensureAuthenticated = (location, replaceWith, successCallback) => {
  const success = () => {
    connectWebSDK()
    if (successCallback) successCallback()
  }
  if (!isAuthenticated()) {
    tryResolvingSessionToken((err, user) => {
      if (err) window.location = '/login'
      else success()
    })
  } else {
    success()
  }
}

const goToConversation = (location, _) => {
  ensureAuthenticated(location, _)
  const conversationID = location.params.conversationID
  if (conversationID) store.dispatch(selectConversation(`layer:///conversations/${conversationID}`, true))
}

const onLogout = () => {
  logout()
  window.location = '/login'
}

const render = () => {
  ReactDOM.render((
    <Provider store={store}>
      <Router history={history}>
        <Route path="/" component={Conversations} />
        <Route path="/c/:conversationID" component={Conversations} onEnter={goToConversation} />
        <Route path="/conversation/:conversationID" component={EndUserContainer} />
        <Route path="/reset/password" component={ResetPassword} />
        <Route path="/leads/find" component={FindLead} />
        <Route path="/leads" component={Leads} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/team" component={Team} />
        <Route path="/settings" component={Settings} />
        <Route path="/login" component={Login} />
        <Route path="/logout" onEnter={onLogout} />
      </Router>
    </Provider>
  ), document.getElementById('root'))
}

if (window.location.pathname !== '/login' && window.location.pathname !== '/reset/password') ensureAuthenticated(null, null, render)
else render()

const state = store.getState()
const demoPrimaryColor = state.ui.demo.primaryColor
if (state.ui.isDemo && demoPrimaryColor) applyPrimaryColor(demoPrimaryColor)
