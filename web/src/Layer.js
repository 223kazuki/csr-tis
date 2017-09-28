import React from 'react'
import ReactDOM from 'react-dom'
import * as LayerSDK from 'layer-websdk'
import * as LUI from 'layer-ui-web'
import { API_HOST, post } from './api'
import textHandlers from './conversations/textHandlers'
import { currentUser, currentSessionToken } from './login/auth'
import { isStaging } from './utils'
import config from './config.json'
import { I18n } from 'react-redux-i18n'
// Lots of hard-coded stuff here for rapid development
var APP_ID
if (process.env.NODE_ENV === 'production' && !isStaging())
    APP_ID = config.app_id.production
else
    APP_ID = config.app_id.staging
const authenticationURL = `${API_HOST}/layer_authenticate`

LayerSDK.MessagePart.TextualMimeTypes.push(/^location\/coordinate$/)
LayerSDK.MessagePart.TextualMimeTypes.push(/^application\/email-receipt$/)
LayerSDK.MessagePart.TextualMimeTypes.push(/^application\/sms-receipt$/)
LayerSDK.MessagePart.TextualMimeTypes.push(/^application\/og-preview$/)
LayerSDK.MessagePart.TextualMimeTypes.push(/^application\/carousel(\+demo)?$/)
LayerSDK.MessagePart.TextualMimeTypes.push(/^application\/.+json/)
LayerSDK.MessagePart.TextualMimeTypes.push(/^application\/x\.card-response.*\+json.*$/)

const getIdentityToken = function(nonce, cb) {
  const params = { session_token: currentSessionToken(), nonce: nonce }
  post(authenticationURL, params, (err, resp) => {
    cb(resp["identity_token"])})
}

const websdkClient = new LayerSDK.Client({
  appId: APP_ID,
  isTrustedDevice: true,
  logLevel: LayerSDK.Constants.LOG.INFO
})

websdkClient.on('challenge', evt => {
  getIdentityToken(evt.nonce, token => evt.callback(token));
})

websdkClient.on('ready', () => {
  // TODO: Dispatch ready event
})

const keepConversationsFromDieingQuery = websdkClient.createQuery({
  model: LayerSDK.Query.Conversation
})

const connectWebSDK = () => {
  const userID = `${currentUser().id}`
  websdkClient.connect(userID)
}

LUI.init({
  appId: APP_ID,
  layer: LayerSDK,
  mixins: {
    'layer-message-status': {
        methods: {
             onRerender: {
                mode: LUI.registerComponent.MODES.OVERWRITE,
                value: function () {
                  let message = this.item
                  if (!message) return
                  let text = ''
                  if (message instanceof LayerSDK.Message.ChannelMessage ||
                    message.deliveryStatus === LayerSDK.Constants.RECIPIENT_STATE.NONE) {
                    text = I18n.t('messages.receipts.sent')
                  } else if (message.readStatus === LayerSDK.Constants.RECIPIENT_STATE.NONE) {
                    text = I18n.t('messages.receipts.delivered')
                  } else if (message.readStatus === LayerSDK.Constants.RECIPIENT_STATE.ALL) {
                    text = I18n.t('messages.receipts.read')
                  } else {
                    const sessionOwnerId = message.getClient().user.id
                    const status = message.recipientStatus
                    const count = Object.keys(status).filter(identityId =>
                      identityId !== sessionOwnerId && status[identityId] === LayerSDK.Constants.RECEIPT_STATE.READ).length
                    text = I18n.t('messages.export', {count: count}) // `read by ${count} participants`
                  }
                  this.innerHTML = text
                }
           }
        }
     }
  }
})
const LayerUI = LUI.adapters.react(React, ReactDOM)

textHandlers.forEach(handler => LUI.registerTextHandler(handler))

window._layerClient = websdkClient

export default LayerUI
export const WebSDK = websdkClient
export { connectWebSDK, LayerSDK }
