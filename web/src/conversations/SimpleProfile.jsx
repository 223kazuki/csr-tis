import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';
import Loading from './Loading';
import LabelledField from './LabelledField';
import ErrorBanner from './ErrorBanner';
import { snakeCaseToTitle } from '../utils';
import { I18n } from 'react-redux-i18n'

class SimpleProfile extends Component {
  render() {
    const { profile, onFieldChange } = this.props;
    if (typeof profile === 'undefined')
      return <Panel><Loading subject={I18n.t('simpleProfile.userProfileSubject')} /></Panel>;
    else if (profile instanceof Error)
      return <Panel><ErrorBanner error={profile} /></Panel>;

    const fields = Object.keys(profile).map((key, idx) => {
      const label = snakeCaseToTitle(key);
      const value = profile[key];
      return <LabelledField label={label} detail={value} key={idx} onChange={onFieldChange(key)} />;
    });
    return (
      <Panel className='SimpleProfile'>
        {fields}
      </Panel>
    )
  }
}

export default SimpleProfile;
