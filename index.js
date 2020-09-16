const util = require('util')
const randomize = require('randomatic')
const uuidv4 = require('uuid/v4')
const debug = require('debug')('botium-connector-whatsapp')

const SimpleRestContainer = require('botium-core/src/containers/plugins/SimpleRestContainer')
const { Capabilities: CoreCapabilities } = require('botium-core')

const Capabilities = {
  WHATSAPP_WEBHOOKURL: 'WHATSAPP_WEBHOOKURL',
  WHATSAPP_RECIPIENTID: 'WHATSAPP_RECIPIENTID'
}
const Defaults = {
}

class BotiumConnectorWhatsapp {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.delegateContainer = null
    this.delegateCaps = null
    this.whatsappId = null
  }

  Validate () {
    debug('Validate called')

    this.caps = Object.assign({}, Defaults, this.caps)

    if (!this.caps[Capabilities.WHATSAPP_WEBHOOKURL]) throw new Error('WHATSAPP_WEBHOOKURL capability required')
    this.whatsappId = this.caps[Capabilities.WHATSAPP_RECIPIENTID] || `WA-BOTIUM-${randomize('A0', 10)}`

    if (!this.delegateContainer) {
      this.delegateCaps = {
        [CoreCapabilities.SIMPLEREST_URL]: this.caps[Capabilities.WHATSAPP_WEBHOOKURL],
        [CoreCapabilities.SIMPLEREST_METHOD]: 'POST',
        [CoreCapabilities.SIMPLEREST_CONVERSATION_ID_TEMPLATE]: this.whatsappId,
        [CoreCapabilities.SIMPLEREST_BODY_TEMPLATE]:
          `{
            "messages": [
              {
                "recipient_type": "individual",
                "from": "${this.whatsappId}",
                "type": "text",
                "text": {}
              }
            ]
          }`,
        [CoreCapabilities.SIMPLEREST_REQUEST_HOOK]: ({ requestOptions, msg, context }) => {
          const body = requestOptions.body
          const message = body.messages[0]
          message.id = uuidv4()
          message.timestamp = Date.now()
          message.text.body = msg.messageText
        },
        [CoreCapabilities.SIMPLEREST_RESPONSE_HOOK]: ({ botMsg }) => {
          debug(`Response Body: ${util.inspect(botMsg.sourceData, false, null, true)}`)
          const message = botMsg.sourceData

          if (message.type === 'text' && message.text && message.text.body) {
            botMsg.messageText = message.text.body
          } else {
            debug(`WARNING: recieved unsupported message: ${message}`)
          }
        },
        [CoreCapabilities.SIMPLEREST_INBOUND_SELECTOR_JSONPATH]: '$.body.to',
        [CoreCapabilities.SIMPLEREST_INBOUND_SELECTOR_VALUE]: '{{botium.conversationId}}'
      }
      for (const capKey of Object.keys(this.caps).filter(c => c.startsWith('SIMPLEREST'))) {
        if (!this.delegateCaps[capKey]) this.delegateCaps[capKey] = this.caps[capKey]
      }

      debug(`Validate delegateCaps ${util.inspect(this.delegateCaps)}`)
      this.delegateContainer = new SimpleRestContainer({ queueBotSays: this.queueBotSays, caps: this.delegateCaps })
    }

    debug('Validate delegate')
    return this.delegateContainer.Validate()
  }

  async Build () {
    await this.delegateContainer.Build()
  }

  async Start () {
    await this.delegateContainer.Start()
  }

  async UserSays (msg) {
    await this.delegateContainer.UserSays(msg)
  }

  async Stop () {
    await this.delegateContainer.Stop()
  }

  async Clean () {
    await this.delegateContainer.Clean()
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorWhatsapp
}
