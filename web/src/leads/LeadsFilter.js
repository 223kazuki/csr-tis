import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Panel, Radio, FormGroup } from 'react-bootstrap';
import LeadEnum from './LeadEnumFields';
import { selectFilter, getLeads } from './actions';

const provideActions = dispatch => {
  return {
    onSelectFilter: (event) => {
      var filter = {};
      filter[event.currentTarget.name] = event.currentTarget.value;
      dispatch(selectFilter(filter));
      dispatch(getLeads(filter));
    }
  }
};

class LeadsFilter extends Component {
  render() {
    const filterSelect = this.props.onSelectFilter;
    return (
      <form>
        <Panel header="Leads" eventKey='leads'>
          <FormGroup>
            <fieldset>
              <Radio name='leads' value={0} onChange={filterSelect} defaultChecked >My Leads</Radio>
              <Radio name='leads' value={1} onChange={filterSelect}>All Leads</Radio>
              <Radio name='leads' value={2} onChange={filterSelect}>Unassigned</Radio>
            </fieldset>
          </FormGroup>
        </Panel>
        <Panel header="Conversation" eventKey='conversation'>
          <FormGroup>
            <Radio name='conversation' value={0} onChange={filterSelect} defaultChecked >Unanswered</Radio>
            <Radio name='conversation' value={1} onChange={filterSelect}>Awaiting Response</Radio>
            <Radio name='conversation' value={2} onChange={filterSelect}>All</Radio>
          </FormGroup>
        </Panel>
        <Panel header="Status" eventKey='status'>
          <FormGroup>
            <Radio name='status' value={LeadEnum.status.New} onChange={filterSelect} defaultChecked >New</Radio>
            <Radio name='status' value={LeadEnum.status.Open} onChange={filterSelect}>Open</Radio>
            <Radio name='status' value={LeadEnum.status.Contacted} onChange={filterSelect}>Contacted</Radio>
            <Radio name='status' value={LeadEnum.status.Working} onChange={filterSelect}>Working</Radio>
            <Radio name='status' value={LeadEnum.status.Qualified} onChange={filterSelect}>Qualified</Radio>
            <Radio name='status' value={LeadEnum.status.Unqualified} onChange={filterSelect}>Unqualified</Radio>
          </FormGroup>
        </Panel>
        <Panel header="Segment" eventKey='segment'>
          <FormGroup>
            <Radio name='segment' value={LeadEnum.segment.Enterprise} onChange={filterSelect} defaultChecked >Enterprise</Radio>
            <Radio name='segment' value={LeadEnum.segment.SMB} onChange={filterSelect}>SMB</Radio>
            <Radio name='segment' value={LeadEnum.segment.Longtail} onChange={filterSelect}>None</Radio>
          </FormGroup>
        </Panel>
      </form>
    );
  }
}

export default connect(state => state.leads, provideActions)(LeadsFilter);
