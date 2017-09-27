import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import ZoomButton from './ZoomButton';
import './Settings.css';
import { API_HOST } from '../api';
import { currentUser, currentSessionToken } from '../login/auth';

class Settings extends Component {
  render() {
    return (
      <div className='SettingsContainer'>
        <a href='/'><FontAwesome name='long-arrow-left' /> Back to conversations</a>
        <div className='Settings'>
          <div><ZoomButton /></div>
          <div>
            <a href={`${API_HOST}/salesforce/auth?agentID=${currentUser().id}`}>
              <button className='primary'>Connect SalesForce</button>
            </a>
          </div>
          <div>
            <a href={`${API_HOST}/zendesk/auth?agentID=${currentUser().id}`}>
              <button className='primary'>Connect Zendesk</button>
            </a>
          </div>
          <div>
            <a href={`${API_HOST}/nylas/auth?st=${currentSessionToken()}`}>
              <button className='primary'>Connect calendars</button>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;