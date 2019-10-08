#!/usr/bin/env node
const util = require('util')
const yargsCmd = require('yargs')
const debug = require('debug')('botium-waproxy-cli')

const startProxy = require('../src/proxy').startProxy

const wrapHandler = (builder) => {
  const origHandler = builder.handler
  builder.handler = (argv) => {
    if (argv.verbose) {
      require('debug').enable('botium*')
    }
    debug(`command options: ${util.inspect(argv)}`)
    origHandler(argv)
  }
  return builder
}

yargsCmd.usage('Botium Whatsapp Business API emulator\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .showHelpOnFail(true)
  .strict(true)
  .demandCommand(1, 'You need at least one command before moving on')
  .env('BOTIUM_WAPROXY')
  .command(wrapHandler({
    command: 'start',
    describe: 'Launch Botium Whatsapp Business API emulator',
    builder: (yargs) => {
      yargs
        .option('port', {
          describe: 'Local port the proxy is listening to (also read from env variable "BOTIUM_WAPROXY_PORT")',
          demandOption: true,
          number: true,
          default: 5000
        })
        .option('endpoint', {
          describe: 'Whatsapp Business API Endpoint (also read from env variable "BOTIUM_WAPROXY_ENDPOINT")',
          demandOption: true,
          default: '/'
        })
        .option('redisurl', {
          describe: 'Redis connection url (also read from env variable "BOTIUM_WAPROXY_REDISURL")'
        })
    },
    handler: startProxy
  }))
  .option('verbose', {
    alias: 'v',
    describe: 'Enable verbose output (also read from env variable "BOTIUM_WAPROXY_VERBOSE" - "1" means verbose)',
    default: false
  })
  .argv
