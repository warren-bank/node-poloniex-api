// -----------------------------------------------
// Node.js wrapper for the Poloniex.com API
// -----------------------------------------------
// docs:
// https://poloniex.com/support/api/
// -----------------------------------------------

const crypto = require('crypto')
const https = require('https')
const url = require('url')
const querystring = require('querystring')

function Poloniex(api_key, api_secret, opt){
  if (! this instanceof Poloniex){
    return new Poloniex(api_key, api_secret)
  }
  var self = this

  var config = Object.assign({},
	{
		// default user-configurable options
		agent: false,
		timeout: 5000
	},
	(opt || {}),
	{
		// values that cannot be changed by user
    urls: {
      public_API: 'https://poloniex.com:443/public',
      trading_API: 'https://poloniex.com:443/tradingApi'
    },
		api_key: api_key,
		api_secret: api_secret
	})

  var HMAC_SHA512, nonce, send_POST_request, send_GET_request, api

  HMAC_SHA512 = function(data){
    var hmac, signed
    hmac = crypto.createHmac("sha512", config.api_secret)
    signed = hmac.update(new Buffer(data, 'utf-8')).digest("base64")
    return signed
  }

  nonce = new (function() {
    this.generate = function() {
      var now = Date.now()
      this.counter = (now === this.last? this.counter + 1 : 0)
      this.last = now

      // add padding to nonce
      var padding =
        this.counter < 10   ? '000' :
        this.counter < 100  ?  '00' :
        this.counter < 1000 ?   '0' : ''

      return (now + padding + this.counter)
    };
  })()

  send_POST_request = function(params){
    return new Promise((resolve, reject) => {
      var POST_data, options

      if (! params) params = {}
      params['nonce'] = nonce.generate()

      POST_data = querystring.stringify(params)

      options = Object.assign({}, url.parse(config.urls.trading_API), {
        method: 'POST',
        headers: {
          Key: config.api_key,
          Sign: HMAC_SHA512(POST_data),
          "User-Agent": `Mozilla/4.0 (compatible; Poloniex Node.js bot; ${process.platform}; Node.js/${process.version})`
        },
        agent: config.agent,
        timeout: config.timeout
      })

      try {
        const req = https.request(options, (res) => {
          var data = ''

          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk
          });
          res.on('end', () => {
            data = JSON.parse(data)
            if (data && data.error){
              reject(new Error(data.error))
            }
            else {
              resolve(data)
            }
          });
        })

        req.on('error', (error) => {
          reject(error)
        })

        req.write(POST_data)
        req.end()
      }
      catch(error){
        reject(error)
      }
    })
  }

  send_GET_request = function(params){
    return new Promise((resolve, reject) => {
      var GET_querystring, GET_url, options

      GET_querystring = params ? querystring.stringify(params) : ''
      GET_url = config.urls.public_API + (params ? ('?' + GET_querystring) : '')

      options = Object.assign({}, url.parse(GET_url), {
        method: 'GET',
        headers: {
          "User-Agent": `Mozilla/4.0 (compatible; Poloniex Node.js bot; ${process.platform}; Node.js/${process.version})`
        },
        agent: config.agent,
        timeout: config.timeout
      })

      try {
        const req = https.request(options, (res) => {
          var data = ''

          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk
          });
          res.on('end', () => {
            data = JSON.parse(data)
            if (data && data.error){
              reject(new Error(data.error))
            }
            else {
              resolve(data)
            }
          });
        })

        req.on('error', (error) => {
          reject(error)
        })

        req.end()
      }
      catch(error){
        reject(error)
      }
    })
  }

  api = function(method, params){
    var methods = {
      public: ['returnTicker', 'return24hVolume', 'returnOrderBook', 'returnTradeHistory', 'returnChartData', 'returnCurrencies', 'returnLoanOrders'],
      private: ['returnBalances', 'returnCompleteBalances', 'returnDepositAddresses', 'generateNewAddress', 'returnDepositsWithdrawals', 'returnOpenOrders', 'returnMyTradeHistory', 'returnOrderTrades', 'buy', 'sell', 'cancelOrder', 'moveOrder', 'withdraw', 'returnFeeInfo', 'returnAvailableAccountBalances', 'returnTradableBalances', 'transferBalance', 'returnMarginAccountSummary', 'marginBuy', 'marginSell', 'getMarginPosition', 'closeMarginPosition', 'createLoanOffer', 'cancelLoanOffer', 'returnOpenLoanOffers', 'returnActiveLoans', 'returnLendingHistory', 'toggleAutoRenew']
    }
    if(methods.public.indexOf(method) !== -1) {
      params = params || {}
      params.command = method
      return send_GET_request(params)
    }
    else if(methods.private.indexOf(method) !== -1) {
      params = params || {}
      params.command = method
      return send_POST_request(params)
    }
    else {
      return Promise.reject(new Error(method + ' is not a valid API method.'))
    }
  }

  self.api = api
}

module.exports = Poloniex
