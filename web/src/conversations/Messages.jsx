import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import LayerUI, { WebSDK, LayerSDK } from '../Layer'
const { ConversationPanel, SendButton } = LayerUI
import { Button, OverlayTrigger, Popover } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import {
  updateConversationPreview,
  updateComposerContent,
  activate,
  deactivate,
  selectMessage,
  deselectMessage,
  deselectAllMessages,
  sendEmail,
  sendSMS,
  removeBot,
  showOtherAgents,
  reassignToAgent } from './actions';
import AddCardPicker from './AddCardPicker';
import cardTypes from './CardTypes';
import './Messages.css';
import { isUserMode, currentUser } from '../login/auth';
import { conversationWithID } from '../utils';
import { get } from '../api';
import classnames from 'classnames';

require('./Notify');

import { messagePartsForCalendar } from './cards/Calendar';
import { messagePartsForCarousel } from './cards/Carousel';
import { messagePartsForZoomCall } from './cards/Zoom';
import { messagePartsForLocation } from './cards/Location';
import { messagePartsForPoll } from './cards/Poll';
require('./cards/LinkPreview');
require('./cards/Response');
import { messagePartsForFile } from './cards/File';
require('./cards/Receipt');
import { I18n } from 'react-redux-i18n'

class EmptyConversationPrompt extends Component {
  render() {
    return (
      <div className='emptyConversationPrompt'>
        <h5>{I18n.t('messages.newConversationText')}</h5>
        <p>{I18n.t('messages.sendMessageText')}</p>
      </div>
    );
  }
};

class ActionBarImpl extends Component {
  render() {
    const {
      onActivate,
      onDeactivate,
      sendEmail,
      sendSMS,
      removeBot,
      showAssigneeTargets,
      reassign,
      active,
      selectedMessages,
      removeBotState,
      sendEmailState,
      sendSMSState,
      conversation,
      lead,
      assignees } = this.props;

    var recipientInfo;
    if (conversation) {
      var leadSince = null;
      if (lead) {
        if (lead.created_at) {
          const leadCreatedAt = (lead.created_at instanceof Date) ? lead.created_at : new Date(lead.created_at);
          leadSince = <p>{I18n.t('messages.leadSince', {date: String(leadCreatedAt.getMonth() + 1) + '/' + String(leadCreatedAt.getDate())})}</p>;
        }
      }
      recipientInfo = (
        <div>
          <h4>{I18n.t('name.text', {firstName: conversation.primary_user_first_name, lastName: conversation.primary_user_last_name})}</h4>
          {leadSince}
        </div>
      );
    }

    var removeBotButton;
    if (removeBotState === 'default')
      removeBotButton = <button className='inline' onClick={removeBot}>{I18n.t('messages.removeBotText')}</button>
    else if (removeBotState === 'removing')
      removeBotButton = <button className='inline' disabled>{I18n.t('messages.removingBotText')}<FontAwesome name='spinner' spin /></button>
    else if (removeBotState instanceof Error)
      removeBotButton = <button className='inline error' onClick={() => alert(removeBotState)}>{I18n.t('messages.errorMessage')}</button>
    else if (removeBotState === 'done')
      removeBotButton = <button className='inline success'>{I18n.t('messages.botRemovedText')}<FontAwesome name='check' /></button>
    else
      removeBotButton = <button className='inline error'>{I18n.t('messages.unrecognizedState')} {removeBotState}</button>

    var emailButton;
    if (selectedMessages.length < 1)
      emailButton = null;
    else if (sendEmailState === 'default')
      emailButton = <button className='inline' onClick={sendEmail}>{I18n.t('messages.sendEmailText')}</button>
    else if (sendEmailState === 'sending')
      emailButton = <button className='inline' disabled>{I18n.t('messages.sendingText')} <FontAwesome name='spinner' spin /></button>
    else if (sendEmailState instanceof Error)
      emailButton = <button className='inline error' onClick={() => alert(sendEmailState)}>{I18n.t('messages.errorMessage')}</button>
    else if (sendEmailState === 'sent')
      emailButton = <button className='inline success'>{I18n.t('messages.sentEmailText')} <FontAwesome name='check' /></button>
    else
      emailButton = <button className='inline error'>{I18n.t('messages.unrecognizedState')} {sendEmailState}</button>

    var smsButton;
    if (selectedMessages.length < 1)
      smsButton = null
    else if (sendSMSState === 'default')
      smsButton = <button className='inline' onClick={sendSMS}>{I18n.t('messages.sendSMSText')}</button>
    else if (sendSMSState === 'sending')
      smsButton = <button className='inline' disabled>{I18n.t('messages.sendingText')} <FontAwesome name='spinner' spin /></button>
    else if (sendSMSState instanceof Error)
      smsButton = <button className='inline error' onClick={() => alert(sendSMSState)}>{I18n.t('messages.errorMessage')}</button>
    else if (sendSMSState === 'sent')
      smsButton = <button className='inline success'>{I18n.t('messages.smsSentText')} <FontAwesome name='check' /></button>
    else
      smsButton = <button className='inline error'>{I18n.t('messages.unrecognizedState')} {sendEmailState}</button>

    const actionButton = active
                          ? <button className='inline active' onClick={onDeactivate}>{I18n.t('messages.doneText')}</button>
                          : <button className='inline' onClick={onActivate}>{I18n.t('messages.actionsText')}</button>
    const assigneeSelect = assignees ? (
      <select defaultValue={conversation.metadata.owner_id} onChange={reassign}>
        {assignees.map(a => <option value={a.id} key={a.id}>{a.first_name} {a.last_name}</option>)}
      </select>
    ) : <button className='inline' onClick={showAssigneeTargets}>{I18n.t('messages.reassignText')}</button>
    return (
      <div className='ActionBar'>
        <div className='recipientInfo'>
          {recipientInfo}
        </div>
        <div className='actions'>
          {assigneeSelect}
          {removeBotButton}
          {emailButton}
          {smsButton}
          {actionButton}
        </div>
      </div>
    )
  }
}

const ActionBar = connect(
  state => Object.assign({},
                         state.conversations.ui.actionBar,
                         state.i18n,
                         { conversation: conversationWithID(state, state.conversations.selectedConversation) },
                         { lead: state.conversations.selectedProfile },
                         { assignees: state.conversations.assignees }),
  dispatch => ({
    onActivate: _ => {
      dispatch(activate());
      document.querySelector('layer-messages-list').classList.add('editActive');
      document.querySelectorAll('layer-message-item-sent.layer-message-text-plain').forEach(item => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'layer-message-action-select';
        checkbox.setAttribute('data-message-id', item.properties.item.id);
        checkbox.onchange = event => {
          const messageID = event.target.getAttribute('data-message-id');
          if (event.target.checked)
            dispatch(selectMessage(messageID));
          else
            dispatch(deselectMessage(messageID));
        };
        const main = item.querySelector('.layer-message-item-main');
        main.appendChild(checkbox);
      });
    },
    onDeactivate: _ => {
      dispatch(deactivate());
      dispatch(deselectAllMessages());
      document.querySelector('layer-messages-list').classList.remove('editActive');
      document.querySelectorAll('.layer-message-action-select').forEach(checkbox => checkbox.remove());
    },
    sendEmail: _ => {
      dispatch(sendEmail());
    },
    sendSMS: _ => {
      dispatch(sendSMS());
    },
    removeBot: _ => {
      dispatch(removeBot());
    },
    showAssigneeTargets: _ => {
      dispatch(showOtherAgents());
    },
    reassign: e => {
      dispatch(reassignToAgent(e.target.value));
    }
  })
)(ActionBarImpl);

let demoModeShownIndex = 0;
const demoModeShowNextMessage = () => {
  const nextItem = document.getElementsByClassName('layer-list-item')[demoModeShownIndex];
  if (!nextItem) return;
  nextItem.style.display = 'flex';
  const panel = document.getElementsByTagName('layer-conversation-panel')[0];
  if (panel)
    panel.children[0].scrollTo(10000000);  // panel.children[0] is layer-messages-list
  demoModeShownIndex += 1;
};

class MessagesImpl extends Component {
  componentDidMount() {
    if (this.props.clickThroughMessages)
      document.addEventListener('click', demoModeShowNextMessage);

    // add intl to typing indicator
    document.addEventListener('layer-typing-indicator-change', (evt) => {
      evt.preventDefault()
      var widget = evt.target
      var typingUsers = evt.detail.typing
      var pausedUsers = evt.detail.paused
      var text = ''
      if (typingUsers.length) text = typingUsers.length + I18n.t('messages.typingIndicator.usersAreTypingText')
      if (pausedUsers.length && typingUsers.length) text += I18n.t('messages.typingIndicator.andText')
      if (pausedUsers.length) text += pausedUsers.length + I18n.t('messages.typingIndicator.usersPausedTypingText')
      widget.value = text
    })
  }
  componentWillUnmount() {
    if (this.props.clickThroughMessages)
      document.removeEventListener('click', demoModeShowNextMessage);
  }
  componentDidUpdate(prevProps, prevState) {
    // if (this.props.isDemo) {
    //   const panel = document.getElementsByTagName('layer-conversation-panel')[0];
    //   if (!panel) return;
    //   const newQuery = WebSDK.createQuery({
    //     model: LayerSDK.Query.Message,
    //     predicate: `conversation.id = '${this.props.selectedConversation.id}'`,
    //     paginationWindow: 100
    //   });
    //   newQuery.data = this.props.selectedConversation.messages.slice(0).reverse();
    //   panel.query = newQuery;
    // }
  }
  emptyConversationNode () {
    const node = document.createElement('div')
    node.innerHTML = ReactDOMServer.renderToString(<EmptyConversationPrompt />)
    return node
  }
  render () {
    // Hack to show "Loading" while link preview loads
    const composer = document.getElementsByTagName('layer-composer')[0];
    var conversationID = this.props.conversationID;
    if (conversationID && conversationID.indexOf('layer://') < 0)
      conversationID = `layer:///conversations/${conversationID}`;
    var content;
    const onSend = event => {
      try {
        this.props.onSendMessage(conversationID, event);
        if (this.props.onSendTrigger)
          this.props.onSendTrigger(conversationID, event);
      } catch (e) {
        console.error(e)
      }
      const message = event.detail.item;
      const mainMessagePart = message.parts[0];
      if (mainMessagePart.isTextualMimeType() && mainMessagePart.body.indexOf('signnow') >= 0)
        return;  // special handling for SignNow since their OG:Image is broken
      // URL regex: https://mathiasbynens.be/demo/url-regex
      const urlRegex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
      const urlMatches = mainMessagePart.isTextualMimeType() && mainMessagePart.body.match(urlRegex);
      const url = urlMatches ? urlMatches[0] : null;
      if (!url)
        return;
      event.preventDefault();
      const ogPart = new LayerSDK.MessagePart({mimeType: 'application/og-preview', body: 'loading'});
      message.addPart(ogPart);
      // Preview message in conversation
      message.presend();
      get(`/meta?uri=${encodeURI(url)}`, (err, res) => {
        if (err) {
          console.log(`Error getting meta tags for ${url}: ${err}`);
          message.parts[1].body = 'error';
        }
        message.parts[1].body = JSON.stringify(res);
        message.send();
        message.trigger('messages:change', {});  // Re-render
      });
    };
    const { composerContent, onComposerChange } = this.props;

    const banner = isUserMode() ? (
      <div className='LogoBanner'>
        <p><img src='/wordmark.svg' alt='Layer' /></p>
      </div>
    ) : <ActionBar />;

    if (!conversationID) {
      content = (
        <div className='noConversationSelected'>
          <p>{I18n.t('messages.noConversationSelected')}</p>
        </div>
      );
    }
    else {
      let cards = isUserMode() ? cardTypes.filter(c => c.userVisible) : cardTypes;
      const addCardPicker = (
        <Popover id='cardPicker' title='Send a card'>
          <AddCardPicker options={cards} onSelectCard={title => {
            this.overlayTrigger.hide();
            this.props.onSelectCard(title);
          }} />
        </Popover>
      );
      content = <ConversationPanel
                  ref={self => { this.conversationPanel = self }}
                  conversationId={conversationID}
                  pageSize={100}
                  emptyMessageListNode={this.emptyConversationNode()}
                  getMessageDeleteEnabled={(_) => false}
                  composePlaceholder={I18n.t('messages.composePlaceholder')}
                  composeText={composerContent}
                  composeButtonsLeft={[
                    <OverlayTrigger ref={self => { this.overlayTrigger = self }} trigger='click' placement='top' rootClose overlay={addCardPicker}>
                      <Button id='addCardButton'>+</Button>
                    </OverlayTrigger>
                  ]}
                  composeButtons={[<SendButton text={I18n.t('messages.sendText')} />]}
                  onComposerChangeValue={onComposerChange}
                  onSendMessage={onSend} />;
      if (!("geolocation" in navigator))
        cards = cards.filter(c => c.title !== 'Location');
    }
    return (
      <div className={classnames('full-height-panel', 'Messages', {clickThroughMessages: this.props.clickThroughMessages})}>
        <div className='full-height-panel' id='messagesContent'>
          {content}
        </div>
        {banner}
      </div>
    );
  }
}

const Messages = connect(
  (state, ownProps) => Object.assign({},
                                     state.i18n,
                                     { isDemo: state.ui.isDemo },
                                     { clickThroughMessages: state.ui.clickThroughMessages },
                                     { selectedConversation: conversationWithID(state, ownProps.conversationID || state.conversations.selectedConversation) },
                                     { conversationID: ownProps.conversationID || state.conversations.selectedConversation },
                                     { composerContent: state.conversations.ui.composerContent },
                                     { onSendTrigger: ownProps.onSendTrigger }),
  (dispatch) => ({
    onSendMessage: (conversationID, evt) => {
      dispatch(updateConversationPreview(conversationID, evt.detail.item));
    },
    onComposerChange: evt => {
      dispatch(updateComposerContent(evt.detail.value));
    },
    onSelectCard: cardTitle => {
      const composer = document.getElementsByTagName('layer-composer')[0];
      switch (cardTitle) {
        case "Calendar invite":
          if (composer) {
            const conversation = composer.conversation;
            const parts = messagePartsForCalendar('compose');
            const message = conversation.createMessage({ parts });
            message.presend();
          }
          break;
        case "Carousel (properties)":
          if (composer) {
            const realEstateCards = [
              { title: '308 Sea Cliff Ave', detail: '$8,900,000', image_url: '/houses/308-sea-cliff-ave.jpg' },
              { title: '439 Burnett Ave', detail: '$2,250,000', image_url: '/houses/439-burnett-ave.jpg' },
              { title: '817 Marly Way', detail: '$1,200,000', image_url: '/houses/817-marly-way.jpg' },
              { title: '2517 Waymaker Way', detail: '$2,500,000', image_url: '/houses/2517-waymaker-way.jpg' },
              { title: '5832 Kana Rd', detail: '$3,250,000', image_url: '/houses/5832-kana-rd.jpg' }
            ];
            const parts = messagePartsForCarousel(realEstateCards);
            composer.send(parts);
          }
          break;
        case "Carousel (finance)":
          if (composer) {
            const cards = [
              { title: 'WTI Crude', detail: 'Oil has been down in the last month and is expected to go up to $100 per barrel soon.', image_url: '/finance/oil.png' },
              { title: 'Sugar', detail: 'Sugar is expected to rise as backlash against HFCS and artificial sweeteners intensifies.', image_url: '/finance/sugar.png' },
              { title: 'Real Estate', detail: 'Real estate is poised for a rebound and Fidelity has the best performing RE fund.', image_url: '/finance/reip.png' },
              { title: 'Donate', detail: "Pay it forward by contributing to the national 'Kids who don't read good' fund", image_url: '/finance/read.jpg' }
            ];
            const parts = messagePartsForCarousel(cards);
            composer.send(parts);
          }
          break;
        case "Carousel (pages)":
          if (composer) {
            const cards = [
              { title: 'Airlines', detail: '', image_url: '/carousel-pages/airline.jpg', link: 'https://layer.com/airlines/' },
              { title: 'Finance', detail: '', image_url: '/carousel-pages/financial.jpg', link: 'https://layer.com/finance/' },
              { title: 'Hospitality', detail: '', image_url: '/carousel-pages/hotel.jpg', link: 'https://layer.com/hotels/' },
              { title: 'Retail', detail: '', image_url: '/carousel-pages/retail.jpg', link: 'https://layer.com/retail/' }
            ];
            const parts = messagePartsForCarousel(cards);
            composer.send(parts);
          }
          break;
        case "Carousel (videos)":
          if (composer) {
            const cards = [
              { title: 'Airlines', detail: '', image_url: '/carousel-videos/airline.png', link: 'https://vimeo.com/221311893' },
              { title: 'Finance', detail: '', image_url: '/carousel-videos/financial.png', link: 'https://vimeo.com/217919315' },
              { title: 'Hospitality', detail: '', image_url: '/carousel-videos/hotel.png', link: 'https://vimeo.com/214705752' },
              { title: 'Retail', detail: '', image_url: '/carousel-videos/retail.png', link: 'https://vimeo.com/206495347' }
            ];
            const parts = messagePartsForCarousel(cards);
            composer.send(parts);
          }
          break;
        case "Zoom call":
          if (composer) {
            const parts = messagePartsForZoomCall();
            composer.send(parts);
          }
          break;
        case "Location":
          {
            const conversation = composer.conversation;
            // Attempt to be compatible with Atlas
            // https://github.com/layerhq/Atlas-iOS/blob/5daff2cab1c8a58278564e4fcce048d089a58c23/Code/Utilities/ATLMessagingUtilities.m#L35
            const parts = messagePartsForLocation('loading');
            const message = conversation.createMessage({ parts: parts });
            // Preview message in conversation
            message.presend();
          }
          break;
        case "Poll":
          if (composer) {
            const conversation = composer.conversation;
            const parts = messagePartsForPoll('compose');
            const message = conversation.createMessage({ parts });
            message.presend();
          }
          break;
        case "File":
          if (composer) {
            const conversation = composer.conversation;
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*,application/pdf';
            fileInput.onchange = _ => {
              const file = fileInput.files[0];
              const message = conversation.createMessage({ parts: messagePartsForFile(file) });
              message.send();
            }
            fileInput.click();
          }
          break;
        case "Good news":
          if (composer) {
            composer.value = "Bill, I have good news to discuss. Please join me";
          }
          break;
        case "Touchpoint 2":
          if (composer) {
            composer.value = "I have been reviewing your portfolio. First of all, congratulations, it has gone up by roughly $20 million. Check out your wealth report attached."
          }
          break;
        case "予定の作成":
          if (composer) {
            const conversation = composer.conversation;
            const parts = messagePartsForCalendar('compose');
            const message = conversation.createMessage({ parts });
            message.presend();
          }
          break;
        case "カルーセル (物件情報)":
          if (composer) {
            const realEstateCards = [
              { title: '308 Sea Cliff Ave', detail: '￥890,000,000', image_url: '/houses/308-sea-cliff-ave.jpg' },
              { title: '439 Burnett Ave', detail: '￥225,000,000', image_url: '/houses/439-burnett-ave.jpg' },
              { title: '817 Marly Way', detail: '￥120,000,000', image_url: '/houses/817-marly-way.jpg' },
              { title: '2517 Waymaker Way', detail: '￥250,000,000', image_url: '/houses/2517-waymaker-way.jpg' },
              { title: '5832 Kana Rd', detail: '￥325,000,000', image_url: '/houses/5832-kana-rd.jpg' }
            ];
            const parts = messagePartsForCarousel(realEstateCards);
            composer.send(parts);
          }
          break;
        case "カルーセル (金融情報)":
          if (composer) {
            const cards = [
              { title: 'WTI Crude', detail: 'Oil has been down in the last month and is expected to go up to $100 per barrel soon.', image_url: '/finance/oil.png' },
              { title: 'Sugar', detail: 'Sugar is expected to rise as backlash against HFCS and artificial sweeteners intensifies.', image_url: '/finance/sugar.png' },
              { title: 'Real Estate', detail: 'Real estate is poised for a rebound and Fidelity has the best performing RE fund.', image_url: '/finance/reip.png' },
              { title: 'Donate', detail: "Pay it forward by contributing to the national 'Kids who don't read good' fund", image_url: '/finance/read.jpg' }
            ];
            const parts = messagePartsForCarousel(cards);
            composer.send(parts);
          }
          break;
        case "カルーセル (Webページ)":
          if (composer) {
            const cards = [
              { title: '航空業界', detail: '', image_url: '/carousel-pages/airline.jpg', link: 'https://layer.com/airlines/' },
              { title: '金融業界', detail: '', image_url: '/carousel-pages/financial.jpg', link: 'https://layer.com/finance/' },
              { title: '接客業界', detail: '', image_url: '/carousel-pages/hotel.jpg', link: 'https://layer.com/hotels/' },
              { title: '不動産業界', detail: '', image_url: '/carousel-pages/retail.jpg', link: 'https://layer.com/retail/' }
            ];
            const parts = messagePartsForCarousel(cards);
            composer.send(parts);
          }
          break;
        case "カルーセル (ビデオ)":
          if (composer) {
            const cards = [
              { title: '航空業界', detail: '', image_url: '/carousel-videos/airline.png', link: 'https://vimeo.com/221311893' },
              { title: '金融業界', detail: '', image_url: '/carousel-videos/financial.png', link: 'https://vimeo.com/217919315' },
              { title: '接客業界', detail: '', image_url: '/carousel-videos/hotel.png', link: 'https://vimeo.com/214705752' },
              { title: '不動産業界', detail: '', image_url: '/carousel-videos/retail.png', link: 'https://vimeo.com/206495347' }
            ];
            const parts = messagePartsForCarousel(cards);
            composer.send(parts);
          }
          break;
        case "Zoomで通話":
          if (composer) {
            const parts = messagePartsForZoomCall();
            composer.send(parts);
          }
          break;
        case "現在位置":
          {
            const conversation = composer.conversation;
            // Attempt to be compatible with Atlas
            // https://github.com/layerhq/Atlas-iOS/blob/5daff2cab1c8a58278564e4fcce048d089a58c23/Code/Utilities/ATLMessagingUtilities.m#L35
            const parts = messagePartsForLocation('loading');
            const message = conversation.createMessage({ parts: parts });
            // Preview message in conversation
            message.presend();
          }
          break;
        case "投票":
          if (composer) {
            const conversation = composer.conversation;
            const parts = messagePartsForPoll('compose');
            const message = conversation.createMessage({ parts });
            message.presend();
          }
          break;
        case "ファイル":
          if (composer) {
            const conversation = composer.conversation;
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*,application/pdf';
            fileInput.onchange = _ => {
              const file = fileInput.files[0];
              const message = conversation.createMessage({ parts: messagePartsForFile(file) });
              message.send();
            }
            fileInput.click();
          }
          break;
        case "定型文1":
          if (composer) {
            composer.value = "こんにちは。今日はあなたによいお知らせがあって連絡しました。ぜひ会話に加わってください。";
          }
          break;
        case "定型文2":
          if (composer) {
            composer.value = "あなたのポートフォリオを確認いたしました。おめでとうございます！約2,000万円の成長がありました。収益表を添付いたしますのでご確認ください。"
          }
          break;
        default:
          break;
      }
    }
  })
)(MessagesImpl);

export default Messages;
