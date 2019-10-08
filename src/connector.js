const util = require('util')
const Redis = require('ioredis')
const _ = require('lodash')
const randomize = require('randomatic')
const request = require('request-promise-native')
const uuidv4 = require('uuid/v4')
const debug = require('debug')('botium-connector-whatsapp')

const Capabilities = {
  WHATSAPP_WEBHOOKURL: 'WHATSAPP_WEBHOOKURL',
  WHATSAPP_REDISURL: 'WHATSAPP_REDISURL',
  WHATSAPP_RECIPIENTID: 'WHATSAPP_RECIPIENTID'
}
const Defaults = {
}

class BotiumConnectorWhatsapp {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.redis = null
    this.whatsappId = null
  }

  Validate () {
    debug('Validate called')

    Object.assign(this.caps, Defaults)

    if (!this.caps[Capabilities.WHATSAPP_WEBHOOKURL]) throw new Error('WHATSAPP_WEBHOOKURL capability required')

    return Promise.resolve()
  }

  async Build () {
    debug('Build called')
    await this._buildRedis()
  }

  async Start () {
    debug('Start called')
    this.whatsappId = this.caps[Capabilities.WHATSAPP_RECIPIENTID] ? this.caps[Capabilities.WHATSAPP_RECIPIENTID] : `WA-BOTIUM-${randomize('A0', 10)}`
    await this._subscribeRedis()
  }

  async UserSays (msg) {
    debug('UserSays called')

    const webhookReq = {
      messages: [
        {
          recipient_type: 'individual',
          from: this.whatsappId,
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'text',
          text: {
            body: msg.messageText
          }
        }
      ]
    }
    const requestOptions = {
      uri: this.caps[Capabilities.WHATSAPP_WEBHOOKURL],
      method: 'POST',
      body: webhookReq,
      json: true
    }
    msg.sourceData = webhookReq
    try {
      await request(requestOptions)
    } catch (err) {
      throw new Error(`Failed sending message to ${this.caps[Capabilities.WHATSAPP_WEBHOOKURL]}: ${err}`)
    }
  }

  async Stop () {
    debug('Stop called')
    await this._unsubscribeRedis()
    this.whatsappId = null
  }

  async Clean () {
    debug('Clean called')
    await this._cleanRedis()
  }

  _buildRedis () {
    return new Promise((resolve, reject) => {
      this.redis = new Redis(this.caps[Capabilities.WHATSAPP_REDISURL])
      this.redis.on('connect', () => {
        debug(`Redis connected to ${util.inspect(this.caps[Capabilities.WHATSAPP_REDISURL])}`)
        resolve()
      })
      this.redis.on('message', (channel, event) => {
        if (this.whatsappId) {
          if (!_.isString(event)) {
            return debug(`WARNING: received non-string message from ${channel}, ignoring: ${event}`)
          }
          try {
            event = JSON.parse(event)
          } catch (err) {
            return debug(`WARNING: received non-json message from ${channel}, ignoring: ${event}`)
          }
          if (!event.to || event.to !== this.whatsappId) {
            return
          }
          if (!event.type) {
            return
          }

          const botMsg = { sender: 'bot', sourceData: event }

          if (event.type === 'text' && event.text && event.text.body) {
            botMsg.messageText = event.text.body
          }

          debug(`Received a message to queue at ${channel}: ${util.inspect(botMsg)}`)
          this.queueBotSays(botMsg)
        }
      })
    })
  }

  _subscribeRedis () {
    return new Promise((resolve, reject) => {
      this.redis.subscribe(this.whatsappId, (err, count) => {
        if (err) {
          return reject(new Error(`Redis failed to subscribe channel ${this.whatsappId}: ${util.inspect(err)}`))
        }
        debug(`Redis subscribed to ${count} channels. Listening for updates on the ${this.whatsappId} channel.`)
        resolve()
      })
    })
  }

  _unsubscribeRedis () {
    return new Promise((resolve, reject) => {
      this.redis.unsubscribe(this.whatsappId, (err) => {
        if (err) {
          return reject(new Error(`Redis failed to unsubscribe channel ${this.whatsappId}: ${util.inspect(err)}`))
        }
        debug(`Redis unsubscribed from ${this.whatsappId} channel.`)
        resolve()
      })
    })
  }

  _cleanRedis () {
    if (this.redis) {
      this.redis.disconnect()
      this.redis = null
    }
  }
}

module.exports = BotiumConnectorWhatsapp
