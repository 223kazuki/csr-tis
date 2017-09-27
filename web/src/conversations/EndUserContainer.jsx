import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import ConversationMessages from './Messages';
import { addClass, removeClass, parseQueryString } from '../utils';
import { post } from '../api';
import { WebSDK } from '../Layer';
import cookie from 'react-cookie';
import { COOKIE_SESSION_KEY } from '../login/auth';

class EndUserContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      layerReady: WebSDK.isReady,
      chatExpanded: true
    }
  }
  componentDidMount() {
    const documentQueries = parseQueryString(document.location.search);
    if (documentQueries.embedLayer && window.innerWidth >= 769) {
      addClass(document.body, 'embed-layer');
      this.setState({ embedLayer: true });
    }
    else {
      addClass(document.body, 'conversation-only');
    }
    if (documentQueries.st) {
      cookie.save(COOKIE_SESSION_KEY, documentQueries.st, { path: '/', maxAge: 7776000, httpOnly: false });  // Max age 3 months
      let stStripped = window.location.pathname;
      if (documentQueries.embedLayer)
        stStripped += '?embedLayer=true';
      window.location = stStripped;  // Redirect to no session token
    }
    WebSDK.on('ready', () => {
      post('/trigger/opened', { conversationID: this.props.params.conversationID }, (err, resp) => {});
      this.setState({ layerReady: WebSDK.isReady });
    });
  }
  componentWillUnmount() {
    removeClass(document.body, 'conversation-only');
    removeClass(document.body, 'embed-layer');
  }
  sendMessageTrigger() {
    post('/trigger/sent', { conversationID: this.props.params.conversationID }, (err, resp) => {});
  }
  render() {
    if (this.state.layerReady) {
      var panelClassname = 'full-height-panel MessagePanel';
      if (this.state.chatExpanded)
        panelClassname += ' active';
      const toggleButton = this.state.embedLayer ? <button className='MessagePanel-Toggle inline' onClick={() => this.setState({ chatExpanded: !this.state.chatExpanded})}><FontAwesome name={this.state.chatExpanded ? 'chevron-circle-right' : 'chevron-circle-left'} size='3x' /></button> : null;
      const panel = (
        <div className={panelClassname}>
          {toggleButton}
          <ConversationMessages conversationID={this.props.params.conversationID} onSendTrigger={this.sendMessageTrigger.bind(this)} />
        </div>
      );
      if (this.state.embedLayer) {
        return (
          <div>
            <iframe className='layer-homepage full-height-panel' src='https://layer.com' id='embedLinkTarget'></iframe>
            {panel}
          </div>
        )
      }
      else {
        return panel;
      }
    }
    else {
      return (
        <div className="full-height-panel MessagePanel">
          <p className='MessagePanelLoading'>
            <FontAwesome name='spinner' pulse spin /> Loading messages &hellip;
          </p>
        </div>
      )
    }
  }
}

export default EndUserContainer;
