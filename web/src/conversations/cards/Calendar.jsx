import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import LayerUI, { registerComponent, registerMessageHandler } from 'layer-ui-web';
const MessageHandlerMixin = LayerUI.mixins.MessageHandler;
import { WebSDK } from '../../Layer';
import FontAwesome from 'react-fontawesome';
import { get, post } from '../../api';
import { currentUser, isUserMode } from '../../login/auth';
import './Card.css';
import './Calendar.css';
import moment from 'moment';
import classNames from 'classnames';
import * as Layer from 'layer-websdk';
import { stripPrefix } from '../../utils';
const contentType = require("content-type");
import { I18n } from 'react-redux-i18n';

class CalendarLoading extends Component {
  render() {
    return (
      <div className='CalendarLoading'>
        <p><FontAwesome name='spinner' spin /> {this.props.message}</p>
      </div>
    )
  }
}

const testBeginningOverlap = (timespanBase, timespanTarget) => {
  /************************************************************
  *
  *                      ====================
  *                      |                  |
  *   <------- Target ------->      Base    |
  *                      |                  |
  *                      ====================
  *
  *************************************************************/
  return timespanTarget.start_time < timespanBase.start_time &&
          timespanTarget.end_time >= timespanBase.start_time &&
          timespanTarget.end_time <= timespanBase.end_time;
};

const testEndingOverlap = (timespanBase, timespanTarget) => {
  /************************************************************
  *
  *    ====================
  *    |                  |
  *    |   Base      <------- Target ------->
  *    |                  |
  *    ====================
  *
  *************************************************************/
  return timespanTarget.start_time >= timespanBase.start_time &&
          timespanTarget.start_time <= timespanBase.end_time &&
          timespanTarget.end_time > timespanBase.end_time;
};

const testFullOverlap = (timespanBase, timespanTarget) => {
  /************************************************************
  *
  *    ======================
  *    |    Base            |
  *    |                    |
  *    |  <--- Target --->  |
  *    =====================
  *
  *************************************************************/
  return timespanTarget.start_time >= timespanBase.start_time &&
          timespanTarget.start_time <= timespanBase.end_time &&
          timespanTarget.end_time >= timespanBase.start_time &&
          timespanTarget.end_time <= timespanBase.end_time;
};

const testFullInverseOverlap = (timespanBase, timespanTarget) => {
  /************************************************************
  *
  *    ======================
  *    |    Base            |
  *    |                    |
  *  <-------- Target -------->
  *    =====================
  *
  *************************************************************/
  return timespanTarget.start_time <= timespanBase.start_time &&
          timespanTarget.end_time >= timespanBase.end_time;
}

const testAnyOverlap = (timespanBase, timespanTarget) => {
  return testBeginningOverlap(timespanBase, timespanTarget) ||
          testEndingOverlap(timespanBase, timespanTarget) ||
          testFullOverlap(timespanBase, timespanTarget) ||
          testFullInverseOverlap(timespanBase, timespanTarget);
};

const todayDaySpan = () => {
  const now = moment();
  const start = now.hour(0).minute(0).second(0).millisecond(0).toDate();
  const end = now.hours(23).minutes(59).seconds(59).milliseconds(999).toDate();
  return { start_time: start, end_time: end };
};

const nextDaySpan = daySpan => {
  const { start_time, end_time } = daySpan;
  const newStart = moment(start_time).add(1, 'day').toDate();
  const newEnd = moment(end_time).add(1, 'day').toDate();
  return { start_time: newStart, end_time: newEnd };
};

const groupFreeTimesByLocalDate = (freeTimeSpans) => {
  const _groupTimespans = (grouped, workingSet, daySpan) => {
    // workingSet must be a sorted array of timespans
    // daySpan is a timespan marking the start and end of a day in the local timezone
    if (workingSet.length < 1)
      return grouped;
    const upNext = workingSet[0];
    const daySpanKey = moment(daySpan.start_time).format("YYYY-MM-DD");
    if (testFullOverlap(daySpan, upNext)) {
      const newGrouped = Object.assign({}, grouped);
      if (newGrouped[daySpanKey])
        newGrouped[daySpanKey].push(upNext);
      else
        newGrouped[daySpanKey] = [upNext];
      const newWorkingSet = workingSet.slice(1);
      return _groupTimespans(newGrouped, newWorkingSet, daySpan);
    }
    else if (testEndingOverlap(daySpan, upNext)) {
      const truncatedTimespan = { start_time: upNext.start_time, end_time: daySpan.end_time };
      const newGrouped = Object.assign({}, grouped);
      if (newGrouped[daySpanKey])
        newGrouped[daySpanKey].push(truncatedTimespan);
      else
        newGrouped[daySpanKey] = [truncatedTimespan];
      const newDaySpan = nextDaySpan(daySpan);
      const newFirstItem = { start_time: newDaySpan.start_time, end_time: upNext.end_time };
      const newWorkingSet = [newFirstItem].concat(workingSet.slice(1));
      return _groupTimespans(newGrouped, newWorkingSet, newDaySpan);
    }
    else {
      return _groupTimespans(grouped, workingSet, nextDaySpan(daySpan));
    }
  };
  return _groupTimespans({}, freeTimeSpans, todayDaySpan());
};

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 18;

const fiveMinutesInMilliseconds = 5 * 60 * 1000;
const groupFreeTimesDuringWorkHoursByLocalDate = (freeTimeSpans) => {
  const groupedFreeTimes = groupFreeTimesByLocalDate(freeTimeSpans);
  Object.keys(groupedFreeTimes).forEach(dateString => {
    const date = moment(dateString, "YYYY-MM-DD");
    const workStart = date.clone().hours(WORKDAY_START_HOUR).minute(0).second(0).millisecond(0).toDate();
    const workEnd = date.clone().hours(WORKDAY_END_HOUR).minute(0).second(0).millisecond(0).toDate();
    const workTimespan = { start_time: workStart, end_time: workEnd };
    const dateFreeTimes = groupedFreeTimes[dateString];
    let workdayFreeTimes = dateFreeTimes.filter((timespan) => testAnyOverlap(workTimespan, timespan));
    if (!workdayFreeTimes || workdayFreeTimes.length < 1)
      return [];
    workdayFreeTimes[0].start_time = workStart;
    const firstFreeTime = workdayFreeTimes[0];
    if (firstFreeTime.end_time - firstFreeTime.start_time < fiveMinutesInMilliseconds)
      workdayFreeTimes = workdayFreeTimes.slice(1);
    workdayFreeTimes[workdayFreeTimes.length - 1].end_time = workEnd;
    const lastFreeTime = workdayFreeTimes[workdayFreeTimes.length - 1];
    if (lastFreeTime.end_time - lastFreeTime.start_time < fiveMinutesInMilliseconds)
      workdayFreeTimes = workdayFreeTimes.slice(0, -1);
    groupedFreeTimes[dateString] = workdayFreeTimes;
  });
  return groupedFreeTimes;
};

const splitTimespan = (timespan, splitDuration) => {
  // splitDuration is a duration in seconds
  const start = moment(timespan.start_time);
  const end = moment(timespan.end_time);
  if (end.diff(start, 'seconds') < splitDuration)
    return [];
  else {
    const splitStart = timespan.start_time;
    const splitEnd = start.add(splitDuration, 'seconds').toDate();
    const split = { start_time: splitStart, end_time: splitEnd };
    const newTimespan = { start_time: splitEnd, end_time: timespan.end_time };
    return [split].concat(splitTimespan(newTimespan, splitDuration));
  }
};

class TimespanSelect extends Component {
  render() {
    const { timespan, selected, onToggle, includeDate, disabled } = this.props;
    const timeFormat = 'HH:mm:ss';
    const startTime = moment(timespan.start_time);
    const endTime = moment(timespan.end_time);
    const startString = startTime.format(timeFormat);
    const endString = endTime.format(timeFormat);
    var content;
    if (includeDate) {
      content = (
        <div>
          <p className='TimespanDate'>{startTime.format('ddd')}, {startTime.format('l')}</p>
          <p className='TimespanTime'>{startString} – {endString}</p>
        </div>
      );
    }
    else {
      content = <p>{startString} – {endString}</p>
    }
    return <button
            className={classNames('TimespanSelect', 'PollOption', { selected })}
            disabled={disabled}
            onClick={disabled ? (() => {}) : onToggle}>{content}</button>;
  }
}

class ProposeTimes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDateIndex: 0,
      selectedTimespans: []
    }
  }
  render() {
    const { freeTimes, meetingLength, onChange, selectedTimespans } = this.props;
    const { selectedDateIndex } = this.state;
    if (typeof freeTimes === 'undefined')
      return <p><FontAwesome name='spinner' spin /> Loading available times...</p>;
    else if (freeTimes instanceof Error) {
      return <p>{I18n.t('cards.Calendar.thereWasAnErrorGettingAvailableTimes', {message: freeTimes.message})}</p>;
    }
    else {
      const groupedTimes = groupFreeTimesDuringWorkHoursByLocalDate(freeTimes);
      if (!groupedTimes || groupedTimes.length < 1) {
        return (
          <div>
            <p>No {meetingLength}-minute blocks available</p>
          </div>
        );
      }
      else {
        const days = Object.keys(groupedTimes).map(function (dateString, i) {
          const date = moment(dateString, 'YYYY-MM-DD');
          const onClick = (_) => this.setState({ selectedDateIndex: i });
          const selected = selectedDateIndex === i;
          const active = selectedTimespans.find(coordinate => coordinate.dayIndex === i);
          return <button key={i} className={classNames('DayToggle', { selected, active })} onClick={onClick}>{date.format('D')}</button>;
        }.bind(this));
        const timesForSelectedDay = groupedTimes[Object.keys(groupedTimes)[selectedDateIndex]];
        const meetingLengthInSeconds = meetingLength * 60;
        const blocks = [].concat.apply([], timesForSelectedDay.map(timespan => splitTimespan(timespan, meetingLengthInSeconds)));  // Flatten
        const times = blocks.map((timespan, idx) => {
          const coordinate = { dayIndex: selectedDateIndex, timeIndex: idx, timespan };
          const existingCoordinateIndex = selectedTimespans.findIndex(c => c.dayIndex === coordinate.dayIndex && c.timeIndex === coordinate.timeIndex);
          const selected = existingCoordinateIndex >= 0;
          const onToggle = (_) => {
            let newSelectedTimespans = selectedTimespans.slice(0);
            if (selected)
              newSelectedTimespans.splice(existingCoordinateIndex, 1);
            else
              newSelectedTimespans.push(coordinate);
            onChange(newSelectedTimespans);
          };
          return <TimespanSelect timespan={timespan} key={idx} selected={selected} onToggle={onToggle} />
        });
        return (
          <div>
            <div className='DayToggleButtons'>{days}</div>
            <div>{times}</div>
          </div>
        );
      }
    }
  }
}

const mimeType = 'application/x.card.scheduling+json';
const responseMIMEType = /^application\/x\.card-response.*\+json.*$/;
const messagePartsForCalendar = (body) => {
  return [new Layer.MessagePart({ mimeType, body })];
};
export { messagePartsForCalendar };

class CalendarCompose extends Component {
  constructor(props) {
    super(props);
    this.state = {
      eventName: '',
      meetingLength: 60,
      freeTimes: undefined,
      selectedTimespans: [],
      isSending: false
    }
  }
  getFreeTimes(durationInMinutes) {
    const millisecondsInHour = 3600 * 1000;
    // http://stackoverflow.com/a/28037042/472768
    const now = new Date();
    const nextHour = new Date(Math.ceil(now.getTime() / millisecondsInHour) * millisecondsInHour);
    const nextHourTimestamp = Math.floor(nextHour.getTime() / 1000);
    const fiveDaysFromNowTimestamp = nextHourTimestamp + (5 * 24 * 3600);
    const durationInSeconds = durationInMinutes * 60;
    this.setState({ selectedTimespans: [] });
    get(`/freeTimes?start=${nextHourTimestamp}&end=${fiveDaysFromNowTimestamp}&duration=${durationInSeconds}`, function (err, res) {
      if (err) {
        this.setState({ freeTimes: err });
        return;
      }
      if (!res.ok) {
        this.setState({ freeTimes: new Error(res.error)});
        return;
      }
      const hydratedTimes = res.freeTimes.map((timespan) => {
        const start = new Date(timespan.start_time * 1000);
        const end = new Date(timespan.end_time * 1000);
        return { start_time: start, end_time: end };
      });
      this.setState({ freeTimes: hydratedTimes });
    }.bind(this));
  }
  componentDidMount() {
    this.getFreeTimes(this.state.meetingLength);
  }
  sendMessage() {
    const timespans = this.state.selectedTimespans.map(coordinate => coordinate.timespan);
    const messagePart = {
      title: this.state.eventName,
      dates: timespans.map(timespan => ({start: timespan.start_time.toISOString(), end: timespan.end_time.toISOString()}))
    };
    this.setState({ isSending: true });
    this.props.onSend(messagePart);
  }
  selectedTimesChanged(timespans) {
    this.setState({ selectedTimespans: timespans });
  }
  render() {
    const { freeTimes, meetingLength, selectedTimespans, isSending } = this.state;
    const meetingLengthChanged = newLength => {
      this.setState({ meetingLength: newLength, freeTimes: undefined });
      this.getFreeTimes(newLength);
    };
    let sendButton = null;
    if (selectedTimespans.length > 0) {
      if (isSending)
        sendButton = <button className='inline SendButton' disabled><FontAwesome name='spinner' spin />{I18n.t('cards.Calendar.sending')}</button>;
      else
        sendButton = <button className='inline SendButton' onClick={this.sendMessage.bind(this)}>{I18n.t('cards.Calendar.send')}</button>;
    }
    else
      sendButton = <button className='inline SendButton' disabled>{I18n.t('cards.Calendar.send')}</button>;
    return (
      <div className='CalendarCompose CardBody'>
        <div className='CardHeader'>
          <p className='CardTitle'><FontAwesome name='calendar-plus-o' />{I18n.t('cards.Calendar.whenCanWeMeet')}</p>
          {sendButton}
        </div>
        <div className='EventBasics'>
          <label>{I18n.t('cards.Calendar.meetingTitle')}</label>
          <input type='text'
            placeholder={I18n.t('cards.Calendar.ex', {name: currentUser().first_name || 'Justin'})}
            value={this.state.eventName}
            onChange={e => this.setState({ eventName: e.target.value })} />
          <div className='MeetingLength'>
            <label>{I18n.t('cards.Calendar.meetingLength')}</label>
            <div className='MeetingLengthButtons'>
              <button
                className={classNames({ selected: meetingLength === 15 })}
                onClick={_ => meetingLengthChanged(30)}>{I18n.t('cards.Calendar.minutes', {minute: 15})}</button>
              <button
                className={classNames({ selected: meetingLength === 30 })}
                onClick={_ => meetingLengthChanged(60)}>{I18n.t('cards.Calendar.minutes', {minute: 30})}</button>
              <button
                className={classNames({ selected: meetingLength === 60 })}
                onClick={_ => meetingLengthChanged(90)}>{I18n.t('cards.Calendar.minutes', {minute: 60})}</button>
              </div>
          </div>
        </div>
        <div className='ProposeTimes'>
          <label>{I18n.t('cards.Calendar.proposeSomeTimes')}</label>
          <ProposeTimes
            freeTimes={freeTimes}
            selectedTimespans={selectedTimespans}
            meetingLength={meetingLength}
            onChange={this.selectedTimesChanged.bind(this)} />
        </div>
      </div>
    )
  }
}

class BookATime extends Component {
  constructor(props) {
    super(props);
    this.state = {
      savedResponses: undefined,
      selectedIndex: undefined,
      isSubmitting: false,
      submitted: false
    };
  }
  loadResponses() {
    const messageID = this.props.message.id;
    if (!messageID) {
      this.setState({ savedResponses: new Error('No message ID') });
      return;
    }
    get(`/message/${stripPrefix(messageID)}`, (err, res) => {
      if (err) {
        this.setState({ savedResponses: err });
        return;
      }
      else {
        this.setState({ savedResponses: res });
        if (res.votes) {
          const keys = Object.keys(res.votes);
          const selectedIndex = res.votes[keys[0]];
          this.setState({ selectedIndex });
        }
      }
    });
  }
  componentDidMount() {
    this.loadResponses();
  }
  componentWillReceiveProps(nextProps) {
    this.loadResponses();
  }
  onSubmit() {
    this.setState({ isSubmitting: true });
    const messageID = stripPrefix(this.props.message.id);
    const selectedIndex = this.state.selectedIndex;
    const title = this.props.content.title;
    const time = this.props.content.dates[selectedIndex];
    const { start, end } = time;
    const conversation = WebSDK.getConversation(this.props.message.conversationId);
    // Added ownerID to grab owner_id from conv metadata. Still need to use agentID in index?
    const ownerID = conversation.metadata.owner_id;
    const payload = { messageID, selectedIndex, title, start, end, ownerID };
    post(`/scheduleEvent`, payload, (err, res) => {
      if (err)
        this.setState({ isSubmitting: err });
      else if (!res.ok)
        this.setState({ isSubmitting: new Error(res.error) });
      else {
        this.setState({ isSubmitting: false, submitted: true });
        // Send receipt message
        const encodedMessageID = btoa(this.props.message.id);
        const receiptMIMEType = `application/x.card-response.1+json;card="${encodedMessageID}"`;
        const receiptMessage = conversation.createMessage({
          parts: [{ body: JSON.stringify(res.patch), mimeType: receiptMIMEType }]
        });
        receiptMessage.send();
      }
    });
  }
  render() {
    const { savedResponses, selectedIndex, isSubmitting, submitted } = this.state;
    const { content } = this.props;
    const { title, dates } = content;
    const cardTitle = title && title.length > 0 ? title : 'When can we meet?';
    let submitButton = null;
    const finalized = submitted || (savedResponses && savedResponses.votes && Object.keys(savedResponses.votes).length > 0);
    if (selectedIndex >= 0) {
      if (finalized)
        submitButton = <button className='inline' disabled>{I18n.t('cards.Calendar.submitted')}</button>;
      else if (isSubmitting instanceof Error)
        submitButton = <button className='inline error' onClick={() => alert(isSubmitting.message)}>{I18n.t('cards.Calendar.error')}</button>;
      else if (isSubmitting)
        submitButton = <button className='inline' disabled>{I18n.t('cards.Calendar.submitting')}<FontAwesome name='spinner' spin /></button>;
      else
        submitButton = <button className='inline' onClick={this.onSubmit.bind(this)}>{I18n.t('cards.Calendar.submit')}</button>;
    }
    if (typeof savedResponses === 'undefined') {
      return <p><FontAwesome name='spinner' spin />{I18n.t('cards.Calendar.loadingResponses')}</p>;
    }
    else if (savedResponses instanceof Error) {
      return <p>Error loading response: {savedResponses.message}</p>;
    }
    else {
      let agentPrompt = null;
      if (!isUserMode()) {
        if (finalized)
          agentPrompt = <p className='AgentPrompt'>{I18n.t('cards.Calendar.recipientHasConfirmedThisTime')}</p>;
        else
          agentPrompt = <p className='AgentPrompt'>{I18n.t('cards.Calendar.waitingForRecipientToRespond')}</p>;
      }
      let userPrompt = null;
      if (isUserMode())
        userPrompt = <label key='label'>{I18n.t('cards.Calendar.selectATime')}</label>;
      return (
        <div className='BookATime CardBody'>
          <div className='CardHeader'>
            <p className='CardTitle'><FontAwesome name='calendar-plus-o' /> {cardTitle}</p>
            {submitButton}
          </div>
          <div className='ProposedTimes'>
            {agentPrompt}
            {userPrompt}
            {dates.map((span, i) => {
              const start = moment(span.start, moment.ISO_8601);
              const end = moment(span.end, moment.ISO_8601);
              const timespan = { start_time: start, end_time: end };
              const selected = selectedIndex === i;
              const onToggle = () => this.setState({ selectedIndex: i });
              const disabled = !isUserMode() || finalized;
              return <TimespanSelect timespan={timespan} selected={selected} onToggle={onToggle} includeDate disabled={disabled} key={i} />
            })}
          </div>
        </div>
      );
    }
  }
}

class Calendar extends Component {
  render() {
    const { content, onSend, message } = this.props;
    if (content === 'loading')
      return <CalendarLoading message='Loading your calendars...' />;
    else if (content === 'compose')
      return <CalendarCompose onSend={onSend} />;
    else {
      try {
        const payload = JSON.parse(content);
        return <BookATime content={payload} message={message} />;
      } catch (e) {
        return <p>Unparseable content for Calendar card</p>;
      }
    }
  }
}

registerComponent('csr-calendar-card', {
  mixins: [MessageHandlerMixin],
  properties: {
    message: {
      set: function(value) {
        const setAndRender = () => {
          if (value.parts[0].mimeType.match(responseMIMEType)) {
            this.content = value.parts[0].body;
            return;
          }
          this.content = value.parts[0].body;
          this.onRender();
        }
        if (value) {
          value.on('messages:sent', setAndRender, this);
        }
        setAndRender();
      }
    }
  },
  methods: {
    onAfterCreate: function() {
      const message = this.message;
      if (!message.isNew())
        return;
      this.onSend = (payload) => {
        const bodyString = JSON.stringify(payload);
        message.parts[0].body = bodyString;
        message.send();
      }
    },
    onAttach: function() {
      WebSDK.on('messages:add', (event) => {
        const newMessage = event.messages[0];
        const firstPartMIME = newMessage.parts[0].mimeType;
        if (!firstPartMIME.match(responseMIMEType))
          return;
        const parsedMIME = contentType.parse(firstPartMIME);
        const cardID = atob(parsedMIME.parameters['card']);
        if (cardID !== this.message.id)
          return;
        this.onRender();
      }, this);
    },
    onRender: function() {
      const { content, onSend, message } = this;
      ReactDOM.render(<Calendar content={content} onSend={onSend} message={message} />, this);
    },
    onDetach: function() {
      WebSDK.off(null, null, this);
    }
  }
});

registerMessageHandler({
  tagName: 'csr-calendar-card',
  label: 'Calendar',
  handlesMessage: message => {
    const firstMIMEType = message.parts[0].mimeType;
    return firstMIMEType === mimeType;
  }
});
