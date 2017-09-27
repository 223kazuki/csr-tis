import React, { Component } from 'react';
import { Panel, Row, Col } from 'react-bootstrap';
import Loading from './Loading';
import { RIETextArea } from 'riek';
import LabelledField from './LabelledField';
import leadEnumFields from './LeadEnumFields';
import './Editable.css';

class ProjectDetails extends Component {
  render() {
    const { profile, onFieldChange } = this.props;
    if (typeof profile === 'undefined')
      return <Panel><Loading subject='project details' /></Panel>;
    else if (profile instanceof Error)
      return <Panel><Row><Col xs={12}><p>Error loading profile</p></Col></Row></Panel>;

    const timelineEnum = leadEnumFields.project_timeline;
    const timelineOptions = Object.keys(timelineEnum).map(key => (
      { id: `${timelineEnum[key]}`, text: key }));
    return (
      <Panel>
        <Row>
          <Col xs={12}>
            <LabelledField label='Project timeline' detail={profile.project_timeline} placeholder='Unknown' selectOptions={timelineOptions} onChange={onFieldChange('project_timeline')} />
            <LabelledField label='Project details' detail={profile.project_details} placeholder='Unknown' nodeType={RIETextArea} valueClassName='blockField' onChange={onFieldChange('project_details')} />
          </Col>
        </Row>
      </Panel>
    )
  }
}

export default ProjectDetails;
