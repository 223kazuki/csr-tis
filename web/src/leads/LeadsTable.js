import React, { Component } from 'react';
import { Table } from 'react-bootstrap';
import LeadsList from './LeadsList';

class LeadsTable extends Component {
  render() {
    return (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Status</th>
            <th>Last Message</th>
            <th>Owner</th>
          </tr>
        </thead>
        <LeadsList />
      </Table>
    );
  }
}

export default LeadsTable;
