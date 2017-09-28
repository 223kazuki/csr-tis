import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getZoomAccount, setZoomConnection } from './actions';
import FontAwesome from 'react-fontawesome';
import './Settings.css';
import { I18n } from 'react-redux-i18n';

class ZoomDisconnected extends Component {
  render() {
    return (
      <div>
        <button className='primary' onClick={this.props.onClick}>
          <span>{I18n.t('setting.connectZoomAccount')}</span>
        </button>
      </div>
    )
  }
}

class ZoomConnected extends Component {
  render() {
    return (
      <div>
        <button className='primary' onClick={this.props.onClick}>
          <span>{I18n.t('setting.disconnectZoomAccount')}</span>
        </button>
      </div>
    )
  }
}

class ZoomLoading extends Component {
  render() {
    return (
      <div>
        <FontAwesome name='spinner' spin />
      </div>
    )
  }
}

class ZoomButton extends Component {
  componentDidMount() {
    const { loadZoom } = this.props;
    loadZoom();
  }
  render() {
    const { zoomState, toggleZoom } = this.props;
    var content;
    if (zoomState === 'connected')
      content = <ZoomConnected onClick={_ => toggleZoom('disconnected')} />;
    else if (zoomState === 'disconnected')
      content = <ZoomDisconnected onClick={_ => toggleZoom('connected')} />;
    else if (zoomState === 'loading')
      content = <ZoomLoading />
    return (
      <div className='settingsButton'>
        {content}
      </div>
    )
  }
}

export default connect(
  state => ({ zoomState: state.settings.zoom.connectionStatus }),
  dispatch => ({ loadZoom: _ => dispatch(getZoomAccount()),
                 toggleZoom: connection => dispatch(setZoomConnection(connection)) })
)(ZoomButton);