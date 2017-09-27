---
layout: default
title:  "Overview"
permalink: overview.html
---
CSR is an open-source application showing what can be built using Layer SDKs and libraries. As of April 2017, it is intended to be a reference implementation of the rich functionality and integrations typically used in an agent-to-user scenario. Currently, we make no guarantees about the production-readiness of the code, although we use CSR internally at Layer for public demonstrations and to handle non-critical customer interactions. We are rapidly iterating based on our internal use cases and early adopter feedback; while we try to avoid breaking changes, we are currently unable to guarantee that updates won't cause breakage.

# Design assumptions
* Agents are working from desktop computer browsers
* End users are on mobile, either via mobile browsers or a native app

# Technology
* Broadly spit into [server app][github-tree-api] and [client apps][github-tree-web]
* Server requires Node >= 6.0.0 and PostgreSQL >= 9.6
* Agent UI uses React 15, Layer WebSDK 3.1.1 and Layer UI for Web 0.10.1. As a result, agents and users on mobile web must use IE11+ or an evergreen browser.

[github-tree-api]: https://github.com/layerhq/csr/tree/41318ce900ec9c5864e020189ef14ef11e928db6/api
[github-tree-web]: https://github.com/layerhq/csr/tree/41318ce900ec9c5864e020189ef14ef11e928db6/web