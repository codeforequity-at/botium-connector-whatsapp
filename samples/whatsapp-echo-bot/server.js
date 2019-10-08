const express = require('express')
const bodyParser = require('body-parser')
const request = require('request-promise-native')

if (!process.env.WA_ENDPOINT) {
  console.log('Please set env variable WA_ENDPOINT to the Whatsapp Endpoint')
  process.exit(1)
}

const sendEcho = async (body) => {
  if (!body.messages) return

  for (const message of body.messages) {
    console.log('Sending echo on message', message)
    const echoResponse = {
      recipient_type: 'individual',
      to: message.from
    }
    if (message.type === 'text') {
      Object.assign(echoResponse, {
        type: 'text',
        text: {
          body: `You said: ${message.text.body}`
        }
      })

      try {
        await request({
          uri: process.env.WA_ENDPOINT,
          method: 'POST',
          body: echoResponse,
          json: true
        })
      } catch (err) {
        console.log(`Failed sending echo to ${process.env.WA_ENDPOINT}`, err)
      }
    }
  }
}

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.status(200).send('POST messages to /webhook').end()
})

app.post('/webhook', (req, res) => {
  res.sendStatus(200)
  setTimeout(() => sendEcho(req.body), 0)
})

const listener = app.listen(process.env.PORT || 5010, () => {
  console.log('Whatsapp Echo Bot is listening on port ' + listener.address().port)
})
