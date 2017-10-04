import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import FontAwesome from 'react-fontawesome';
import * as Layer from 'layer-websdk';
import './File.css';
import filesize from 'filesize';
import { I18n } from 'react-redux-i18n';

class FilePDF extends Component {
  render() {
    const { fileInfo, url } = this.props;
    return (
      <a href={url} target='_blank'>
        <div className='FilePDF'>
          <div className='FileIcon'>
            <span className='FileIconOutline'><FontAwesome name='file-o' /></span>
            <span className='FileIconType'>PDF</span>
          </div>
          <div className='FileDetails'>
            <h5>{fileInfo.title || 'Untitled file'}</h5>
            <p>{filesize(fileInfo.size, { round: 0 })}</p>
          </div>
        </div>
      </a>
    )
  }
}

class FileImage extends Component {
  render() {
    const { fileInfo, url } = this.props;
    return (
      <a href={url} target='_blank'>
        <div className='FileImage'>
          <img src={url} alt={fileInfo.title} />
        </div>
      </a>
    )
  }
}

class File extends Component {
  render() {
    const { content, url } = this.props;
    try {
      const fileMetadata = JSON.parse(content);
      const fileMIMEType = fileMetadata.mime_type;
      if (fileMIMEType === 'application/pdf')
        return <FilePDF fileInfo={fileMetadata} url={url} />;
      else if (fileMIMEType.match(/image\/.+/))
        return <FileImage fileInfo={fileMetadata} url={url} />;
      else
        return <p>{I18n.t('cards.File.notSupported', {fileMIMEType: fileMIMEType})}</p>;
    } catch (e) {
      return <p>{I18n.t('cards.File.couldNotParse')}</p>
    }
  }
}

registerComponent('csr-file', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        if (value && value.isNew()) {
          value.once('messages:sent', () => {
            this.content = value.parts[0].body;
            this.url = value.parts[1].url;
          }, this);
        }
        this.content = value.parts[0].body;
        this.url = value.parts[1].url;
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
      ReactDOM.render(<File content={this.content} url={this.url} />, this);
    }
  }
});

const mimeType = 'application/vnd.layer.card.file+json';
registerMessageHandler({
  tagName: 'csr-file',
  label: 'File',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});

const messagePartsForFile = file => {
  const { name, type, size } = file;
  console.log('File name: ' + name);
  const infoPart = new Layer.MessagePart({
    mimeType: mimeType,
    body: JSON.stringify({
      title: name,
      comment: "",
      mime_type: type,
      size: size,
      created_at: (new Date()).toISOString(),
      updated_at: (new Date()).toISOString()
    })
  });
  const filePart = new Layer.MessagePart(file);
  return [infoPart, filePart];
};
export { messagePartsForFile };