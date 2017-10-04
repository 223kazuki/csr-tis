import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import FontAwesome from 'react-fontawesome';
import './Card.css';
import './Poll.css';
import { WebSDK } from '../../Layer';
import { get, patch } from '../../api';
import { currentUser, isUserMode } from '../../login/auth';
import * as Layer from 'layer-websdk';
import { stripPrefix } from '../../utils';
import classNames from 'classnames';
import { I18n } from 'react-redux-i18n';
const contentType = require("content-type");

const mimeType = 'application/x.card.text-poll+json';
const responseMIMEType = /^application\/x\.card-response.*\+json.*$/;
const messagePartsForPoll = (body) => {
  return [new Layer.MessagePart({ mimeType, body })];
};
export { messagePartsForPoll };

class PollCompose extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      question: '',
      newOption: '',
      isSending: false
    }
  }
  sendMessage() {
    const { question, options } = this.state;
    const messagePart = {
      question: question,
      choices: options
    };
    this.setState({ isSending: true });
    this.props.onSend(messagePart);
  }
  addNewOption() {
    let { options, newOption } = this.state;
    options = options.concat(newOption);
    this.setState({ options: options, newOption: '' });
  }
  removeOption(index) {
    return _ => {
      const options = this.state.options;
      options.splice(index, 1);
      this.setState({ options });
    }
  }
  render() {
    const { question, options, newOption, isSending } = this.state;
    let sendButton = null;
    if (options.length > 0) {
      if (isSending)
        sendButton = <button className='inline SendButton' disabled><FontAwesome name='spinner' spin />{I18n.t('cards.File.send')}</button>;
      else
        sendButton = <button className='inline SendButton' onClick={this.sendMessage.bind(this)}>{I18n.t('cards.File.send')}</button>;
    }
    else
      sendButton = <button className='inline SendButton' disabled>{I18n.t('cards.File.send')}</button>;
    return (
      <div className='PollCompose CardBody'>
        <div className='CardHeader'>
          <p className='CardTitle'><FontAwesome name='bars' />{I18n.t('cards.File.send')}</p>
          {sendButton}
        </div>
        <div className='PollBasics'>
          <label>{I18n.t('cards.File.send')}</label>
          <input type='text'
            placeholder={I18n.t('cards.File.send')}
            value={question}
            onChange={e => this.setState({ question: e.target.value })} />
        </div>
        <div className='PollOptions'>
          <label>{I18n.t('cards.File.send')}</label>
          {options.map((opt, idx) => {
            const removeButton = <button className='inline' onClick={this.removeOption(idx).bind(this)}>{I18n.t('cards.File.send')}</button>;
            return (<p key={idx}>{opt} {removeButton}</p>);
          })}
          <div className='NewPollOption'>
            <input type='text'
              placeholder='Another option'
              value={newOption}
              onKeyDown={e => {
                if (e.keyCode === 13)
                  this.addNewOption();
              }}
              onChange={e => this.setState({ newOption: e.target.value })} />
            <button className='inline' onClick={this.addNewOption.bind(this)}>{I18n.t('cards.File.send')}</button>
          </div>
        </div>
      </div>
    )
  }
}

class PollPrompt extends Component {
  constructor(props) {
    super(props);
    this.state = {
      savedResponses: undefined,
      selectedIndex: undefined,
      isSubmitting: false,
      submitted: false
    }
  }
  loadResponses() {
    const messageID = this.props.message.id;
    if (!messageID) {
      this.setState({ savedResponses: new Error('No message ID') });
      return;
    }
    get(`/message/${stripPrefix(messageID)}`, (err, res) => {
      if (err) {
        this.setState({ savedResponses: err });
        return;
      }
      else {
        this.setState({ savedResponses: res });
        if (res.votes) {
          const keys = Object.keys(res.votes);
          const selectedIndex = res.votes[keys[0]];
          this.setState({ selectedIndex });
        }
      }
    });
  }
  componentDidMount() {
    this.loadResponses();
  }
  componentWillReceiveProps(nextProps) {
    this.loadResponses();
  }
  onSubmit() {
    this.setState({ isSubmitting: true });
    const messageID = stripPrefix(this.props.message.id);
    const selectedIndex = this.state.selectedIndex;
    const patchOp = {operation: 'set', property: `votes.${currentUser().id}`, value: selectedIndex };
    const payload = { raw: JSON.stringify(patchOp) };
    patch(`/message/${messageID}`, payload, (err, res) => {
      if (err)
        this.setState({ isSubmitting: err });
      else if (!res.ok)
        this.setState({ isSubmitting: new Error(res.error) });
      else {
        this.setState({ isSubmitting: false, submitted: true });
        // Send receipt message
        const conversation = WebSDK.getConversation(this.props.message.conversationId);
        const encodedMessageID = btoa(this.props.message.id);
        const receiptMIMEType = `application/x.card-response.1+json;card="${encodedMessageID}"`;
        const receiptMessage = conversation.createMessage({
          parts: [{ body: JSON.stringify(res.patch), mimeType: receiptMIMEType }]
        });
        receiptMessage.send();
      }
    });
  }
  render() {
    const { savedResponses, selectedIndex, isSubmitting, submitted } = this.state;
    const { content } = this.props;
    const { question, choices } = content;
    const cardTitle = question && question.length > 0 ? question : 'Poll';
    const finalized = submitted || (savedResponses && savedResponses.votes && Object.keys(savedResponses.votes).length > 0);
    let submitButton = null;
    if (selectedIndex >= 0) {
      if (finalized)
        submitButton = <button className='inline' disabled>Submitted</button>;
      else if (isSubmitting instanceof Error)
        submitButton = <button className='inline error' onClick={() => alert(isSubmitting.message)}>Error</button>;
      else if (isSubmitting)
        submitButton = <button className='inline' disabled>Submitting&hellip; <FontAwesome name='spinner' spin /></button>;
      else
        submitButton = <button className='inline' onClick={this.onSubmit.bind(this)}>Submit</button>;
    }
    if (typeof savedResponses === 'undefined') {
      return <p><FontAwesome name='spinner' spin /> Loading responses&hellip;</p>;
    }
    else if (savedResponses instanceof Error) {
      return <p>Error loading response: {savedResponses.message}</p>;
    }
    else {
      let agentPrompt = null;
      if (!isUserMode()) {
        if (finalized)
          agentPrompt = <p className='AgentPrompt'>Recipient has selected:</p>;
        else
          agentPrompt = <p className='AgentPrompt'>Waiting for recipient to respond &hellip;</p>;
      }
      let userPrompt = null;
      if (isUserMode())
        userPrompt = <label key='label'>Select an option&hellip;</label>;
      return (
        <div className='PollPrompt CardBody'>
          <div className='CardHeader'>
            <p className='CardTitle'><FontAwesome name='bars' /> {cardTitle}</p>
            {submitButton}
          </div>
          <div className='ProposedOptions'>
            {agentPrompt}
            {userPrompt}
            {choices.map((choice, idx) => {
              const selected = selectedIndex === idx;
              const disabled = !isUserMode() || finalized;
              return (
                <button
                  className={classNames('PollOption', { selected })}
                  key={idx}
                  onClick={_ => this.setState({ selectedIndex: idx })}
                  disabled={disabled}>
                  {choice}</button>
              );
            })}
          </div>
        </div>
      )
    }
  }
}

class Poll extends Component {
  render() {
    const { content, onSend, message } = this.props;
    if (content === 'compose')
      return <PollCompose onSend={onSend} message={message} />;
    else {
      try {
        const payload = JSON.parse(content);
        return <PollPrompt content={payload} message={message} />;
      } catch (e) {
        return <p>Undefined poll type</p>;
      }
    }
  }
}

registerComponent('csr-poll-card', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        const setAndRender = () => {
          if (value.parts[0].mimeType.match(responseMIMEType)) {
            this.content = value.parts[0].body;
            return;
          }
          this.content = value.parts[0].body;
          this.onRender();
        }
        if (value) {
          value.on('messages:sent', setAndRender, this);
        }
        setAndRender();
      }
    }
  },
  methods: {
    onAfterCreate: function() {
      const message = this.message;
      if (!message.isNew())
        return;
      this.onSend = (payload) => {
        const bodyString = JSON.stringify(payload);
        message.parts[0].body = bodyString;
        message.send();
      }
    },
    onAttach: function() {
      WebSDK.on('messages:add', (event) => {
        const newMessage = event.messages[0];
        const firstPartMIME = newMessage.parts[0].mimeType;
        if (!firstPartMIME.match(responseMIMEType))
          return;
        const parsedMIME = contentType.parse(firstPartMIME);
        const cardID = atob(parsedMIME.parameters['card']);
        if (cardID !== this.message.id)
          return;
        this.onRender();
      }, this);
    },
    onRender: function() {
      const { content, onSend, message } = this;
      ReactDOM.render(<Poll content={content} onSend={onSend} message={message} />, this);
    },
    onDetach: function() {
      WebSDK.off(null, null, this);
    }
  }
});

registerMessageHandler({
  tagName: 'csr-poll-card',
  label: 'Poll',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});