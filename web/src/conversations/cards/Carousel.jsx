import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import * as Layer from 'layer-websdk';
import './Carousel.css';

class CarouselCellFullScreen extends Component {
  render() {
    const { title, close, detail, link } = this.props;
    const imageURL = this.props.imageURL || this.props.image_url;
    let label = null;
    if (title || detail) {
      label = (
        <div className='carouselCellLabel'>
          <p className='carouselCellTitle'>{title}</p>
          <p className='carouselCellDetail'>{detail}</p>
        </div>
      );
    }
    var content;
    if (link && link.indexOf('vimeo.com') >= 0) {  // Embed Vimeo
      const videoID = link.split('/').slice(-1)[0];
      content = (
        <div className='carouselCellImage carouselFullScreenEmbed'>
          <iframe src={`https://player.vimeo.com/video/${videoID}?byline=0&portrait=0`} width="640" height="384" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
        </div>
      );
    }
    else {
      content = <div className='carouselCellImage' style={{backgroundImage: `url(${imageURL})`}}></div>;
    }
    return (
      <div className='CarouselCellFullScreen'>
        <button onClick={close} className='dismiss'><FontAwesome name='close' /></button>
        {content}
        {label}
      </div>
    )
  }
}

class CarouselCell extends Component {
  showExpanded() {
    const div = document.createElement('div');
    div.id = 'carouselCellExpanded';
    ReactDOM.render(<CarouselCellFullScreen {...this.props} close={this.closeExpanded.bind(this)} />, div);
    document.body.appendChild(div);
  }
  closeExpanded() {
    document.getElementById('carouselCellExpanded').remove();
  }
  render() {
    const { title } = this.props;
    const imageURL = this.props.imageURL || this.props.image_url;
    const detail = this.props.detail;
    let label = null;
    if (title || detail) {
      label = (
        <div className='carouselCellLabel'>
          <p className='carouselCellTitle'>{title}</p>
          <p className='carouselCellDetail'>{detail}</p>
        </div>
      );
    }
    const image = (
      <div className='carouselCellImage'>
        <img src={imageURL} width='250' height='auto' alt={title} />
      </div>
    )
    var content;
    if (this.props.link) {
      if (this.props.link.indexOf('vimeo.com') >= 0) {  // Embed vimeo
        const videoID = this.props.link.split('/').slice(-1)[0];
        content = (
          <button className='invisible' onClick={this.showExpanded.bind(this)}>
            <iframe src={`https://player.vimeo.com/video/${videoID}?byline=0&portrait=0`} width="250" height="150" frameBorder="0" allowFullScreen></iframe>
            {label}
          </button>
        )
      }
      else if (document.body.className.indexOf('embed-layer') >= 0 && this.props.link.indexOf('layer.com') >= 0) {  // Demo hack
        content = (
          <button className='invisible' onClick={() => document.getElementById('embedLinkTarget').src = this.props.link}>
            {image}
            {label}
          </button>
        );
      }
      else {
        content = (
          <a href={this.props.link} target='_blank'>
            {image}
            {label}
          </a>
        );
      }
    }
    else {
      content = (
        <button className='invisible' onClick={this.showExpanded.bind(this)}>
          {image}
          {label}
        </button>
      );
    }
    return (
      <div className='CarouselCell'>
        {content}
      </div>
    )
  }
}

class Carousel extends Component {
  render() {
    const { content } = this.props;
    try {
      let data = JSON.parse(content);
      const items = data.items || data;
      return (
        <div className='carouselContainer'>
          {items.map((card, idx) => <CarouselCell {...card} key={idx} />)}
        </div>
      )
    } catch (e) {
      return (
        <div className='carouselContainer'>
          <p>Could not parse carousel content</p>
        </div>
      )
    }
  }
}

// https://docs.layer.com/sdk/webui/ui_customization#custom-cards
registerComponent('dom-carousel-demo', {
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
      ReactDOM.render(<Carousel content={this.content} />, this);
    }
  }
});

const mimeType = 'application/x.card.carousel+json';
registerMessageHandler({
  tagName: 'dom-carousel-demo',
  label: 'Product Carousel',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});

const messagePartsForCarousel = (items, params={}) => {
  if (!Array.isArray(items)) {
    throw new Error('`items` must be an array of card payloads');
  }

  const body = {
    title: params.title || '',
    subtitle: params.subtitle || '',
    selection_mode: params.selection_mode || 'none',
    items: items
  };
  return [new Layer.MessagePart({ mimeType: mimeType, body: JSON.stringify(body) })];
}
export { messagePartsForCarousel };
