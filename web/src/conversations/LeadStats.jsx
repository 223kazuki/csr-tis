import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';
import Loading from './Loading';
import styled from 'styled-components';
import { I18n } from 'react-redux-i18n';

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
            <LabelledStat value={startDateString} label={I18n.t('leadStats.chatStarted')} />
            <LabelledStat value={stats.ratio.toFixed(3)} label={I18n.t('leadStats.sentRecdRatio')} />
            <LabelledStat value={I18n.t('leadStats.chatStarted', {minute: stats.leadResponseTime.toFixed(0)})} label={I18n.t('leadStats.leadRespTime')} />
            <LabelledStat value={I18n.t('leadStats.chatStarted', {minute: stats.agentResponseTime.toFixed(0)})} label={I18n.t('leadStats.agentRespTime')} />
          </div>
        </Panel>
      );
    }
  }
}

export default LeadStats;
