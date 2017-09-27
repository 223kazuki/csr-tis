import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import FontAwesome from 'react-fontawesome';
import Autolinker from 'autolinker';

class PreviewLoading extends Component {
  render() {
    return (
      <div className='PreviewLoading'>
        <FontAwesome name='spinner' spin />
        <span>Loading...</span>
      </div>
    )
  }
}

class PreviewError extends Component {
  render() {
    return (
      <div className='PreviewError'>
        <span>There was a problem loading a preview for this link.</span>
      </div>
    )
  }
}

class LinkPreview extends Component {
  render() {
    const { link, image, title, description } = this.props;
    return (
      <a href={link} target='_blank' className='linkPreview'>
        <span className='linkPreview-image'>
          <img src={image} width='auto' height='90' alt={title} />
        </span>
        <span className='linkPreview-text'>
          <h5>{title || 'Untitled page'}</h5>
          <p>{description || 'No description found for this page'}</p>
        </span>
      </a>
    )
  }
}

class Link extends Component {
  render() {
    const { og, raw } = this.props.content;
    var preview;
    if (og === 'loading')
      preview = <PreviewLoading />;
    else if (og.indexOf('error') >= 0)
      preview = <PreviewError />;
    else
      preview = <LinkPreview {...(JSON.parse(og))} />;
    return (
      <layer-message-text-plain>
        <span dangerouslySetInnerHTML={{__html: Autolinker.link(raw, {
          truncate: {length: 40, location: 'end'},
          className: 'layer-parsed-url'
        })}}></span>
        <div className='layer-message-text-plain-after-text'>
          {preview}
        </div>
      </layer-message-text-plain>
    )
  }
}

registerComponent('dom-link-preview', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        if (value && value.isNew()) {
          value.once('messages:sent', () => {
            this.body = Object.assign({}, { raw: value.parts[0].body }, { og: value.parts[1].body });
            this.render();
          }, this);
        }
        this.body = Object.assign({}, { raw: value.parts[0].body }, { og: value.parts[1].body });
      }
    },
    body: {
      set: function(value) {
        this.onRender();
      }
    }
  },
  methods: {
    onRender: function() {
      ReactDOM.render(<Link content={this.properties.body} />, this);
    }
  }
});

registerMessageHandler({
  tagName: 'dom-link-preview',
  label: 'Link Preview',
  handlesMessage: ({ parts }) => parts.length > 1 && parts[0].mimeType === 'text/plain' && parts[1].mimeType === 'application/og-preview'
});

export default Link;