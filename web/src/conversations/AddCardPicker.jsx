import React, { Component } from 'react'
import FontAwesome from 'react-fontawesome'
import _ from 'lodash'
import styled from 'styled-components'
import { I18n } from 'react-redux-i18n'

class AddCardTypeImpl extends Component {
  render () {
    const { icon, title, onClick } = this.props
    return (
      <button type='button' className={`AddCardType ${this.props.className}`} onClick={onClick}>
        <div className='cardTypeIcon'><FontAwesome name={icon} size='2x' /></div>
        <p className='title'>{title}</p>
      </button>
    )
  }
}
const AddCardType = styled(AddCardTypeImpl)`
  background: none;
  border: none;
  .fa {
    opacity: 0.5;
  }
  .title {
    color: #666;
    font-size: 0.6rem;
    margin-bottom: 0;
  }
`

class AddCardContainerImpl extends Component {
  render () {
    const { key, icon, title, onSelectCard } = this.props
    return (
      <div className={`AddCardContainer cellItem ${this.props.className}`} key={key}>
        <AddCardType icon={icon} title={title} onClick={onSelectCard.bind(null, title)} />
      </div>
    )
  }
}
const AddCardContainer = styled(AddCardContainerImpl)`
  border-right: 1px solid #DDD;
  padding: 0.4rem;
  text-align: center;
  transition: background 0.25s;
  &:last-child {
    border-right: none;
  }
  &:hover {
    background: #EEE;
  }
`

class AddCardPicker extends Component {
  render() {
    const { options, onSelectCard } = this.props
    const cardsPerRow = 3
    const colSize = 12 / cardsPerRow  // Bootstrap's 12-column grid
    var cards = _.chunk(options, cardsPerRow)
    if (options.length % cardsPerRow !== 0) {
      // Need to pad last chunk
      const padder = { title: '', icon: '' }
      const numberToPad = cardsPerRow * cards.length - options.length
      for (var i = 0; i < numberToPad; i++)
        (cards[cards.length - 1]).push(padder)
    }
    console.log('cards', cards)
    const rows = cards.map((row, idx) => (
      <div className='cellRow' key={idx}>
        {row.map(({ title, icon }, idx) => <AddCardContainer key={idx} icon={icon} title={I18n.t('cardTypes.' + title)} onSelectCard={onSelectCard} />)}
      </div>
    ))
    return (
      <div>{rows}</div>
    )
  }
}

export default AddCardPicker
