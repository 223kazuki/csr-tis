import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { updateSearchQuery, searchSalesforceLeads, startConversation } from './actions';
import './FindLead.css';
import { currentUser } from '../login/auth';

class FindLead extends Component {
  render() {
    const { searchQuery,
            updateSearchQuery,
            searchLoading,
            searchResults,
            search,
            startConversation,
            startingConversationWith } = this.props;

    const spinner = <FontAwesome name='spinner' spin />;

    var startingConversationError = null;
    if (startingConversationWith instanceof Error) {
      startingConversationError = (
        <Alert bsStyle='danger'>
          <strong>Error starting conversation:</strong> {startingConversationWith.message}
        </Alert>
      )
    }
    var resultRows;
    if (typeof searchResults === 'undefined')
      resultRows = null;
    else if (searchResults instanceof Error)
      resultRows = <p>{searchResults.toString()}</p>;
    else if (searchResults.length < 1)
      resultRows = <p>No results found</p>;
    else
      resultRows = searchResults.map(result => {
        var actionButton = null;
        if (!result.Email)
          return null;
        const layerEmailIndex = result.Email.indexOf('layer.com');
        if (layerEmailIndex >= 0)
          actionButton = (
            <button
              className='primary resultAction'
              disabled
              title={`Get up and talk to ${result.Email.slice(0, layerEmailIndex - 1)} in person!`}>
              Works at Layer</button>
          );
        else if (!result.lead_id || !result.conversation_id)
          actionButton = (
            <button
              className='primary resultAction'
              onClick={_ => startConversation(result)}
              disabled={result.Id === startingConversationWith}>
              {result.Id === startingConversationWith ? spinner : 'Start conversation'}
            </button>
          );
        else if (result.conversation_owner === currentUser().id)
          actionButton = (
            <button
              className='primary resultAction'
              onClick={_ => startConversation(result)}
              disabled={result.Id === startingConversationWith}>
              Go to conversation
            </button>
          )
        else
          actionButton = (
            <button className='primary resultAction' disabled title='Someone else is already talking to this lead'>Claimed</button>
          );
        return (
          <div className='searchResult' key={result.Id}>
            <p>
              <small className='resultName'>{result.Name}</small>
              <small className='resultEmail'>{result.Email}</small>
            </p>
            <a href={`https://na11.salesforce.com/${result.Id}`} className='resultSFLink' target='_blank'>
              View in Salesforce
            </a>
            {actionButton}
          </div>
        )
      });

    return (
      <div className='FindLeadContainer'>
        <a href='/'><FontAwesome name='long-arrow-left' /> Back to conversations</a>
        <div className='FindLead'>
          <div className='searchbar'>
            <input
              type='search'
              disabled={searchLoading}
              placeholder='Find a SalesForce lead by name or email'
              value={searchQuery}
              onKeyDown={e => e.keyCode === 13 ? search(searchQuery) : undefined}
              onChange={e => updateSearchQuery(e.target.value)} />
            <button className='primary' onClick={_ => search(searchQuery)}>
              {searchLoading ? spinner : 'Search'}
            </button>
          </div>
          <div className='searchResults'>
            {startingConversationError}
            {resultRows}
          </div>
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({
    searchQuery: state.leads.ui.searchQuery,
    searchLoading: state.leads.ui.searchLoading,
    searchResults: state.leads.searchResults,
    startingConversationWith: state.leads.ui.startingConversationWith
  }),
  dispatch => ({
    updateSearchQuery: query => dispatch(updateSearchQuery(query)),
    search: query => dispatch(searchSalesforceLeads(query)),
    startConversation: searchResult => dispatch(startConversation(searchResult))
  })
)(FindLead);