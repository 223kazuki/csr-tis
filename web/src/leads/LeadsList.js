import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import LeadEnum from './LeadEnumFields';
import { selectConversation } from '../conversations/actions';
import _ from 'lodash';



class LeadsList extends Component {
  render() {
    const leads = this.props.leads;
    var rows = [];
    if (typeof leads === 'undefined')
      rows = <tr><td colSpan="6"><p>Loading leads...</p></td></tr>;
    else if (!leads)
      rows = <tr><td colSpan="6"><p>Error loading leads</p></td></tr>;
    else if (leads.length < 1)
      rows = <tr><td colSpan="6"><p>No leads</p></td></tr>;
    else
      rows = leads.map((lead, idx) => {
        return (
          <tr key={idx}>
            <td><a href="#" onClick={_ => this.props.onClickLead(lead.conversation_id)}>{lead.first_name + ' ' + lead.last_name}</a></td>
            <td>{lead.email}</td>
            <td>{lead.company}</td>
            <td>{_.invert(LeadEnum.status)[lead.status]}</td>
            <td>{new Date(lead.last_message.sent_at).toDateString()}</td>
            <td>{lead.owner}</td>
          </tr>
        );
      });

    return (
      <tbody>
        {rows}
      </tbody>
    );
  }
}


export default connect(
  state => ({ leads: state.leads.leads }),
  dispatch => ({
    onClickLead: conversationID => {
      browserHistory.push('/');
      dispatch(selectConversation(conversationID));
    }
  })
)(LeadsList);
