import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Loading from './Loading';
import { currentSessionToken } from '../login/auth';
import { getFilters, reloadFilters, selectConversation, jumpFilter } from './actions';
import { snakeCaseToTitle } from '../utils';
import './ConversationsFilters.css';
import { Translate, I18n } from 'react-redux-i18n'

const provideActions = dispatch => {
  return {
    onSelectConversation: conversationID => {
      dispatch(selectConversation(conversationID));
    }
  }
};

class JumpBar extends Component {
  render() {
    const { value, onChange } = this.props;
    return (
      <div className='JumpBar'>
        <input type='text' placeholder={I18n.t('conversationsFilters.jumpbarPlaceholder')} value={value} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
}

class FilterHeader extends Component {
  render() {
    const { name, conversations } = this.props
    return (
      <h2 className='FilterHeader'>
        {name}
        {conversations && conversations.length > 0 ? <span className='filterCount'>{conversations.length}</span> : null}
      </h2>
    )
  }
}

class ConversationCell extends Component {
  render() {
    const { conversation, selected } = this.props;
    const conversationID = conversation.id;

    var participantNames;
    if (conversation.primary_user_first_name)
      participantNames = `${conversation.primary_user_first_name} ${conversation.primary_user_last_name}`;
    else if (conversation.primary_user_email)
      participantNames = conversation.primary_user_email;
    else
      participantNames = `User ${conversation.metadata.primary_user_id}`;

    const onClick = this.props.onClick;

    return (
      <button
        type='button'
        className={classnames('ConversationCell', { active: selected })}
        onClick={_ => onClick(conversationID)}
        onDoubleClick={_ => window.open(`/conversation/${conversationID.split('conversations/')[1]}?st=${currentSessionToken()}`)}>
        <h4>{participantNames}</h4>
      </button>
    )
  }
}

class ConversationsList extends Component {
  render() {
    const { conversations, selectedConversation } = this.props;
    var cells;
    if (typeof conversations === 'undefined')
      cells = <Loading subject='conversations' />;
    else if (!conversations)
      cells = (
        <div className='ConversationListBanner error'>
          <p>{I18n.t('conversationsFilters.constants.error_conversations')}</p>
        </div>
      )
    else if (conversations.length < 1)
      cells = (
        <div className='ConversationListBanner'>
          <p><strong>{I18n.t('conversationsFilters.constants.no_conversations')}</strong></p>
        </div>
      )
    else
      cells = conversations.map((conversation, idx) => {
        const selected = conversation.id === selectedConversation;
        return <ConversationCell conversation={conversation} selected={selected} key={idx} onClick={this.props.onSelectConversation} />
      });
    return (
      <div>{cells}</div>
    )
  }
}

class ConversationsFilters extends Component {
  componentDidMount() {
    const { onMount } = this.props;
    if (onMount)
      onMount()
  }
  render() {
    const conversations = this.props.conversations;
    const sections = Object.keys(conversations).map((key, idx) => {
      const sectionConversations = conversations[key]
      const header = <FilterHeader name={I18n.t('conversationsFilters.constants.' + key)} conversations={sectionConversations} key={'header' + idx} />
      const stateQuery = state => ({
        filterName: key,
        conversations: sectionConversations,
        selectedConversation: state.conversations.selectedConversation
      });
      const list = React.createElement(connect(stateQuery, provideActions)(ConversationsList), { key: 'list' + idx });
      return [header, list];
    });
    const jumpbar = <JumpBar value={this.props.ui.jumpFilterValue} onChange={this.props.onJumpChange} key={-1} />;
    const children = [jumpbar].concat([].concat.apply([], sections));

    return <div>{children}</div>;
  }
}

const dispatchFilterActions = dispatch => {
  return {
    onMount: () => {
      dispatch(getFilters());
      window._filterListPollTimer = setInterval(() => { dispatch(reloadFilters()) }, 2000);
    },
    onJumpChange: value => {
      dispatch(jumpFilter(value));
    }
  }
}

export default connect(state => state.conversations, dispatchFilterActions)(ConversationsFilters);
