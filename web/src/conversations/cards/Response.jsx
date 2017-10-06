import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
import { I18n } from 'react-redux-i18n';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;

class Response extends Component {
  render() {
    return (
      <div className='CardResponse'>
        <p>{I18n.t('cards.Response.responded')}</p>
      </div>
    )
  }
}

registerComponent('csr-response-receipt', {
  mixins: [MessageHandlerMixin],
  methods: {
    onRender: function() {
      ReactDOM.render(<Response />, this);
    }
  }
});

const responseMIMEType = /^application\/x\.card-response.*\+json.*$/;

registerMessageHandler({
  tagName: 'csr-response-receipt',
  label: 'Response receipt',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType.match(responseMIMEType);
  }
});