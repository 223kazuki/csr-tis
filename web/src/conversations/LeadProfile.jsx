import React, { Component } from 'react';
import { connect } from 'react-redux';
import { editProfile, selectTab, editLeads, createSalesforceLead } from './actions';
import TabController, { Tab } from './TabController';
import Stats from './LeadStats';
import SimpleProfile from './SimpleProfile';
import Salesforce from './LeadSalesforce';
import ProjectDetails from './LeadProjectDetails';
import ZendeskTickets from './ZendeskTickets';
import styled from 'styled-components';

class LeadProfileImpl extends Component {
  render() {
    const { isDemo, stats, profile, selectedTab, zendeskTickets,
      onFieldChange, selectedConversationID, createLead, onTabChange } = this.props;
    const profileTickets = profile && profile.id ? zendeskTickets[profile.id] : undefined;
    if (!selectedConversationID) {
      return <div></div>;
    }
    const profileTabName = isDemo ? 'Profile' : 'Salesforce';
    const profileView = isDemo ? <SimpleProfile profile={profile} onFieldChange={onFieldChange} /> : <Salesforce profile={profile} onFieldChange={onFieldChange} createLead={createLead} />;
    return (
      <div className={`full-height-panel LeadProfile ${this.props.className}`}>
        <TabController selectedTab={selectedTab} onTabChange={onTabChange}>
          <Tab name='Stats' icon='commenting'>
            <Stats stats={stats} />
            <ProjectDetails profile={profile} onFieldChange={onFieldChange} />
          </Tab>
          <Tab name={profileTabName} icon='user'>
            {profileView}
          </Tab>
          <Tab name='Zendesk' icon='/zendesk.svg'>
            <ZendeskTickets tickets={profileTickets} />
          </Tab>
        </TabController>
      </div>
    );
  }
}
const LeadProfile = styled(LeadProfileImpl)`
  .panel {
    background: transparent;
    border: none;
    padding-bottom: 1em;
    &:first-child {
      padding-top: 0;
    }
  }
  .panel-body {
    padding: 0;
  }

  .TabController {
    height: 100%;
    max-height: 100%;
  }

  .TabContent {
    height: 100%;
    max-height: 100%;
    overflow-y: scroll;
    padding: 0 1.5rem;
    .panel {
      padding-bottom: 4.4rem;
    }
  }

  .TabBar {
    border-bottom: 1px solid #E4E9EC;
  }
  
  .createSalesforceLink {
    float: right;
  }
`;

export default connect(
  state => ({
    isDemo: state.ui.isDemo,
    selectedConversationID: state.conversations.selectedConversation,
    profile: state.conversations.selectedProfile,
    selectedTab: state.conversations.ui.profileSelectedTab,
    stats: state.conversations.selectedConversationStats,
    zendeskTickets: state.conversations.zendeskTickets }),
  dispatch => ({
    onFieldChange: fieldName => {
      return ({ value }) => {
        if (typeof value === 'object')
          value = value.id;
        dispatch(editProfile({ fieldName, value }));
      }
    },
    createLead: cb => {
      dispatch(createSalesforceLead(cb));
    },
    onTabChange: idx => {
      dispatch(selectTab(idx));
    }
  })
)(LeadProfile);
