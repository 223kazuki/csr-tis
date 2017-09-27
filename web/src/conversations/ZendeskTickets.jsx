import React, { Component } from 'react'
import { Panel } from 'react-bootstrap'
import Loading from './Loading'
import ErrorBanner from './ErrorBanner'
import { ZENDESK_HOST } from '../constants'
import styled from 'styled-components'
import { I18n } from 'react-redux-i18n'

class ZendeskTicketImpl extends Component {
  render () {
    const { ticket } = this.props
    return (
      <div className={`ZendeskTicket ${this.props.className}`}>
        <p><strong>{I18n.t('zendeskTickets.id')}</strong> {ticket.id}</p>
        <p><strong>{I18n.t('zendeskTickets.subject')}</strong> {ticket.subject}</p>
        <p><strong>{I18n.t('zendeskTickets.description')}</strong> {ticket.description.substring(0, 100)}…</p>
        <a className='ZendeskLink' href={`https://${ZENDESK_HOST}/agent/tickets/${ticket.id}`} target='_blank'>
          <button className='primary'>{I18n.t('zendeskTickets.buttonText')}</button>
        </a>
      </div>
    )
  }
}
const ZendeskTicket = styled(ZendeskTicketImpl)`
  border: 1px solid #E4E9EC;
  border-radius: 0.4em;
  margin: 1em;
  padding: 1em;
  p {
    color: #777;
    margin: 0;
    strong {
      color: black;
    }
  }
  .ZendeskLink {
    display: inline-block;
    margin-top: 1em;
    width: 100%;
  }
`;

class ZendeskTickets extends Component {
  render () {
    const { tickets } = this.props
    if (!tickets)
      return <Panel><Loading subject={I18n.t('ZendeskTickets.loadingTickets')} /></Panel>
    else if (tickets instanceof Error) {
      return <Panel><ErrorBanner error={tickets} /></Panel>
    }
    else
      return <Panel><div>{tickets.map(t => <ZendeskTicket ticket={t} key={t.id} />)}</div></Panel>
  }
}

export default ZendeskTickets;
