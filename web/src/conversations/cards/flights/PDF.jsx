import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import * as Layer from 'layer-websdk';
import '../File.css';

class PDF extends Component {
  render() {
    const { content } = this.props;
    try {
      let data = JSON.parse(content);
      const doc = data.doc;
      return (
        <a href={doc.file} target='_blank'>
          <div className='FilePDF'>
            <div className='FileIcon'>
              <span className='FileIconOutline'><FontAwesome name='file-o' /></span>
              <span className='FileIconType'>PDF</span>
            </div>
            <div className='FileDetails'>
              <h5>{doc.title || 'Untitled file'}</h5>
            </div>
          </div>
        </a>)
    } catch (e) {
      return (
        <div className='PDF'>
          <p>Could not parse carousel content</p>
        </div>
      )
    }
  }
}

registerComponent('dom-pdf-demo', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        this.content = value.parts[0].body;
      }
    },
    content: {
      set: function(value) {
        this.onRender();
      }
    }
  },
  methods: {
    onRender: function() {
      ReactDOM.render(<PDF content={this.content} />, this);
    }
  }
});

const mimeType = 'application/x.card.pdf+json';
registerMessageHandler({
  tagName: 'dom-pdf-demo',
  label: 'PDF',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});

const messagePartsForPDF = (doc, params={}) => {
  const body = {
    title: params.title || '',
    subtitle: params.subtitle || '',
    selection_mode: params.selection_mode || 'none',
    doc: doc
  };
  return [new Layer.MessagePart({ mimeType: mimeType, body: JSON.stringify(body) })];
}
export { messagePartsForPDF };
