// -----------------------------------------------
// Node.js wrapper for the Poloniex.com API
// -----------------------------------------------
// docs:
// https://poloniex.com/support/api/
// -----------------------------------------------

const crypto = require('crypto')
const https = require('https')
const url = require('url')

var Poloniex = function(api_key, api_secret){
  var HMAC_SHA512, nonce, send_POST_request, send_GET_request, $poloniex

  var public_url = 'https://poloniex.com/public'

  HMAC_SHA512 = function(POST_str){
    var hmac, signed
    hmac = crypto.createHmac("sha512", api_secret)
    signed = hmac.update(new Buffer(POST, 'utf-8')).digest("base64")
    return signed
  }

  nonce = new (function() {
    this.generate = function() {
      var now = Date.now();
      this.counter = (now === this.last? this.counter + 1 : 0);
      this.last    = now;

      // add padding to nonce
      var padding = 
        this.counter < 10   ? '000' :
        this.counter < 100  ?  '00' :
        this.counter < 1000 ?   '0' : ''

      return (now + padding + this.counter)
    };
  })()

  send_POST_request = function(POST_hash){
    return new Promise((resolve, reject) => {
      var key, POST_str, options

      if (! POST_hash) POST_hash = {}
      POST_hash['nonce'] = nonce.generate()

      POST_str = []
      for (key in POST_hash){
        POST_str.push(`${key}=${POST_hash[key]}`)
      }
      POST_str = POST_str.join('&')

      options = {
        hostname: 'poloniex.com',
        port: 443,
        path: '/tradingApi',
        method: 'POST',
        headers: {
          Key: api_key,
          Sign: HMAC_SHA512(POST_str),
          "User-Agent": `Mozilla/4.0 (compatible; Poloniex Node.js bot; ${process.platform}; Node.js/${process.version})`
        },
        agent: false
      }

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
              throw new Error(data.error)
            }
            else {
              resolve(data)
            }
          });
        })

        req.on('error', (e) => {
          throw e
        })

        req.write(POST_str)
        req.end()
      }
      catch(error){
        reject(error)
      }
    })
  }

  send_GET_request = function($URL){
    return new Promise((resolve, reject) => {
      var options

      options = Object.assign({}, url.parse($URL), {
        method: 'GET',
        headers: {
          "User-Agent": `Mozilla/4.0 (compatible; Poloniex Node.js bot; ${process.platform}; Node.js/${process.version})`
        },
        agent: false
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
              throw new Error(data.error)
            }
            else {
              resolve(data)
            }
          });
        })

        req.on('error', (e) => {
          throw e
        })

        req.end()
      }
      catch(error){
        reject(error)
      }
    })
  }

  $poloniex = {

    "get_balances": function(){
      return send_POST_request({
        "command": "returnBalances"
      })
    },

    "get_open_orders": function(pair){
      return send_POST_request({
        "command": "returnOpenOrders",
        "currencyPair": pair.toUpperCase()
      })
    },

    "get_my_trade_history": function(pair){
      return send_POST_request({
        "command": "returnTradeHistory",
        "currencyPair": pair.toUpperCase()
      })
    },

    "buy": function(pair, rate, amount){
      return send_POST_request({
        "command": "buy",
        "currencyPair": pair.toUpperCase(),
        "rate": rate,
        "amount": amount
      })
    },

    "sell": function(pair, rate, amount){
      return send_POST_request({
        "command": "sell",
        "currencyPair": pair.toUpperCase(),
        "rate": rate,
        "amount": amount
      })
    },

    "cancel_order": function(pair, order_number){
      return send_POST_request({
        "command": "cancelOrder",
        "currencyPair": pair.toUpperCase(),
        "orderNumber": order_number
      })
    },

    "withdraw": function(currency, amount, address){
      return send_POST_request({
        "command": "withdraw",
        "currency": currency.toUpperCase(),
        "amount": amount,
        "address": address
      })
    },

    "get_trade_history": function(pair){
      var $URL = `${public_url}?command=returnTradeHistory&currencyPair=${pair.toUpperCase()}`
      return send_GET_request($URL)
    },

    "get_order_book": function(pair){
      var $URL = `${public_url}?command=returnOrderBook&currencyPair=${pair.toUpperCase()}`
      return send_GET_request($URL)
    },

    "get_volume": function(){
      var $URL = `${public_url}?command=return24hVolume`
      return send_GET_request($URL)
    },

    "get_ticker": function(pair){
      var $URL = `${public_url}?command=returnTicker`
      return send_GET_request($URL)
      .then((data) => {
        pair = pair ? pair.toUpperCase() : 'ALL'
        if (data && (pair === 'ALL')){
          return data
        }
        else {
          return (data && data[pair]) ? data[pair] : {}
        }
      })
    },

    "get_trading_pairs": function(){
      var $URL = `${public_url}?command=returnTicker`
      return send_GET_request($URL)
      .then((data) => {
        return data ? Object.keys(data) : []
      })
    },

    "get_total_balance": function(currency){
      var balances, prices

      if (! currency) return Promise.reject(new Error('"get_total_balance(currency)" called with missing parameter: "currency"'))

      currency = currency.toUpperCase()

      return $poloniex.get_balances()
      .then((_balances) => {
        balances = _balances ? _balances : {}

        return $poloniex.get_ticker()
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
            promises.push($poloniex.get_open_orders(pair))
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
      return $poloniex.get_total_balance('BTC')
    },

    "get_total_eth_balance": function(){
      return $poloniex.get_total_balance('ETH')
    }

  }

  return $poloniex
}

module.exports = Poloniex
