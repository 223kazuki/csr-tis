import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Navigation from '../Navigation';
import LeadsFilter from './LeadsFilter';
import LeadsTable from './LeadsTable';

class Leads extends Component {
  render() {
    return (
      <div>
        <Navigation />
        <Grid fluid>
          <Row>
            <Col xs={12} md={2}>
              <LeadsFilter />
            </Col>
            <Col xs={12} md={10}>
              <LeadsTable />
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default Leads;
