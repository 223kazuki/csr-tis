import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert } from 'react-bootstrap';
import { authenticate, requestReset, toggleResetMode } from './actions';
import FontAwesome from 'react-fontawesome';
import './Login.css';

import { Translate, Localize, I18n } from 'react-redux-i18n'

class Login extends Component {
  render() {
    const name = 'James Smith'
    const unreadCount = 10000000
    const { email, password, result, loading, onChange, onLogin, resetMode, onReset, toggleResetMode } = this.props;
    var errorBanner = null;
    if (result) {
      if (result instanceof Error)
        errorBanner = <Alert bsStyle='danger'>{result.message}</Alert>;
      else
        errorBanner = <Alert bsStyle='success'>{result}</Alert>;
    }
    if (resetMode) {
      const onSubmit = (e) => {
        e.preventDefault();
        onReset();
        return false;
      };
      const buttonContent = loading ? <FontAwesome name='spinner' spin /> : 'Send reset email';
      return (
        <div className='Login'>
          <form onSubmit={onSubmit}>
            {errorBanner}
            <button className='inline pull-right' type='button' onClick={toggleResetMode}>Back to login</button>
            <label>
              <span>Layer email</span>
              <input type='email' placeholder='example@layer.com' value={email} onChange={onChange('email')} />
            </label>
            <button className='primary' onClick={onReset} disabled={loading} type='button'>{buttonContent}</button>
          </form>
        </div>
      )
    }
    else {
      const onSubmit = (e) => {
        e.preventDefault();
        onLogin();
        return false;
      };
      const buttonContent = loading ? <FontAwesome name='spinner' spin /> : I18n.t('login.button')
      return (
        <div className='Login'>
          <form onSubmit={onSubmit}>
            {errorBanner}
            <label>
              <Translate value='login.email' />
              <input type='email' placeholder={I18n.t('login.emailPlaceholder')} value={email} onChange={onChange('email')} />
            </label>
            <button className='inline pull-right' type='button' onClick={toggleResetMode}>{I18n.t('login.resetPassword')}</button>
            <label>
              <Translate value='login.password' />
              <input type='password' placeholder={I18n.t('login.passwordPlaceholder')} value={password} onChange={onChange('password')} />
            </label>
            <button className='primary' onClick={onLogin} disabled={loading} type='button'>{buttonContent}</button>
          </form>
        </div>
      )
    }
  }
}

export default connect(state => state.auth, dispatch => ({
  onChange: fieldName => {
    const actionType = fieldName === 'email' ? 'UPDATE_EMAIL' : 'UPDATE_PASSWORD';
    return function(e) {
      dispatch({
        type: actionType,
        payload: e.target.value,
      })
    }
  },
  onLogin: () => dispatch(authenticate()),
  onReset: () => dispatch(requestReset()),
  toggleResetMode: () => dispatch(toggleResetMode())
}))(Login);
