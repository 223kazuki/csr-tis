import React, { Component } from 'react'
import { Panel, Row, Col } from 'react-bootstrap'
import Loading from './Loading'
import LabelledField from './LabelledField'
import leadEnumFields from './LeadEnumFields'
import SpinnerButton from '../SpinnerButton'
import { I18n } from 'react-redux-i18n'

class LeadSalesforce extends Component {
  render() {
    const { profile, onFieldChange, createLead } = this.props
    if (typeof profile === 'undefined')
      return <Panel><Loading subject={I18n.t('leadSalesforce.subject')} /></Panel>
    else if (profile instanceof Error)
      return <Panel><Row><Col xs={12}><p>{I18n.t('leadSalesforce.error')}</p></Col></Row></Panel>
    const displayName = profile.name || I18n.t('name.text', {firstName: profile.first_name, lastName: profile.last_name})

    const selectOptions = Object.keys(leadEnumFields).reduce((options, key) => {
      const fieldDef = leadEnumFields[key]
      const fieldOptions = Object.keys(fieldDef).map(optName => ({ id: `${fieldDef[optName]}`, text: optName }))
      return Object.assign({}, options, { [key]: fieldOptions })
    }, {})

    const leadActionButton = !profile.salesforce_id ? <SpinnerButton title={I18n.t('leadSalesforce.createSalesforceLead')} action={createLead} /> : null

    // TODO: tabIndex doesn't do anything yet
    const startingTabIndex = 1

    const unknown = I18n.t('unknown.text')

    return (
      <Panel>
        <LabelledField label={I18n.t('leadSalesforce.name')} detail={displayName} onChange={onFieldChange('name')} />
        <LabelledField label={I18n.t('leadSalesforce.email')} detail={profile.email} onChange={onFieldChange('email')} />
        <LabelledField label={I18n.t('leadSalesforce.phone')} detail={profile.phone} placeholder={unknown} onChange={onFieldChange('phone')} tabIndex={startingTabIndex + 0} />
        <LabelledField label={I18n.t('leadSalesforce.leadOwner')} detail={profile.lead_owner} placeholder={unknown} />
        <LabelledField label={I18n.t('leadSalesforce.leadStatus')} detail={profile.status} placeholder={unknown} selectOptions={selectOptions['status']} onChange={onFieldChange('status')} tabIndex={startingTabIndex + 7} />
        <LabelledField label={I18n.t('leadSalesforce.leadSource')} detail={profile.source} placeholder={unknown} selectOptions={selectOptions['source']} onChange={onFieldChange('source')} tabIndex={startingTabIndex + 8} />
        <LabelledField label={I18n.t('leadSalesforce.company')} detail={profile.company} placeholder={unknown} onChange={onFieldChange('company')} tabIndex={startingTabIndex + 1} />
        <LabelledField label={I18n.t('leadSalesforce.segment')} detail={profile.segment} placeholder={unknown} selectOptions={selectOptions['segment']} onChange={onFieldChange('segment')} tabIndex={startingTabIndex + 2} />
        <LabelledField label={I18n.t('leadSalesforce.industry')} detail={profile.industry} placeholder={unknown} selectOptions={selectOptions['industry']} onChange={onFieldChange('industry')} tabIndex={startingTabIndex + 3} />
        <LabelledField label={I18n.t('leadSalesforce.employees')} detail={profile.employees} placeholder={unknown} onChange={onFieldChange('employees')} tabIndex={startingTabIndex + 4} />
        <LabelledField label={I18n.t('leadSalesforce.department')} detail={profile.department} placeholder={unknown} selectOptions={selectOptions['department']} onChange={onFieldChange('department')} tabIndex={startingTabIndex + 5} />
        <LabelledField label={I18n.t('leadSalesforce.role')} detail={profile.role} placeholder={unknown} selectOptions={selectOptions['role']} onChange={onFieldChange('role')} tabIndex={startingTabIndex + 6} />
        <LabelledField label={I18n.t('leadSalesforce.address')} detail={profile.address} placeholder={unknown} onChange={onFieldChange('address')} tabIndex={startingTabIndex + 9} />
        <LabelledField label={I18n.t('leadSalesforce.city')} detail={profile.city} placeholder={unknown} onChange={onFieldChange('city')} tabIndex={startingTabIndex + 10} />
        <LabelledField label={I18n.t('leadSalesforce.state')} detail={profile.state} placeholder={unknown} onChange={onFieldChange('state')} tabIndex={startingTabIndex + 11} />
        <LabelledField label={I18n.t('leadSalesforce.zip')} detail={profile.zip} placeholder={unknown} onChange={onFieldChange('zip')} tabIndex={startingTabIndex + 12} />
        <p className='salesforceLink'>
          <a href={`https://na11.salesforce.com/${profile.salesforce_id}`}>{I18n.t('leadSalesforce.linkToSalesforce')}</a>
          <span className='createSalesforceLink'>
            {leadActionButton}
          </span>
        </p>
      </Panel>
    )
  }
}

export default LeadSalesforce;
