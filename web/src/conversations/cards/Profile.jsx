import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import FontAwesome from 'react-fontawesome';
import './Card.css';
import './Profile.css';
import { WebSDK } from '../../Layer';
import { get, patch } from '../../api';
import { currentUser, isUserMode } from '../../login/auth';
import * as Layer from 'layer-websdk';
import { stripPrefix } from '../../utils';
import classNames from 'classnames';
import { I18n } from 'react-redux-i18n';
const contentType = require("content-type");
import LabelledField from '../LabelledField'

const mimeType = 'application/x.card.text-profile+json';
const responseMIMEType = /^application\/x\.card-response.*\+json.*$/;
const messagePartsForProfile = (body) => {
  return [new Layer.MessagePart({ mimeType, body })];
};
export { messagePartsForProfile };

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      last_name: '',
      first_name: '',
      phone: '',
      birthday: '',
      sex: '',
      savedResponses: undefined,
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
      } else {
        this.setState({ savedResponses: res });
        if (res.profile) {
          const { id, last_name, first_name, phone, sex, birthday } = res.profile;
          this.setState({ 
            id: id,
            last_name: last_name,
            first_name: first_name,
            phone: phone,
            birthday: birthday,
            sex: sex,
          });
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
    const { id, last_name, first_name, phone, birthday, sex } = this.state;
    const profile = {
      id: id,
      last_name: last_name,
      first_name: first_name,
      phone: phone,
      birthday: birthday,
      sex: sex,
    };
    const patchOp = {operation: 'set', property: `profile`, value: profile };
    const payload = { raw: JSON.stringify(patchOp) };
    patch(`/message/${messageID}`, payload, (err, res) => {
      if (err)
        this.setState({ isSubmitting: err });
      else if (!res.ok)
        this.setState({ isSubmitting: new Error(res.error) });
      else {
        this.setState({ isSubmitting: false, submitted: true });
      }
    });
  }
  render() {
    const { id, last_name, first_name, phone, sex, birthday, isSubmitting, submitted } = this.state;

    let submitButton = null;
    if (isSubmitting instanceof Error)
      submitButton = <button className='inline error' onClick={() => alert(isSubmitting.message)}>Error</button>;
    else if (isSubmitting)
      submitButton = <button className='inline' disabled>登録中&hellip; <FontAwesome name='spinner' spin /></button>;
    else
      submitButton = <button className='inline' onClick={this.onSubmit.bind(this)}>登録</button>;
    try {
      return (
        <div className='ProfilePrompt CardBody'>
          <div className='CardHeader'>
            <p className='CardTitle'><FontAwesome name='bars' /> お客様情報</p>
            {submitButton}
          </div>
          <div className='ProposedOptions'>
            <table>
              <tbody>
                <tr>
                  <th>お名前（姓）</th>
                  <td>
                    <input type='text'
                      value={last_name}
                      onChange={e => this.setState({ last_name: e.target.value })} />
                  </td>
                </tr>
                <tr>
                  <th>お名前（名）</th>
                  <td>
                    <input type='text'
                      value={first_name}
                      onChange={e => this.setState({ first_name: e.target.value })} />
                  </td>
                </tr>
                <tr>
                  <th>生年月日</th>
                  <td>
                    <input type='text'
                      value={birthday}
                      onChange={e => this.setState({ birthday: e.target.value })} />
                  </td>
                </tr>
                <tr>
                  <th>性別</th>
                  <td>
                    <input type='text'
                      value={sex}
                      onChange={e => this.setState({ sex: e.target.value })} />
                  </td>
                </tr>
                <tr>
                  <th>電話番号</th>
                  <td>
                    <input type='text'
                      value={phone}
                      onChange={e => this.setState({ phone: e.target.value })} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    } catch (e) {
      console.log(e);
      return <p>Undefined profile type</p>;
    }
  }
}

registerComponent('csr-profile-card', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        const setAndRender = () => {
          this.content = value.parts[0].body;
          return;
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
        this.onRender();
      }, this);
    },
    onRender: function() {
      const { content, onSend, message } = this;
      if (message.isNew()) {
        const { profile } = JSON.parse(content);
        const { id, last_name, first_name, phone, birthday, sex } = profile;
        const messageID = stripPrefix(message.id);
        const initialProfile = {
          id: id,
          last_name: last_name || '',
          first_name: first_name || '',
          phone: phone || '',
          birthday: birthday || '',
          sex: sex || ''
        }
        const patchOp = {operation: 'set', property: `profile`, value: initialProfile };
        const payload = { raw: JSON.stringify(patchOp) };
        patch(`/message/${messageID}`, payload, (err, res) => {
          if (err)
            console.log(err);
          else if (!res.ok)
            console.log(res.error);
          else {
            this.onSend({});
          }
        });
        ReactDOM.render(<Profile message={message} />, this);
        return;
      }
      ReactDOM.render(<Profile message={message} />, this);
    },
    onDetach: function() {
      WebSDK.off(null, null, this);
    }
  }
});

registerMessageHandler({
  tagName: 'csr-profile-card',
  label: 'Profile',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});