import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import * as Layer from 'layer-websdk';
import './Confirmation.css';

const responseMIMEType = 'application/x.card-response+json';

class Confirmation extends Component {
  confirm() {
    const composer = document.getElementsByTagName('layer-composer')[0];
    const body = {
      title: '',
      subtitle: '',
      selection_mode: 'none',
      data: 'はい'
    };
    const parts = [new Layer.MessagePart({ mimeType: responseMIMEType, body: JSON.stringify(body) })];
    composer.send(parts);
  }
  confirmNot() {
    const composer = document.getElementsByTagName('layer-composer')[0];
    const body = {
      title: '',
      subtitle: '',
      selection_mode: 'none',
      data: 'いいえ'
    };
    const parts = [new Layer.MessagePart({ mimeType: responseMIMEType, body: JSON.stringify(body) })];
    composer.send(parts);
  }
  render() {
    const { content } = this.props;
    try {
      const { data } = JSON.parse(content);
      const title = data.title;
      const contents = data.contents;
      return (
        <div className='Confirmation'>
          <div className="header">
            <span>{data.title}</span>
          </div>
          <div className="content">
            <table>
              <tbody>
                {contents.map(d => {
                  return (
                    <tr>
                      <th>{d.name}</th>
                      <td>{d.value}</td>
                    </tr>);
                })}
              </tbody>
            </table>
          </div>
          <div className="footer">
            <span onClick={this.confirm.bind(this)}>はい</span>
            <span onClick={this.confirmNot.bind(this)}>いいえ</span>
          </div>
        </div>
      )
    } catch (e) {
      return (
        <div className='Confirmation'>
          <p>Error</p>
        </div>
      )
    }
  }
}

registerComponent('dom-confirmation-demo', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        this.content = value.parts[0].body;
      }
    },
    content: {
      set: function(value) {
        this.onRender();
      }
    }
  },
  methods: {
    onRender: function() {
      ReactDOM.render(<Confirmation content={this.content} />, this);
    }
  }
});

const mimeType = 'application/x.card.confirmation+json';
registerMessageHandler({
  tagName: 'dom-confirmation-demo',
  label: 'Flight Ticket Purchase',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});

const messagePartsForConfirmation = (data, params={}) => {
  const body = {
    title: params.title || '',
    subtitle: params.subtitle || '',
    selection_mode: params.selection_mode || 'none',
    data: data
  };
  return [new Layer.MessagePart({ mimeType: mimeType, body: JSON.stringify(body) })];
}
export { messagePartsForConfirmation };
