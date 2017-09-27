import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Navbar, Nav, NavItem, OverlayTrigger, Popover } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import './Navigation.css';
import { isStaging } from './utils';

const changelog = process.env.NODE_ENV === 'production' ? require('../changelog.json') : {};
const changes = process.env.NODE_ENV === 'production' ? (
  <Popover id='changelog' title="What's new">
    <div className='Chaneglog'>
      {Object.keys(changelog).map(key => {
        const commits = changelog[key].reverse().map(({ date, message }) => <li>{message}</li>);
        return (
          <div>
            <h4>{key}</h4>
            <ol>
              {commits}
            </ol>
          </div>
        )
      })}
    </div>
  </Popover>
) : null;
const changelogNavItem = process.env.NODE_ENV === 'production' ? (
  <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={changes}>
    <NavItem>Changelog</NavItem>
  </OverlayTrigger>
) : null;

class Navigation extends Component {
  render() {
    // Why null?
    // https://github.com/react-bootstrap/react-router-bootstrap/blob/master/src/LinkContainer.js#L94
    const onConversation = window.location.href.match(/\/c\/.+/) ? true : null;
    const logo = this.props.logo || '/navlogo.svg';
    return (
      <Navbar fixedTop fluid>
        <Nav className='LogoNav'>
          <LinkContainer to='/'>
            <NavItem className='navLogo'><img src={logo} role='presentation' height='24' width='24' /></NavItem>
          </LinkContainer>
          {isStaging() ? <NavItem className='NavStaging'>Staging</NavItem> : null}
        </Nav>
        <Nav className='SectionNav'>
          <LinkContainer to='/' active={onConversation}>
            <NavItem active>Conversations</NavItem>
          </LinkContainer>
          <LinkContainer to='/leads/find'>
            <NavItem>Find lead</NavItem>
          </LinkContainer>
          <LinkContainer to='/team'>
            <NavItem>Team</NavItem>
          </LinkContainer>
          <LinkContainer to='/settings'>
            <NavItem>Settings</NavItem>
          </LinkContainer>
        </Nav>
        <Nav className='pull-right'>
          {changelogNavItem}

        </Nav>
      </Navbar>
    );
  }
}

const ConnectedNavigation = connect(
  state => ({
    logo: state.ui.logo
  })
)(Navigation);

export default ConnectedNavigation;
