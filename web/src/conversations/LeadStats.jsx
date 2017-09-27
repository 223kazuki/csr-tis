import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';
import Loading from './Loading';
import styled from 'styled-components';

class LabelledStatImpl extends Component {
  render() {
    const { value, label } = this.props;
    return (
      <div className={`cellItem ${this.props.classname}`}>
        <p className='statValue'>{value}</p>
        <p className='statLabel'>{label}</p>
      </div>
    )
  }
}
const LabelledStat = styled(LabelledStatImpl)`
  text-align: center;
  .statValue {
    font-weight: bold;
    margin-bottom: 0.25em;
  }
  .statLabel {
    font-size: 0.8em;
    line-height: 1.2em;
    margin-bottom: 0;
  }
`;

class LeadStats extends Component {
  render() {
    const { stats } = this.props;
    if (typeof stats === 'undefined')
      return <Panel><Loading subject='stats' /></Panel>
    else if (stats instanceof Error)
      return <Panel><p>Error loading stats</p></Panel>;
    else {
      const startDate = new Date(stats.createdAt);
      const startDateString = `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`;
      return (
        <Panel>
          <div className='cellRow'>
            <LabelledStat value={startDateString} label='Chat started' />
            <LabelledStat value={stats.ratio.toFixed(3)} label='Sent/recd ratio*' />
            <LabelledStat value={stats.leadResponseTime.toFixed(0) + ' min'} label='Lead resp time*' />
            <LabelledStat value={stats.agentResponseTime.toFixed(0) + ' min'} label='Agent resp time*' />
          </div>
        </Panel>
      );
    }
  }
}

export default LeadStats;
