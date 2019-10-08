const util = require('util')
const express = require('express')
const Redis = require('ioredis')
const bodyParser = require('body-parser')
const debug = require('debug')('botium-waproxy-proxy')

const processEvent = async (event, { redis, ...rest }) => {
  try {
    debug('Got Message Event:')
    debug(JSON.stringify(event, null, 2))

    if (event.to) {
      redis.publish(event.to, JSON.stringify(event))
      debug(`Published event for recipient id ${event.to}`)
    }
  } catch (err) {
    debug('Error while publishing to redis')
    debug(err)
  }
}

const setupEndpoints = ({ app, endpoint, redisurl, ...rest }) => {
  const redis = new Redis(redisurl)
  redis.on('connect', () => {
    debug(`Redis connected to ${util.inspect(redisurl)}`)
  })
  endpoint = (endpoint || '/') + 'v1/messages'

  app.get('/', (req, res) => {
    res.status(200).send(`Botium Whatsapp Business API emulator</br>POST messages to ${endpoint}`).end()
  })

  app.post(endpoint, (req, res) => {
    res.status(200).end()

    if (req.body) {
      processEvent(req.body, { redis, ...rest })
    }
  })
}

const startProxy = ({ port, endpoint, ...rest }) => {
  const app = express()

  app.use(endpoint, bodyParser.json())
  app.use(endpoint, bodyParser.urlencoded({ extended: true }))

  setupEndpoints({ app, endpoint, ...rest })

  app.listen(port, () => {
    console.log(`Botium Whatsapp Business API emulator is listening on port ${port}`)
    console.log(`Whatsapp Business API emulator endpoint available at http://127.0.0.1:${port}${endpoint}`)
  })
}

module.exports = {
  setupEndpoints,
  startProxy
}
