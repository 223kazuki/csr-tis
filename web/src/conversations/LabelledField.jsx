import React, { Component } from 'react';
import { RIEInput, RIESelect } from 'riek';
import _ from 'lodash';
import './Editable.css';

const editableInput = (nodeType, value, placeholder, onChange, selectOptions) => React.createElement(nodeType, {
    editProps: { placeholder },
    value: value || placeholder || '',
    options: selectOptions,
    propName: 'value',
    change: onChange,
    className: value ? 'editable' : 'editable empty'
  }, null);

class LabelledField extends Component {
  render() {
    const { label, detail, placeholder, onChange, selectOptions } = this.props;
    const valueClassName = `profileValue ${this.props.valueClassName || ''}`;
    const nodeType = this.props.nodeType || (selectOptions ? RIESelect : RIEInput);
    const inputValue = selectOptions ? _.find(selectOptions, opt => opt.id === `${detail}`) : detail;
    const placeholderContent = nodeType === RIESelect ? { text: placeholder } : placeholder;
    const value = onChange ? editableInput(nodeType, inputValue, placeholderContent, onChange, selectOptions) : <span>{detail || placeholderContent}</span>;
    return (
      <p className='profileField'>
        <label>{label}:</label>
        <span className={valueClassName}>{value}</span>
      </p>
    );
  }
}

export default LabelledField;