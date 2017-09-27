import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';

class ErrorBanner extends Component {
  render() {
    const { error } = this.props;
    const errorString = (error instanceof Error) ? error.message : `${error}`;
    var errorMessage;
    try {
      const parsed = JSON.parse(errorString);
      errorMessage = parsed.error;
    } catch (_) {
      errorMessage = errorString;
    }

    return (
      <Alert bsStyle='danger'>
        <strong>Error:</strong> {errorMessage}
      </Alert>
    )
  }
}

export default ErrorBanner;