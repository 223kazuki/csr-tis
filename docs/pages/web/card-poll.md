---
layout: default
title:  "Card — Poll"
permalink: /web/card-poll.html
---

A [Poll Card][poll-card] allows the recipient to select one of multiple options proposed by the sender:

![Poll card example]({{ "/assets/poll-card-example.png" | relative_url }} "Example poll card with one of three options selected")

# Data format
A Poll card has a MIME type [`application/x.card.text-poll+json`][poll-card-mime]. Its payload contains the following structure, JSON-encoded:

{% highlight js %}
{
  "question": <string>,  // optional
  "choices": [<string>]
}
{% endhighlight %}

A Poll card will also generate a response receipt message (see below). This has a MIME type [`application/x.card-response.1+json;card="<mid>"`][poll-card-response-mime], where `<mid>` is a [base-64 encoded][poll-card-btoa] version of the message ID. This allows the response receipt to point to a specific card instance. Currently, clients ignore the content of the response receipt.

# LayerUI integration
The Poll card follows the [LayerUI documentation for custom cards][lui-custom-cards] to [register itself][poll-card-register]. Notably, component instances register themselves as listeners to `messages:add` events in `onAttach` (and unregister in `onDetach` to avoid leaking memory). This allows each poll card instance to be notified on new messages, and they filter for response receipts (see below) that refer to their current message. When a matching message is received, the card re-renders itself, causing the selected response to appear.

The React component receives `content` to render, an `onSend` function from a "parent", which gets called when a recipient selects a response, and a reference to the Layer Message instance itself (used to generate the response receipt).

# Poll Component
The [`Poll` component][poll-component] dispatches based on `props.content` — it either renders a `PollCompose` component, or tries to parse and render the results of a poll that has been responded to.

# PollCompose Component
The [`PollCompose` component][poll-compose-component] allows agents to compose a poll by providing a question and an unlimited number of choices:

![Poll compose example]({{ "/assets/poll-compose-example.png" | relative_url }} "Example empty poll compose card")

It manages its own React state to store the question and choices, implements interaction logic (such as whether the "Send" button should be enabled), and creates a Layer MessagePart from its state when the "Send" button is pressed.

# PollPrompt Component
The [`PollPrompt` component][poll-prompt-component] renders the proposed options, allows the recipient to make a selection, and, if the recipient has already responded to a poll, loads the persisted response and disables additional responses:

![Poll prompt example]({{ "/assets/poll-prompt-example.png" | relative_url }} "Example poll response with one of five options selected")

Its React state keeps track of previously-persisted responses, the current user-selected response, and the submission state of the card. [Every][poll-prompt-component-did-mount] [time][poll-prompt-component-will-receive-props] the React component renders, persisted response data is [fetched from the server][poll-prompt-load-responses], and the component rerenders itself if needed via `setState`.

When the recipient makes a selection and presses "Send", [`onSubmit`][poll-prompt-onsubmit] is triggered. This function reformats data into a Layer patch request and makes a `PATCH` request to persist the response to the server. If the request is successful, a receipt message is automatically sent. This receipt appears for the agent, and is also used as a trigger to rerender the card, so the agent sees the user's reply.

![Poll response receipt example]({{ "/assets/poll-response-receipt-example.png" | relative_url }} "Example poll response receipt from an agent's perspective")

[poll-card]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx
[poll-card-mime]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L16
[poll-card-response-mime]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L17
[poll-card-btoa]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L148
[lui-custom-cards]: https://docs.layer.com/sdk/webui/ui_customization#custom-cards
[poll-card-register]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L235-L287
[poll-component]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L219-L233
[poll-compose-component]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L23-L93
[poll-prompt-component]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L95-L217
[poll-prompt-component-did-mount]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L126-L128
[poll-prompt-component-will-receive-props]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L129-L131
[poll-prompt-load-responses]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L105-L125
[poll-prompt-onsubmit]: https://github.com/layerhq/csr/blob/41318ce900ec9c5864e020189ef14ef11e928db6/web/src/conversations/cards/Poll.jsx#L132-L156