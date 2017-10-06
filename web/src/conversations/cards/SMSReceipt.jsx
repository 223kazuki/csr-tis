import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import { isUserMode } from '../../login/auth';
import * as Layer from 'layer-websdk';
import './Receipt.css';
import { I18n } from 'react-redux-i18n';

class SMSReceipt extends Component {
  render() {
    if (isUserMode())
      return <div></div>;
    const receipt = JSON.parse(this.props.receipt);
    const sentAt = new Date(receipt.sentAt);
    const messagePlural = receipt.count > 1 ? 'messages' : 'message';
    const receiptString = I18n.t('cards.EmailReceipt.recept', {count: receipt.count,
                                                               messagePlural: messagePlural,
                                                               sentAtDate: sentAt.toDateString(),
                                                               sentAtHours: sentAt.getHours(),
                                                               sentAtMinutes: sentAt.getMinutes(),
                                                               sentAtSeconds: sentAt.getSeconds()});
    return (
      <div className='SMSReceipt'>
        <p>{receiptString}</p>
      </div>
    )
  }
}

registerComponent('dom-sms-receipt', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        this.receipt = value.parts[0].body;
      }
    },
    receipt: {
      set: function(value) {
        this.onRender();
      }
    }
  },
  methods: {
    onRender: function() {
      ReactDOM.render(<SMSReceipt receipt={this.receipt} />, this);
    }
  }
});

registerMessageHandler({
  tagName: 'dom-sms-receipt',
  label: 'Email receipt',
  handlesMessage: message => message.parts[0].mimeType === 'application/sms-receipt'
});

const messagePartsForSMSReceipt = (messageCount, sentAt = (new Date())) => {
  const body = JSON.stringify({ count: messageCount, sentAt: sentAt });
  return [new Layer.MessagePart({ mimeType: 'application/sms-receipt', body: body })];
};
export { messagePartsForSMSReceipt };