const Notify = require('notifyjs').default
import IdentityCache from '../IdentityCache'
import { WebSDK } from '../Layer'
import { I18n } from 'react-redux-i18n'

const ICON_URL = 'https://s3.amazonaws.com/static.layer.com/logo-only-blue.png'
const TIMEOUT_SECONDS = 5
if (window.Notification) {
  Notify.requestPermission(() => {
    WebSDK.on('messages:notify', evt => {
      const message = evt.message
      const notificationText = message.parts
                                .filter(part => part.mimeType === 'text/plain')
                                .map(part => part.body)
                                .join(' ')
      // `${name} sent you a message`
      IdentityCache.getDisplayNameForID(message.sender.userId, name => {
        new Notify(I18n.t('notify.export', {name: name}), {
          icon: ICON_URL,
          timeout: TIMEOUT_SECONDS,
          body: notificationText,
          tag: message.conversationId
        }).show()
      })
    })
  })
}
