import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import styled from 'styled-components';

class DisplayTab extends Component {
  render() {
    const { name, icon, selected } = this.props;
    let classes = 'inline Tab';
    if (selected)
      classes += ' selected';
    let displayIcon = null;
    const iconExtensionIndex = icon.indexOf('.');
    if (iconExtensionIndex >= 0) {
      let iconPath = icon;
      if (selected)
        iconPath = icon.slice(0, iconExtensionIndex) + '-selected' + icon.slice(iconExtensionIndex);
      displayIcon = <img src={iconPath} height='10' width='auto' title={name} alt={`${name} icon`} />;
    }
    else
      displayIcon = <FontAwesome name={icon} />
    return (
      <button className={classes} onClick={this.props.onSelect}>
        <div>{displayIcon}</div>
        <p>{name}</p>
      </button>
    );
  }
}

// Container for `name` and `icon` props + `children`
class Tab extends Component {}

class TabControllerImpl extends Component {
  render() {
    const tabDefinitions = this.props.children;
    const selectedTab = this.props.selectedTab || 0;
    const onTabChange = this.props.onTabChange;
    const tabs = tabDefinitions.map((tabdef, idx) => {
      const { name, icon } = tabdef.props;
      const selected = selectedTab === idx;
      return <DisplayTab selected={selected} name={name} icon={icon} key={idx} onSelect={_ => onTabChange(idx)} />
    });
    const views = tabDefinitions.map(tabdef => tabdef.props.children);
    return (
      <div className={`TabController ${this.props.className}`}>
        <div className='TabBar'>{tabs}</div>
        <div className='TabContent'>{views[selectedTab]}</div>
      </div>
    );
  }
}
const TabController = styled(TabControllerImpl)`
  .TabBar {
    display: flex;
    .Tab {
      color: #AAA;
      flex: 1;
      font-size: 1rem;
      margin: 0;
      padding: 7px 0;
      p {
        font-size: 0.8rem;
        margin: 2px 0 0 0;
      }
      &.selected {
        color: #19a5e4;
      }
    }
  }
`;

export default TabController;
export { Tab };
