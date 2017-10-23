import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import * as Layer from 'layer-websdk';
import './FlightTicketList.css';

class CarouselCellFullScreen extends Component {
  render() {
    const { close, id, date, routes, price, time, milage, select, selectable } = this.props;
    const flights = routes.map((route, i) => {
      return (
        <div className='flights' key={i}>
          <table>
            <colgroup>
              <col style={{width: "40%"}}/>
              <col/>
              <col style={{width: "40%"}}/>
            </colgroup>
            <tbody>
              <tr>
                <td className='flightTicketCell' style={{wordWrap: 'break-word',textAlign: 'center'}}>
                  <p>{route.depart.airport}</p>
                </td>
                <td><img style={{width: '100%'}} src='/arrow.svg' /></td>
                <td className='flightTicketCell'>
                  <p>{route.arrival.airport}</p>
                </td>
              </tr>
              <tr>
                <td className='flightTicketCell'>
                  <p className='airPortJapanese'>{route.depart.airportJapanese}</p>
                  <p className='dateTime'>{route.depart.dateTime}</p>
                </td>
                <td className='flightTicketCell'><p className='airPortJapanese'>{route.flightName} 便</p></td>
                <td className='flightTicketCell'>
                  <p className='airPortJapanese'>{route.arrival.airportJapanese}</p>
                  <p className='dateTime'>{route.arrival.dateTime}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>);
    });
    const detail = (
      <div className='flightDetail'>
        <table>
          <tbody>
            <tr>
              <th>金額</th>
              <td>{price}</td>
            </tr>
            <tr>
              <th>備考</th>
              <td>飛行時間: {time}<br/>獲得マイル: {milage}</td>
            </tr>
          </tbody>
        </table>
      </div>);
    var selectButton = selectable ? <button className='primary' onClick={select}>予約する</button> : null;
    return (
      <div className='CarouselCellFullScreen'>
        <button onClick={close} className='dismiss'><FontAwesome name='close' /></button>
        <div className='carouselCellImage'>
          <h1>{date}</h1>
          {flights}
          {detail}
          <div className='submit'>
            {selectButton}
          </div>
        </div>
      </div>
    )
  }
}

class CarouselCell extends Component {
  showExpanded() {
    const div = document.createElement('div');
    div.id = 'carouselCellExpanded';
    ReactDOM.render(<CarouselCellFullScreen {...this.props} close={this.closeExpanded.bind(this)} select={this.selectFlight.bind(this)}/>, div);
    document.body.appendChild(div);
  }
  closeExpanded() {
    document.getElementById('carouselCellExpanded').remove();
  }
  selectFlight() {
    if (document.getElementById('carouselCellExpanded')) {
      document.getElementById('carouselCellExpanded').remove();
    };
    console.log(this.props.id + ' selected.');
    const composer = document.getElementsByTagName('layer-composer')[0];
    const { id, date, routes, price, time, milage } = this.props;
    const cards = [
      Object.assign({ id, date, routes, price, time, milage },
                    { selectable: false })
    ];
    console.log(cards);
    const parts = messagePartsForFlightTicketList(cards);
    composer.send(parts);
  }
  render() {
    const { id, date, routes, selectable } = this.props;
    var contents = routes.map((route, i) => {
      const dateHeader = ((i === 0) ? date : '');
      return (
        <div className='flightTicket'>
          <table>
            <colgroup>
              <col style={{width: "40%"}}/>
              <col/>
              <col style={{width: "40%"}}/>
            </colgroup>
            <tbody>
              <tr><td colspan={3} className='dateHeader'>{dateHeader}</td></tr>
              <tr>
                <td className='flightTicketCell' style={{wordWrap: 'break-word',textAlign: 'center'}}>
                  <p>{route.depart.airport}</p>
                </td>
                <td><img style={{width: '100%'}} src='/arrow.svg' /></td>
                <td className='flightTicketCell'>
                  <p>{route.arrival.airport}</p>
                </td>
              </tr>
              <tr>
                <td className='flightTicketCell'>
                  <p className='airPortJapanese'>{route.depart.airportJapanese}</p>
                  <p className='dateTime'>{route.depart.dateTime}</p>
                </td>
                <td className='flightTicketCell'><p className='airPortJapanese'>{route.flightName} 便</p></td>
                <td className='flightTicketCell'>
                  <p className='airPortJapanese'>{route.arrival.airportJapanese}</p>
                  <p className='dateTime'>{route.arrival.dateTime}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    });
    var selectButton = selectable ? <span onClick={this.selectFlight.bind(this)}>選択する</span> : <span />;
    return (
      <div className='CarouselCell'>
        {contents}
        <div className='flightTicketPanel'>
          <span onClick={this.showExpanded.bind(this)}>詳細を見る</span>
          {selectButton}
        </div>
      </div>
    )
  }
}

class Carousel extends Component {
  render() {
    const { content } = this.props;
    try {
      let data = JSON.parse(content);
      const items = data.items || data;
      console.log(items);
      return (
        <div className='carouselContainer'>
          {items.map((card, idx) => <CarouselCell {...card} key={idx} />)}
        </div>
      )
    } catch (e) {
      return (
        <div className='carouselContainer'>
          <p>Could not parse carousel content</p>
        </div>
      )
    }
  }
}

// https://docs.layer.com/sdk/webui/ui_customization#custom-cards
registerComponent('dom-flight-ticket-list-demo', {
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
      ReactDOM.render(<Carousel content={this.content} />, this);
    }
  }
});

const mimeType = 'application/x.card.flight.ticket.list+json';
registerMessageHandler({
  tagName: 'dom-flight-ticket-list-demo',
  label: 'Flight Ticket List',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});

const messagePartsForFlightTicketList = (items, params={}) => {
  if (!Array.isArray(items)) {
    throw new Error('`items` must be an array of card payloads');
  }

  const body = {
    title: params.title || '',
    subtitle: params.subtitle || '',
    selection_mode: params.selection_mode || 'none',
    items: items
  };
  return [new Layer.MessagePart({ mimeType: mimeType, body: JSON.stringify(body) })];
}
export { messagePartsForFlightTicketList };
