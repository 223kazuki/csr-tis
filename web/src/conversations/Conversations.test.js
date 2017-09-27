import React from 'react';
import ReactDOM from 'react-dom';
import Conversations from './Conversations';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Conversations />, div);
});
