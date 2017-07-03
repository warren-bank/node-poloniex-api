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
    return new Poloniex(api_key, api_secret, opt)
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

  var HMAC_SHA512, nonce, send_POST_request, send_GET_request, api, helper

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
          "Content-Length": Buffer.byteLength(POST_data, 'utf8'),
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
            try {
              data = JSON.parse(data)
            }
            catch(error) {
              error.code = 'JSON-PARSE'
              error.api_response = data
              return reject(error)
            }
            if (data && data.error){
              return reject(new Error(data.error))
            }
            resolve(data)
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
            try {
              data = JSON.parse(data)
            }
            catch(error) {
              error.code = 'JSON-PARSE'
              error.api_response = data
              return reject(error)
            }
            if (data && data.error){
              return reject(new Error(data.error))
            }
            resolve(data)
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

  helper = {

    "get_ticker": function(currencyPair){
      if (! currencyPair) return Promise.reject(new Error('"get_ticker(currencyPair)" called with missing parameter: "currencyPair"'))

      return self.api('returnTicker')
      .then((data) => {
        if (! data){
          throw new Error('server response is empty')
        }
        else if (data[currencyPair]) {
          return data[currencyPair]
        }
        else {
          throw new Error(`server response does not contain currencyPair: ${currencyPair}`)
        }
      })
    },

    "get_trading_pairs": function(){
      return self.api('returnTicker')
      .then((data) => {
        if (! data){
          throw new Error('server response is empty')
        }
        else {
          return Object.keys(data)
        }
      })
    },

    "get_total_balance": function(currency){
      if (! currency) return Promise.reject(new Error('"get_total_balance(currency)" called with missing parameter: "currency"'))

      var balances, prices

      currency = currency.toUpperCase()

      return self.api('returnBalances')
      .then((_balances) => {
        balances = _balances ? _balances : {}

        return self.api('returnTicker')
      })
      .then((_prices) => {
        prices = _prices ? _prices : {}
      })
      .then(() => {
        var total_balance, promises, pairs, coin, amount, pair, open_orders, order
        var i, j

        total_balance = 0
        promises = []
        pairs = []
        for (coin in balances){
          amount = balances[coin]
          coin = coin.toUpperCase()
          pair = `${currency}_${coin}`

          // convert coin balances to btc value
          if (amount > 0){
            if ((coin !== currency) && (prices[pair])){
              total_balance += (amount * prices[pair])
            }
            else if (coin === currency){
              total_balance += amount
            }
          }

          // process open orders
          if (coin !== currency){
            promises.push(
              self.api('returnOpenOrders', {currencyPair: pair})
            )
            pairs.push(pair)
          }

        }

        if (promises.length === 0){
          return total_balance
        }
        else {
          return Promise.all(promises)
          .then((all_open_orders) => {
            for (i=0; i<all_open_orders.length; i++){
              pair = pairs[i]
              open_orders = all_open_orders[i]
              for (j=0; j<open_orders.length; j++){
                order = open_orders[j]
                if (order['type'] === 'buy'){
                  total_balance += order['total']
                }
                else if ((order['type'] === 'sell') && (prices[pair])){
                  total_balance += (order['amount'] * prices[pair])
                }
              }
            }
            return total_balance
          })
        }

      })
    },

    "get_total_btc_balance": function(){
      return self.helper.get_total_balance('BTC')
    },

    "get_total_eth_balance": function(){
      return self.helper.get_total_balance('ETH')
    }

  }

  self.api = api
  self.helper = helper
}

module.exports = Poloniex
