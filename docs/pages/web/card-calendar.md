---
layout: default
title:  "Card — Scheduling"
permalink: /web/card-calendar.html
---

A [Scheduling Card][scheduling-card] (we've also called it a Calendar Card) allows the recipient to select one of multiple options proposed by the sender:

![Scheduling card example]({{ "/assets/calendar-card-example.png" | relative_url }} "Example scheduling card with one of two proposed times selected")

# Data format
A Scheduling card has a MIME type [`application/x.card.scheduling+json`][scheduling-card-mime]. Its payload contains the following structure, JSON-encoded:

{% highlight js %}
{
  "title": <string>,  // optional
  "dates": [<range>]
}
// Range:
{
  "start": <string>,  // ISO-8601 datetime string
  "end": <string>     // Can be generated via `toISOString()` on a Date instance in JS
}
{% endhighlight %}

A Scheduling card will also generate a response receipt message (see below). This has a MIME type [`application/x.card-response.1+json;card="<mid>"`][scheduling-card-response-mime], where `<mid>` is a [base-64 encoded][scheduling-card-btoa] version of the message ID. This allows the response receipt to point to a specific card instance. Currently, clients ignore the content of the response receipt.

# LayerUI integration
The Poll card follows the [LayerUI documentation for custom cards][lui-custom-cards] to [register itself][scheduling-card-register]. Notably, component instances register themselves as listeners to `messages:add` events in `onAttach` (and unregister in `onDetach` to avoid leaking memory). This allows each poll card instance to be notified on new messages, and they filter for response receipts (see below) that refer to their current message. When a matching message is received, the card re-renders itself, causing the selected response to appear.

The React component receives `content` to render, an `onSend` function from a "parent", which gets called when a recipient selects a response, and a reference to the Layer Message instance itself (used to generate the response receipt).

# Calendar Component
The [`Calendar` component][calendar-component] dispatches based on `props.content` — it either renders a `CalendarLoading` component, `CalendarCompose` component, or tries to parse and render the response to a scheduling card.

# CalendarCompose Component
The [`CalendarCompose` component][calendar-compose-component] allows agents to compose a scheduling request by pulling available times from their calendar:

![Scheduling compose example]({{ "/assets/calendar-compose-example.png" | relative_url }} "Example empty poll compose card")

It requests available times from the CSR server, manages its own React state to store the meeting title and proposed timeslots, implements interaction logic (such as whether the "Send" button should be enabled), and creates a Layer MessagePart from its state when the "Send" button is pressed. `CalendarCompose` relies on the `ProposeTimes` component to render possible timeslots.

`ProposeTimes` manages a small amount of selection state to render each day on a different "page", but delegates most state management to `CalendarCompose`. The CSR server responds with contiguous blocks of free time (see below for server-side details). `ProposeTime`'s primary responsibility is to break up contiguous blocks of time into the selected meeting length (for example, breaking up a block of three free hours into six half-hour possiblities). This is handled by a number of [utility functions][calendar-utility-functions] that essentially implement [set operations][set-operations] on timespans.

Note that we make some simplifying assumptions here. In particular:
  * Proposed timespans are aligned with the beginning of the available block (for example, if you had 90 minutes free on your calendar but requested 60 minute blocks, you'd see one 60-minute block, and the last 30 minutes would not appear as a choice).
  * Proposed timespans are mutually exclusive.

# BookATime Component
The [`BookATime` component][book-a-time-component] renders the proposed timeslots, allows the recipient to make a selection, and, if the recipient has already responded to a scheduling request, loads the persisted response and disables additional responses:

![Scheduling card example]({{ "/assets/calendar-card-example.png" | relative_url }} "Example scheduling card with one of two proposed times selected")

Its React state keeps track of previously-persisted responses, the current user-selected response, and the submission state of the card. [Every][book-a-time-component-did-mount] [time][book-a-time-component-will-receive-props] the React component renders, persisted response data is [fetched from the server][book-a-time-load-responses], and the component rerenders itself if needed via `setState`.

When the recipient makes a selection and presses "Send", [`onSubmit`][book-a-time-onsubmit] is triggered. This function invokes the `saveResponse` function on the server (see below). If the AJAX request is successful, a receipt message is automatically sent. This receipt appears for the agent, and is also used as a trigger to rerender the card, so the agent sees the user's reply.

# Server-side
Calendar access is provided by [Nylas][nylas]. This is implemented in the [Nylas module][nylas-module]. This module implements an [OAuth authentication][nylas-oauth] for agents to connect their calendar.

The [`freeTimes` function][nylas-freetimes] takes four arguments, and returns free times for an agent based on their calendar:
  * `agentID`: ID of the agent making the request. Used to lookup their Nylas authorization token and calendar ID.
  * `rangeStart`: UNIX timestamp marking the beginning of the search space
  * `rangeEnd`: UNIX timestamp marking the end of the search space
  * `minDuration`: Minimum duration (in seconds) of contiguous free time

This function performs the following steps:
  1. Get all the events on the agent's primary calendar that begin between `rangeStart` and `rangeEnd`
  2. Compute the union of the timespans of all those events, merging adjacent timespans
  3. Compute the timespan difference between [`rangeStart`-`rangeEnd`] and the union timespan
  4. Filter out timespans that are shorter than `minDuration`
  5. Return the resulting set

The client breaks up these blocks into timespans of any desired duration (described above). This logic is implemented client-side so the server doesn't have to be concerned about client timezones or user-specific search space restrictions, such as only showing timespans during work hours.

The [`saveResponse` function][nylas-saveresponse] is invoked when a recipient selects a timespan. This function persists the user's response, then uses Nylas to create an event on the agent's calendar and send a calendar invite to the recipient.

[scheduling-card]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx
[scheduling-card-mime]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L261
[scheduling-card-response-mime]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L262
[scheduling-card-btoa]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L423
[lui-custom-cards]: https://docs.layer.com/sdk/webui/ui_customization#custom-cards
[scheduling-card-register]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L512-L564
[calendar-component]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L491-L510
[calendar-compose-component]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L268-L367
[calendar-utility-functions]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L27-L180
[set-operations]: https://en.wikipedia.org/wiki/Set_(mathematics)#Basic_operations
[book-a-time-component]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L369-L489
[book-a-time-component-did-mount]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L400-L402
[book-a-time-component-will-receive-props]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L403-L405
[book-a-time-load-responses]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L379-L399
[book-a-time-onsubmit]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Calendar.jsx#L406-L431
[nylas]: https://nylas.com
[nylas-module]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/api/src/nylas.js
[nylas-oauth]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/api/src/nylas.js#L16-L100
[nylas-freetimes]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/api/src/nylas.js#L102-L240
[nylas-saveresponse]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/api/src/nylas.js#L242-L299