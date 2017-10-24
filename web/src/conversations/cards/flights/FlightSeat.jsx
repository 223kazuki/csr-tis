import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import * as Layer from 'layer-websdk';
import './FlightSeat.css';

class FullScreen extends Component {
  selectSeat(seat) {
    const composer = document.getElementsByTagName('layer-composer')[0];
    const { close } = this.props;
    const seats = [
      seat
    ];
    const parts = messagePartsForFlightSeat(seats);
    composer.send(parts);
    close();
  }
  render() {
    const { close, id, date, routes, price, time, milage, select, selectable } = this.props;
    var business = (
      <svg style={{float: 'left', width: '30px'}} height="22px" width="22px" version="1.1" viewBox="0 0 22 22">
        <defs/>
        <g id="App" fill="none" stroke="none" strokeWidth="1">
          <g id="7-select-seat" fill="#8DC1E3" transform="translate(-20.000000, -22.000000)">
            <g id="topbar">
              <g id="business" transform="translate(20.000000, 22.000000)">
                <path id="Fill-1" d="M17.617,21.75 L4.133,21.75 C1.85,21.75 0,19.9 0,17.617 L0,4.133 C0,1.851 1.85,0 4.133,0 L17.617,0 C19.9,0 21.75,1.851 21.75,4.133 L21.75,17.617 C21.75,19.9 19.9,21.75 17.617,21.75"/>
              </g>
            </g>
          </g>
        </g>
      </svg>);
    var economy = (
      <svg style={{float: 'left', width: '30px'}} height="24px" width="24px" version="1.1" viewBox="0 0 24 24">
        <defs/>
        <g id="App" fill="none" stroke="none" strokeWidth="1">
          <g id="7-select-seat" fill="#FEFEFE" stroke="#93A3A9" transform="translate(-116.000000, -21.000000)">
            <g id="topbar">
              <g id="economy" transform="translate(117.000000, 22.000000)">
                <path id="Fill-8" d="M17.617,21.75 L4.133,21.75 C1.85,21.75 0,19.9 0,17.617 L0,4.133 C0,1.851 1.85,0 4.133,0 L17.617,0 C19.899,0 21.75,1.851 21.75,4.133 L21.75,17.617 C21.75,19.9 19.899,21.75 17.617,21.75"/>
              </g>
            </g>
          </g>
        </g>
      </svg>);
    var unavailable = (
      <svg style={{float: 'left', width: '30px'}} height="23px" width="22px" version="1.1" viewBox="0 0 22 23">
        <defs/>
        <g id="App" fill="none" stroke="none" strokeWidth="1">
          <g id="7-select-seat" transform="translate(-219.000000, -22.000000)">
            <g id="topbar">
              <g id="unavailable" transform="translate(219.000000, 22.000000)">
                <g>
                  <path id="Fill-3" d="M17.6953,22.2499 L4.2113,22.2499 C1.9283,22.2499 0.0783,20.3999 0.0783,18.1169 L0.0783,4.6329 C0.0783,2.3509 1.9283,0.4999 4.2113,0.4999 L17.6953,0.4999 C19.9773,0.4999 21.8283,2.3509 21.8283,4.6329 L21.8283,18.1169 C21.8283,20.3999 19.9773,22.2499 17.6953,22.2499" fill="#DBDFE4"/>
                  <polygon id="Fill-6" fill="#9AA3B1" points="15.3394 8.0717 14.2564 6.9887 10.9534 10.2917 7.6494 6.9887 6.5664 8.0717 9.8704 11.3747 6.5664 14.6787 7.6494 15.7617 10.9534 12.4577 14.2564 15.7617 15.3394 14.6787 12.0354 11.3747"/>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>);
    return (
      <div className='FullScreen'>
        <div className='flightSeatMap'>
          <div className='header'>
            <div style={{float: 'flex', display: 'flex', alignItems: 'center'}}>&nbsp;{business} &nbsp;Business&nbsp;</div>
            <div style={{float: 'flex', display: 'flex', alignItems: 'center'}}>&nbsp;{economy} &nbsp;Economy&nbsp;</div>
            <div style={{float: 'flex', display: 'flex', alignItems: 'center'}}>&nbsp;{unavailable} &nbsp;Unavailable</div>
            <button onClick={close} className='dismiss'><FontAwesome name='close' /></button>
          </div>
          <svg height="667px" width="375px" version="1.1" viewBox="0 0 375 667">
            <defs>
              <lineargradient id="linearGradient-1" x1="0%" x2="101.999998%" y1="0%" y2="100.999999%">
                <stop offset="0%" stopColor="#106DA9"/>
                <stop offset="100%" stopColor="#59A1DB"/>
              </lineargradient>
              <rect height="679" id="path-2" width="375" rx="6" x="0" y="-2.84217094e-14"/>
            </defs>
            <g id="App" fill="none" stroke="none" strokeWidth="1">
              <g id="7-select-seat">
                <g id="airplane-full_airplane" transform="translate(0.000000, -12.000000)">
                  <mask id="mask-3" fill="white">
                    <rect height="679" width="375" rx="6" x="0" y="-2.84217094e-14"/>
                  </mask>
                  <g id="Mask">
                    <rect height="679" width="375" rx="6" x="0" y="-2.84217094e-14"/>
                    <rect height="679" width="375" rx="6" x="0" y="-2.84217094e-14"/>
                  </g>
                </g>
                <image mask="url(#mask-3)" x="0" y="-28" width="374" height="723" xlinkHref="/flight-seats.png"></image>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '3570f625-891e-4c08-8619-bab034a9e7ab', name: '2B'})} id="3570f625-891e-4c08-8619-bab034a9e7ab" d="M145.939448,216 L131.060552,216 C128.541379,216 126.5,213.958621 126.5,211.439448 L126.5,196.560552 C126.5,194.042483 128.541379,192 131.060552,192 L145.939448,192 C148.458621,192 150.5,194.042483 150.5,196.560552 L150.5,211.439448 C150.5,213.958621 148.458621,216 145.939448,216" fill="#8DC1E3"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '72bf0b44-abaf-472f-9486-22af535d0cd7', name: '2D'})} id="72bf0b44-abaf-472f-9486-22af535d0cd7" d="M276.939448,216 L262.060552,216 C259.541379,216 257.5,213.958621 257.5,211.439448 L257.5,196.560552 C257.5,194.042483 259.541379,192 262.060552,192 L276.939448,192 C279.458621,192 281.5,194.042483 281.5,196.560552 L281.5,211.439448 C281.5,213.958621 279.458621,216 276.939448,216" fill="#8DC1E3"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: 'c2ced01e-5c16-4cf2-a68c-3fb034452e81', name: '3D'})} id="c2ced01e-5c16-4cf2-a68c-3fb034452e81" d="M276.939448,253.5 L262.060552,253.5 C259.541379,253.5 257.5,251.458621 257.5,248.939448 L257.5,234.060552 C257.5,231.542483 259.541379,229.5 262.060552,229.5 L276.939448,229.5 C279.458621,229.5 281.5,231.542483 281.5,234.060552 L281.5,248.939448 C281.5,251.458621 279.458621,253.5 276.939448,253.5" fill="#8DC1E3"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '646750b9-dea5-46f8-a77e-89f50d7b8352', name: '6A'})} id="646750b9-dea5-46f8-a77e-89f50d7b8352" d="M84.4394483,401 L69.5605517,401 C67.0413793,401 65,398.958621 65,396.439448 L65,381.560552 C65,379.042483 67.0413793,377 69.5605517,377 L84.4394483,377 C86.9575172,377 89,379.042483 89,381.560552 L89,396.439448 C89,398.958621 86.9575172,401 84.4394483,401" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '766e8b77-1401-42f5-89de-b58345f619c6', name: '6C'})} id="766e8b77-1401-42f5-89de-b58345f619c6" d="M160.439448,401 L145.560552,401 C143.041379,401 141,398.958621 141,396.439448 L141,381.560552 C141,379.042483 143.041379,377 145.560552,377 L160.439448,377 C162.957517,377 165,379.042483 165,381.560552 L165,396.439448 C165,398.958621 162.957517,401 160.439448,401" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: 'fcb69b5d-a2f3-4712-a14c-306ed8ffe36b', name: '7E'})} id="fcb69b5d-a2f3-4712-a14c-306ed8ffe36b" d="M253.439448,430 L238.560552,430 C236.041379,430 234,427.958621 234,425.439448 L234,410.560552 C234,408.042483 236.041379,406 238.560552,406 L253.439448,406 C255.957517,406 258,408.042483 258,410.560552 L258,425.439448 C258,427.958621 255.957517,430 253.439448,430" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '82437f35-5575-4887-9990-ebf7cd6b81b1', name: '7F'})} id="82437f35-5575-4887-9990-ebf7cd6b81b1" d="M291.439448,430 L276.560552,430 C274.041379,430 272,427.958621 272,425.439448 L272,410.560552 C272,408.042483 274.041379,406 276.560552,406 L291.439448,406 C293.957517,406 296,408.042483 296,410.560552 L296,425.439448 C296,427.958621 293.957517,430 291.439448,430" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: 'c5cbcc3a-b1bf-4b69-ba7b-7e5af3b424ab', name: '9B'})} id="c5cbcc3a-b1bf-4b69-ba7b-7e5af3b424ab" d="M122.439448,488 L107.560552,488 C105.041379,488 103,485.958621 103,483.439448 L103,468.560552 C103,466.042483 105.041379,464 107.560552,464 L122.439448,464 C124.957517,464 127,466.042483 127,468.560552 L127,483.439448 C127,485.958621 124.957517,488 122.439448,488" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '8b329303-156a-4a6e-9a84-768e3ac1cf21', name: '9C'})} id="8b329303-156a-4a6e-9a84-768e3ac1cf21" d="M160.439448,488 L145.560552,488 C143.041379,488 141,485.958621 141,483.439448 L141,468.560552 C141,466.042483 143.041379,464 145.560552,464 L160.439448,464 C162.957517,464 165,466.042483 165,468.560552 L165,483.439448 C165,485.958621 162.957517,488 160.439448,488" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: 'be5b6d83-113e-4023-b16e-1113b5dbef8a', name: '9E'})} id="be5b6d83-113e-4023-b16e-1113b5dbef8a" d="M253.439448,488 L238.560552,488 C236.041379,488 234,485.958621 234,483.439448 L234,468.560552 C234,466.042483 236.041379,464 238.560552,464 L253.439448,464 C255.957517,464 258,466.042483 258,468.560552 L258,483.439448 C258,485.958621 255.957517,488 253.439448,488" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '666bb2ec-635c-4f2b-ab6c-e7c6e79823fb', name: '10D'})} id="666bb2ec-635c-4f2b-ab6c-e7c6e79823fb" d="M214.439448,517 L199.560552,517 C197.041379,517 195,514.958621 195,512.439448 L195,497.560552 C195,495.042483 197.041379,493 199.560552,493 L214.439448,493 C216.957517,493 219,495.042483 219,497.560552 L219,512.439448 C219,514.958621 216.957517,517 214.439448,517" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '8a9f76a8-0f37-40d2-b9ef-0b8345b0b056', name: '10F'})} id="8a9f76a8-0f37-40d2-b9ef-0b8345b0b056" d="M291.439448,517 L276.560552,517 C274.041379,517 272,514.958621 272,512.439448 L272,497.560552 C272,495.042483 274.041379,493 276.560552,493 L291.439448,493 C293.957517,493 296,495.042483 296,497.560552 L296,512.439448 C296,514.958621 293.957517,517 291.439448,517" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '21e79396-c620-41a2-aec3-19927cb51032', name: '11E'})} id="21e79396-c620-41a2-aec3-19927cb51032" d="M253.439448,546 L238.560552,546 C236.041379,546 234,543.958621 234,541.439448 L234,526.560552 C234,524.042483 236.041379,522 238.560552,522 L253.439448,522 C255.957517,522 258,524.042483 258,526.560552 L258,541.439448 C258,543.958621 255.957517,546 253.439448,546" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: 'b7a0a110-796a-41a4-82ac-ff0b9827bbb1', name: '12E'})} id="b7a0a110-796a-41a4-82ac-ff0b9827bbb1" d="M253.439448,575 L238.560552,575 C236.041379,575 234,572.958621 234,570.439448 L234,555.560552 C234,553.042483 236.041379,551 238.560552,551 L253.439448,551 C255.957517,551 258,553.042483 258,555.560552 L258,570.439448 C258,572.958621 255.957517,575 253.439448,575" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '9f28d1b3-9557-4805-b26d-92461855db49', name: '11A'})} id="9f28d1b3-9557-4805-b26d-92461855db49" d="M83.4394483,546 L68.5605517,546 C66.0413793,546 64,543.958621 64,541.439448 L64,526.560552 C64,524.042483 66.0413793,522 68.5605517,522 L83.4394483,522 C85.9575172,522 88,524.042483 88,526.560552 L88,541.439448 C88,543.958621 85.9575172,546 83.4394483,546" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '9f28d1b3-9557-4805-b26d-92461855db49', name: '11A'})} id="9f28d1b3-9557-4805-b26d-92461855db49" d="M83.4394483,546 L68.5605517,546 C66.0413793,546 64,543.958621 64,541.439448 L64,526.560552 C64,524.042483 66.0413793,522 68.5605517,522 L83.4394483,522 C85.9575172,522 88,524.042483 88,526.560552 L88,541.439448 C88,543.958621 85.9575172,546 83.4394483,546" fill="#FEFEFE" stroke="#93A3A9"/>
                <path style={{cursor: 'pointer'}} onClick={this.selectSeat.bind(this, {id: '40a2e3b5-39c1-48a8-93e8-44c8e3c3959d', name: '11B'})} id="40a2e3b5-39c1-48a8-93e8-44c8e3c3959d" d="M122.439448,546 L107.560552,546 C105.041379,546 103,543.958621 103,541.439448 L103,526.560552 C103,524.042483 105.041379,522 107.560552,522 L122.439448,522 C124.957517,522 127,524.042483 127,526.560552 L127,541.439448 C127,543.958621 124.957517,546 122.439448,546" fill="#FEFEFE" stroke="#93A3A9"/>
              </g>
            </g>
          </svg>
          <div className='footer'>
            <button onClick={select}>選択された座席を予約する</button>
          </div>
        </div>
      </div>
    )
  }
}

class FlightSeats extends Component {
  showExpanded() {
    const div = document.createElement('div');
    div.id = 'CellExpanded';
    ReactDOM.render(<FullScreen {...this.props} close={this.closeExpanded.bind(this)} select={this.selectSeat.bind(this)}/>, div);
    document.body.appendChild(div);
  }
  closeExpanded() {
    document.getElementById('CellExpanded').remove();
  }
  selectSeat() {
    document.getElementById('CellExpanded').remove();
  }
  render() {
    const { content } = this.props;
    try {
      let data = JSON.parse(content);
      const seats = data.seats;
      return (
        <div className='flightSeats'>
          <div className='selectedSeat'>
            {seats.map((seat, i) => {
              return <span key={i}>{seat.name} が選択されています</span>;
            })}
          </div>
          <div className='selectSeatLabel'>
            <span onClick={this.showExpanded.bind(this)}>{seats.length == 0 ? '座席を選択する' : '座席を選びなおす'}</span>
          </div>
        </div>
      )
    } catch (e) {
      return (
        <div className='flightSeats'>
          <p>Could not parse carousel content</p>
        </div>
      )
    }
  }
}

registerComponent('dom-flight-seat-demo', {
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
      ReactDOM.render(<FlightSeats content={this.content} />, this);
    }
  }
});

const mimeType = 'application/x.card.flight.seat+json';
registerMessageHandler({
  tagName: 'dom-flight-seat-demo',
  label: 'Flight Seats',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});

const messagePartsForFlightSeat = (seats, params={}) => {
  if (!Array.isArray(seats)) {
    throw new Error('`seats` must be an array of card payloads');
  }

  const body = {
    title: params.title || '',
    subtitle: params.subtitle || '',
    selection_mode: params.selection_mode || 'none',
    seats: seats
  };
  return [new Layer.MessagePart({ mimeType: mimeType, body: JSON.stringify(body) })];
}
export { messagePartsForFlightSeat };
