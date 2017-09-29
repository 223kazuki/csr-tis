import React, { Component } from 'react'
import { connect } from 'react-redux'
import { NavItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import FontAwesome from 'react-fontawesome'
import ConversationsFilters from './ConversationsFilters'
import CreateConversation from './CreateConversation'
import Messages from './Messages'
import LeadProfile from './LeadProfile'
import styled from 'styled-components'
import { I18n, setLocale } from 'react-redux-i18n'

class NavLogoImpl extends Component {
  render () {
    const { logo, companyName, className } = this.props
    return (
      <LinkContainer to='/' className={className}>
        <NavItem className='navLogo'>
          <img src={logo} role='presentation' width='30' height='30' />
          <span className='companyName'>{companyName}</span>
        </NavItem>
      </LinkContainer>
    )
  }
}
const NavLogo = styled(NavLogoImpl)`
  position: relative;
  img {
    background: white;
    border-radius: 0.2rem;
    box-shadow: 0 1px 3px 2px #313F48;
    padding: 0.2rem;
  }
  .companyName {
    color: white;
    display: inline-block;
    font-size: 1.4rem;
    font-weight: bold;
    margin-left: 0.4rem;
    position: relative;
    top: -0.4rem;
  }
`

class ToggleLanguageButtonImpl extends Component {
  render () {
    const { toggleLanguage, locale, translations } = this.props
    const toggleButtons = Object.keys(translations).map((k) => {
      return <button className={locale === k ? 'active' : ''} key={k} onClick={() => toggleLanguage(translations, k)}>{k}</button>
    })
    return (
      <li className={this.props.className}>
        <div className='btn-group' data-toggle="buttons">
          {toggleButtons}
        </div>
      </li>
    )
  }
}
const ToggleLanguageButton = connect(
  state => state.i18n,
  (dispatch) => ({
    toggleLanguage: (translations, locale) => {
      document.title = translations[locale].title
      dispatch(setLocale(locale))
    }
  })
)(styled(ToggleLanguageButtonImpl)`
  position: relative;
  margin-left: 1.5rem;
  top: -0.5rem;
  .btn-group{
    display:inline-block;
  }
  .btn-group button {
    width: 2.3rem;
    padding: 0.2rem 0.5rem;
    border: solid;
    background-color: rgba(0,0,0,0);
    color: #fff;
    cursor: pointer;
  }
  .btn-group button:first-child {
    border-radius: 0.3rem 0 0 0.3rem;
    border-right: none;
  }
  .btn-group button:last-child {
    border-radius: 0 0.3rem 0.3rem 0;
  }
  .btn-group button.active {
    background-color: #19A5E4;
  }
`)

class NavHeaderImpl extends Component {
  render () {
    const { logo, companyName, className } = this.props
    return (
      <header className={`NavHeader ${className}`}>
        <NavLogo logo={logo} companyName={companyName} />
        <ToggleLanguageButton />
        <LinkContainer to='/team'>
          <NavItem className='pull-right team'><FontAwesome name='address-book' /></NavItem>
        </LinkContainer>
      </header>
    )
  }
}
const NavHeader = styled(NavHeaderImpl)`
  padding: 0.8rem 1rem 0.4rem 1rem;
  li {
    display: inline-block;
  }
  .team {
    font-size: 1.4rem;
    a {
      color: white;
      transition: color 0.25s;
      &:hover {
        color: #C3CDD4;
      }
    }
  }
`

class NewConversationActionsImpl extends Component {
  render () {
    return (
      <div className={`NewConversationActions ${this.props.className}`}>
        <LinkContainer to='/leads/find' className='FindLeadLink'>
          <NavItem><FontAwesome name='search' />{I18n.t('conversations.findLeadButtonText')}</NavItem>
        </LinkContainer>
        <CreateConversation />
      </div>
    )
  }
}
const NewConversationActions = styled(NewConversationActionsImpl)`
  padding: 1rem;
  .FindLeadLink {
    border: 1px solid #ADB9C1;
    border-radius: 3px;
    box-sizing: border-box;
    display: inline-block;
    margin: 1rem 0 1.6rem 0;
    padding: 0.25em 0.5em;
    text-align: center;
    width: 100%;
    a {
      color: #ADB9C1;
    }
  }
`

class QuickLinksImpl extends Component {
  render () {
    return (
      <ul className={`QuickLinks ${this.props.className}`}>
        <LinkContainer to='/settings'>
          <NavItem><FontAwesome name='cog' /> {I18n.t('conversations.settingsText')}</NavItem>
        </LinkContainer>
        <LinkContainer to='/logout'>
          <NavItem><FontAwesome name='unlink' /> {I18n.t('conversations.logoutText')}</NavItem>
        </LinkContainer>
      </ul>
    )
  }
}
const QuickLinks = styled(QuickLinksImpl)`
  margin: 1rem 0;
  padding: 1rem 1rem 0 1rem;
  text-align: center;
  li {
    display: inline-block;
    padding: 0 1rem;
  }
  a {
    color: white;
    transition: color 0.25s;
    &:hover {
      color: #C3CDD4;
    }
  }
`

const ConversationListImpl = connect(
  state => Object.assign({},
                          state.i18n,
                          { logo: state.ui.logo },
                          { companyName: state.ui.companyName })
)(class extends Component {
  render () {
    const { logo, companyName, className } = this.props
    return (
      <div className={`full-height-panel ConversationsList ${className}`}>
        <NavHeader logo={logo} companyName={companyName} />
        <div className='content'>
          <ConversationsFilters />
          <NewConversationActions />
        </div>
        <QuickLinks />
      </div>
    )
  }
})
const ConversationList = styled(ConversationListImpl)`
  background: #404F5A;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  .content {
    flex: 1;
  }
`

class ConversationsImpl extends Component {
  render () {
    return (
      <div>
        <div className={`full-height-panel Conversations ${this.props.className}`}>
          <ConversationList />
          <Messages />
          <LeadProfile />
        </div>
      </div>
    )
  }
}
const Conversations = styled(ConversationsImpl)`
  display: flex;
  .ConversationsList {
    flex-shrink: 0;
    max-height: 100%;
    width: 280px;
  }
  .Messages {
    flex: 1;
  }
  .LeadProfile {
    box-sizing: border-box;
    display: inline-block;
    flex-shrink: 0;
    max-height: 100%;
    overflow-y: hidden;
    width: 420px;
  }
`

export default Conversations
