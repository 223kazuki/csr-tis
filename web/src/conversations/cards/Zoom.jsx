import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import { get, post } from '../../api';
import * as Layer from 'layer-websdk';
import { I18n } from 'react-redux-i18n';

import './Zoom.css';

class ZoomJoin extends Component {
  render() {
    return (
      <div className='ZoomJoin'>
        <a target='blank' href={'https://layer.zoom.us/j/' + this.props.meetingID}>
          <button className='normal'>
            {I18n.t('cards.Zoom.joinCall')}
            <small>{I18n.t('cards.Zoom.usingZoomApp')}</small>
          </button>
        </a>
        <a href={'tel:+1-646-558-8656,' + this.props.meetingID + ',,,,,47'}>
          <button className='primary'>
            {I18n.t('cards.Zoom.dialIn')}
            <small>{I18n.t('cards.Zoom.usingYourPhone')}</small>
          </button>
        </a>
      </div>
    )
  }
}

class ZoomLoading extends Component {
  render() {
    return (
      <div className='ZoomLoading'>
        <p>{I18n.t('cards.Zoom.zoomCallLoading')}</p>
      </div>
    )
  }
}

class ZoomOver extends Component {
  render() {
    const durationInMinutes = this.props.duration / 60;
    return (
      <div className='ZoomOver'>
        <p>{I18n.t('cards.Zoom.inZoomCall', {durationInMinutes: Math.round(durationInMinutes)})}</p>
      </div>
    )
  }
}

class ZoomError extends Component {
  render() {
    return (
      <div className='ZoomError'>
        <p>Error: {this.props.error}</p>
      </div>
    )
  }
}

class Zoom extends Component {
  constructor(props) {
    super(props);
    this.state = { widgetState: undefined };
  }
  componentDidMount() {
    this.renderFromMetadata();
  }
  renderFromMetadata() {
    this.getMessageMetadata((err, resp) => {
      if (err) {
        const message = this.props.message;
        const messageIDParts = message.id.split('/');
        const messageID = messageIDParts[messageIDParts.length - 1];
        this.setState({ widgetState: 'error', error: `Could not fetch Zoom for message: ${messageID}` });
      } else {
        const zoom = resp.zoom;
        if (zoom === undefined) {
          this.createMeeting((err, resp) => {
            if (err)
              this.setState({ widgetState: 'error', error: err.message });
            else{
              const meetingID = resp.meetingID;
              this.setState({ widgetState: 'join', meetingID: meetingID });
            }
          });
        } else {
          const zoomMeetingID = zoom.meeting_id;
          const zoomStartTime = parseInt(zoom.start_time, 10);  // Timestamp
          const zoomEndTime = parseInt(zoom.end_time, 10);  // Timestamp
          if (zoomStartTime && zoomEndTime) {
            this.setState({ widgetState: 'over', duration: (zoomEndTime - zoomStartTime) });
          } else {
            this.setState({ widgetState: 'join', meetingID: zoomMeetingID });
          }
        }
      }
    })
  }
  getMessageMetadata(callback) {
    const message = this.props.message;
    const messageIDParts = message.id.split('/');
    const messageID = messageIDParts[messageIDParts.length - 1];
    get('/message/' + messageID, callback);
  }
  createMeeting(callback) {
    const message = this.props.message;
    const messageIDParts = message.id.split('/');
    const messageID = messageIDParts[messageIDParts.length - 1];
    post('/zoom/create', { messageID }, callback);
  }
  render() {
    const { widgetState, meetingID, duration, error } = this.state;
    var content;
    if (widgetState === 'error') {
      content = <ZoomError error={error}/>
    } else if (widgetState === 'join')
      content = <ZoomJoin meetingID={meetingID} />
    else if (widgetState === 'over')
      content = <ZoomOver duration={duration} />
    else
      content = <ZoomLoading />
    return (
      <div className='zoomContainer'>
        {content}
      </div>
    )
  }
}

// https://docs.layer.com/sdk/webui/ui_customization#custom-cards
registerComponent('dom-zoom-card', {
  mixins: [MessageHandlerMixin],
  methods: {
    onRender: function() {
      ReactDOM.render(<Zoom message={this.message} />, this);
    }
  }
});

registerMessageHandler({
  tagName: 'dom-zoom-card',
  label: 'Zoom call',
  handlesMessage: message => message.parts[0].mimeType === 'application/zoom+card'
});

const messagePartsForZoomCall = (body = 'default') => {
  return [new Layer.MessagePart({ mimeType: 'application/zoom+card', body: body })];
};

export { messagePartsForZoomCall };
