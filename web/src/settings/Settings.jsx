import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import ZoomButton from './ZoomButton';
import './Settings.css';
import { API_HOST } from '../api';
import { currentUser, currentSessionToken } from '../login/auth';
import { I18n } from 'react-redux-i18n';

class Settings extends Component {
  render() {
    return (
      <div className='SettingsContainer'>
        <a href='/'><FontAwesome name='long-arrow-left' />{I18n.t('setting.backToConversations')}</a>
        <div className='Settings'>
          <div><ZoomButton /></div>
          <div>
            <a href={`${API_HOST}/salesforce/auth?agentID=${currentUser().id}`}>
              <button className='primary'>{I18n.t('setting.connectSalesForce')}</button>
            </a>
          </div>
          <div>
            <a href={`${API_HOST}/zendesk/auth?agentID=${currentUser().id}`}>
              <button className='primary'>{I18n.t('setting.connectZendesk')}</button>
            </a>
          </div>
          <div>
            <a href={`${API_HOST}/nylas/auth?st=${currentSessionToken()}`}>
              <button className='primary'>{I18n.t('setting.connectCalendars')}</button>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;