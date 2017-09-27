import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert } from 'react-bootstrap';
import { resetPassword } from './actions';
import FontAwesome from 'react-fontawesome';
import './Login.css';

class ResetPassword extends Component {
  render() {
    const { password, onPasswordChange, loading, result, onReset } = this.props;
    const nonce = window.location.href.slice(window.location.href.indexOf('nonce=') + 'nonce='.length);
    const button = loading ?
                    <button className='primary' disabled type='button'><FontAwesome name='spinner' spin /></button> :
                    <button type='button' className='primary' onClick={onReset.bind(null, nonce)}>Set new password</button>;
    var resultBanner = null;
    if (result)
      if (result instanceof Error)
        resultBanner = <Alert bsStyle='danger'>{result.message}</Alert>;
      else
        resultBanner = <Alert bsStyle='success'>Password reset successfully. <strong><a href='/login'>Go to login</a></strong></Alert>;
    const onSubmit = (e) => {
      e.preventDefault();
      onReset(nonce);
      return false;
    };
    return (
      <div className='ResetPassword'>
        <form onSubmit={onSubmit}>
          {resultBanner}
          <input type='hidden' name='nonce' value={nonce} />
          <label>
            <span>New password</span>
            <input type='password' placeholder='Pick something secure' value={password} onChange={onPasswordChange} />
          </label>
          {button}
        </form>
      </div>
    )
  }
};

export default connect(state => state.auth, dispatch => ({
  onPasswordChange: e => dispatch({ type: 'UPDATE_PASSWORD', payload: e.target.value }),
  onReset: (nonce) => dispatch(resetPassword(nonce))
}))(ResetPassword);