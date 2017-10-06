import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import FontAwesome from 'react-fontawesome';
import * as Layer from 'layer-websdk';
import './Location.css';
import { I18n } from 'react-redux-i18n';

const GOOGLE_EMBED_KEY = 'AIzaSyCXIyKqEoKV3VLrEAt1Bf1RgA7AmSddHqI';

class LocationLoading extends Component {
  render() {
    return (
      <div className='LocationLoading'>
        <p><FontAwesome name='spinner' spin />{I18n.t('cards.Location.loading')}</p>
      </div>
    )
  }
}

class LocationMap extends Component {
  render() {
    const { lat, lon } = this.props;
    return (
      <div className='LocationMap'>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://www.google.com/maps/embed/v1/place?q=${lat},${lon}&key=${GOOGLE_EMBED_KEY}`}></iframe>
      </div>
    )
  }
}

class LocationError extends Component {
  render() {
    return (
      <div className='LocationError'>
        <p>{this.props.error}</p>
      </div>
    )
  }
}

class Location extends Component {
  render() {
    const { content } = this.props;
    if (content === 'loading')
      return <LocationLoading />;
    else if (content.indexOf('Error') >= 0)
      return <LocationError error={content} />;
    else
      return <LocationMap {...(JSON.parse(content))} />;
  }
}

const locationBody = navigatorPosition => ({ lat: navigatorPosition.coords.latitude, lon: navigatorPosition.coords.longitude });

registerComponent('dom-location', {
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
    onAfterCreate: function() {
      const message = this.message;
      if (!message.isNew())
        return;
      navigator.geolocation.getCurrentPosition(
        position => {
          const newBody = JSON.stringify(locationBody(position));
          message.parts[0].body = newBody;
          message.send();
          this.content = newBody;
        },
        err => {
          console.log('Error getting location: %o', err);
          message.parts[0].body = 'Error: Unable to figure out where you are right now';
        }
      );
    },
    onRender: function() {
      ReactDOM.render(<Location content={this.content} />, this);
    }
  }
});

registerMessageHandler({
  tagName: 'dom-location',
  label: 'Location',
  handlesMessage: message => message.parts[0].mimeType === 'location/coordinate'
});

const messagePartsForLocation = (body) => {
  if (body.lat && body.lon)
    body = JSON.stringify(body);
  return [new Layer.MessagePart({ mimeType: 'location/coordinate', body: body })];
};
export { messagePartsForLocation };