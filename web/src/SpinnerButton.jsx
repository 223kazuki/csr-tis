import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';

class SpinnerButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'default'
    }
  }
  performAction() {
    const { action } = this.props;
    this.setState({ status: 'loading' });
    action((err, resp) => {
      if (err) {
        this.setState({ status: err });
        setTimeout(() => this.setState({ status: 'default' }), 5000);
      }
      else {
        this.setState({ status: 'loaded' });
        setTimeout(() => this.setState({ status: 'default' }), 3500);
      }
    })
  }
  render() {
    const { title } = this.props;
    const loadingTitle = this.props.loadingTitle || 'Loading';
    const doneTitle = this.props.doneTitle || 'Done';
    const { status } = this.state;
    console.log("Spinner button status: %o", status);
    if (status === 'default')
      return <button className='inline' onClick={this.performAction.bind(this)}>{title}</button>;
    else if (status === 'loading')
      return <button className='inline' disabled>{loadingTitle}... <FontAwesome name='spinner' spin /></button>;
    else if (status instanceof Error)
      return <button className='inline error' onClick={() => alert(JSON.stringify(status.message || status))}>Error (click to show)</button>;
    else if (status === 'loaded')
      return <button className='inline success'>{doneTitle} <FontAwesome name='check' /></button>;
    else
      return <button className='inline error'>Unrecognized state ({status})</button>;
  }
}

export default SpinnerButton;
