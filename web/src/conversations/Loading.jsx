import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';

class Loading extends Component {
  render() {
    const { subject } = this.props;
    const message = subject ? `Loading ${subject}...` : 'Loading...';
    return (
      <p className='loading'>
        <FontAwesome name='rocket' spin />
        <span className='loadingLabel'>{message}</span>
      </p>
    )
  }
}

export default Loading;