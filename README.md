# Botium Connector for Whatsapp Webhooks

[![NPM](https://nodei.co/npm/botium-connector-whatsapp.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-whatsapp/)

[![Codeship Status for codeforequity-at/botium-connector-whatsapp](https://app.codeship.com/projects/3bfbdb70-cc38-0137-cfbb-56d5361bfa83/status?branch=master)](https://app.codeship.com/projects/368328)
[![npm version](https://badge.fury.io/js/botium-connector-whatsapp.svg)](https://badge.fury.io/js/botium-connector-whatsapp)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing your [Whatsapp Business API Webhooks](https://developers.facebook.com/docs/whatsapp/api/webhooks).

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles ? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works ?
Botium uses two technologies for driving the conversations against your chatbot.


__Redis__ is used to connect the webhook to Botium scripts: all messages received over the webhook are published to Redis, and Botium on the other end subscribes to those Redis channels before running a conversation. 

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Requirements

* __Node.js and NPM__
* a __Whatsapp Business API Webhook__
* a __Redis__ instance (Cloud hosted free tier for example from [redislabs](https://redislabs.com/) will do as a starter)
* a __project directory__ on your workstation to hold test cases and Botium configuration

## Install and Run the Botium Whatsapp Business API emulator

The Botium Whatsapp Business API emulator is responsible for the receiving part, listens for messages from your webhook, and puts them into Redis. It is running outside of Botium as a background service.

You have to configure your Whatsapp webhook to deliver the outbound messages to the Botium Whatsapp Business API emulator. 

Installation with NPM:

    > npm install -g botium-connector-whatsapp
    > botium-waproxy-cli start --help

There are several options required for running the service:

_--port_: Local port to listen

_--endpoint_: endpoint (url part after the port ...) (optional, default _/_)

_--redisurl_: Redis connection url

## Install Botium and Whatsapp Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-whatsapp
> cd <your working dir>
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-whatsapp
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Connecting your Whatsapp Webhook to Botium

Open the file _botium.json_ in your working directory and add the webhook url and Redis connection settings.

```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "<whatever>",
      "CONTAINERMODE": "whatsapp",
      "WHATSAPP_WEBHOOKURL": "..."
    }
  }
}
```
Botium setup is ready, you can begin to write your [BotiumScript](https://github.com/codeforequity-at/botium-core/wiki/Botium-Scripting) files.

__Important: The Botium Whatsapp Business API emulator has to be running when Botium is started. Otherwise, Botium scripts will fail to receive any input or output messages from your chatbot!__

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __whatsapp__ to activate this connector.

### WHATSAPP_WEBHOOKURL
The URL of your Whatsapp Business API webhook.

### WHATSAPP_RECIPIENTID
The Whatsapp Id of the user.

Optional. By default, a unique id is generated.

### WHATSAPP_REDISURL
The url of your Redis instance - for example _redis://127.0.0.1:6379_.

Or a Redis options object - see [here](https://github.com/luin/ioredis#connect-to-redis)

## Open Issues and Restrictions

* Currently only plain text messages are supported
* Currently only individual receivers supported
