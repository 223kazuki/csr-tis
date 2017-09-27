import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCreateConversationWidgetState, inviteToChat } from './actions';
import FontAwesome from 'react-fontawesome';
import { isStaging, isDev } from '../utils';
import styled from 'styled-components';

class CreateConversationPrompt extends Component {
  render() {
    return isStaging() || isDev() ? (
      <button className='primary' onClick={this.props.onClick}>
        <FontAwesome name='plus' /> <span>Start new conversation</span>
      </button>
    ) : null;
  }
}

class CreateConversationInputImpl extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', firstName: '', lastName: '' }
  }
  componentDidMount() {
    this.refs.input.focus()
  }
  updateFirstNameInput(e) {
    this.setState({ firstName: e.target.value })
  }
  updateLastNameInput(e) {
    this.setState({ lastName: e.target.value })
  }
  updateEmailInput(e) {
    this.setState({ email: e.target.value })
  }
  render() {
    const { disabled, loading } = this.props;
    const invite = this.props.invite || (_ => alert('Invalid state — button should not be active'));
    const buttonPrompt = loading ? <FontAwesome name='spinner' spin /> : 'Invite';
    const { email, firstName, lastName } = this.state;
    return (
      <div className={`CreateConversationInput ${this.props.className}`}>
        <input
          disabled={disabled}
          type='email'
          name='email'
          placeholder='Prospect email'
          required
          ref='input'
          value={email}
          onChange={this.updateEmailInput.bind(this)} />
        <input
          disabled={disabled}
          type='text'
          name='firstName'
          placeholder='First name'
          required
          value={firstName}
          onChange={this.updateFirstNameInput.bind(this)} />
        <input
          disabled={disabled}
          type='text'
          name='lastName'
          placeholder='Last name'
          required
          value={lastName}
          onChange={this.updateLastNameInput.bind(this)} />
        <div className='PrimaryButtonBlock'>
          <button className='primary' disabled={disabled} onClick={_ => invite(email, firstName, lastName)}>{buttonPrompt}</button>
        </div>
      </div>
    )
  }
}
const CreateConversationInput = styled(CreateConversationInputImpl)`
  input[name='firstName'], input[name='lastName'] {
    display: inline-block;
    margin-top: 0.5em;
    width: 50%;
  }
`;

class CreateConversationImpl extends Component {
  render() {
    const { uiState, setWidgetState, invite } = this.props;
    var content;
    if (uiState === 'expanded')
      content = <CreateConversationInput invite={invite} />;
    else if (uiState === 'disabled')
      content = <CreateConversationInput disabled />;
    else if (uiState === 'loading')
      content = <CreateConversationInput disabled loading />;
    else if (uiState === 'invited')
      content = <p>Invited!</p>;
    else if (uiState instanceof Error)
      content = <p>{uiState.toString()}</p>;
    else
      content = <CreateConversationPrompt onClick={_ => setWidgetState('expanded')} />;
    return <div className={`CreateConversation ${this.props.className}`}>{content}</div>;
  }
}
const CreateConversation = styled(CreateConversationImpl)`
  button {
    border-color: #ADB9C1;
    color: #ADB9C1;
    width: 100%;
    &:active {
      background: #70828E;
    }
  }
`;

export default connect(
  state => ({ uiState: state.conversations.ui.createConversationWidgetState }),
  dispatch => ({ setWidgetState: newState => dispatch(setCreateConversationWidgetState(newState)),
                 invite: (email, firstName, lastName) => dispatch(inviteToChat(email, firstName, lastName))})
)(CreateConversation);