import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import { isUserMode } from '../../login/auth';
import * as Layer from 'layer-websdk';
import './Receipt.css';
import { I18n } from 'react-redux-i18n';

// Generic receipt
class Receipt extends Component {
  render() {
    const receipt = JSON.parse(this.props.receipt);
    let content = '';
    if (receipt.text)
      content = receipt.text;
    else if (receipt.action) {
      if (isUserMode())
        content = I18n.t('cards.Receipt.you', {action: receipt.action});
      else
        content = I18n.t('cards.Receipt.recipient', {action: receipt.action});
    }
    else
      content = '';
    return (
      <div className='Receipt'>
        {content}
      </div>
    );
  }
}

registerComponent('csr-receipt', {
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
      ReactDOM.render(<Receipt receipt={this.receipt} />, this);
    }
  }
});

const mimeType = 'application/x.card.receipt+json';

registerMessageHandler({
  tagName: 'csr-receipt',
  label: 'Receipt',
  handlesMessage: message => message.parts[0].mimeType === mimeType
});

const messagePartsForEmailReceipt = (messageCount, sentAt = (new Date())) => {
  const body = JSON.stringify({ count: messageCount, sentAt: sentAt });
  return [new Layer.MessagePart({ mimeType, body })];
};
export { messagePartsForEmailReceipt };