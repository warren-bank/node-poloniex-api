#!/usr/bin/env node

const PoloniexClient = require('../../poloniex')

const poloniex = new PoloniexClient('my_key', 'my_secret', {timeout: 10000})

// public API methods

const currency = 'BTC'
const currencyPair = 'BTC_ETH'
const now_ms = Date.now()
const now = Math.floor(now_ms / 1000)

var methods, i

const call_API = function(method, params){
  poloniex.api(method, params)
  .then((result) => {
    console.log("\n\n", `[Success] API method "${method}" returned the following response:`, "\n", JSON.stringify(result))
  })
  .catch((error) => {
    console.log("\n\n", `[Error] API method "${method}" produced the following error message:`, "\n", error.message)
  })
}

methods = ['return24hVolume', 'returnCurrencies']
for (i=0; i<methods.length; i++){
  call_API(methods[i])
}

methods = ['returnOrderBook', 'returnTradeHistory']
for (i=0; i<methods.length; i++){
  call_API(methods[i], {currencyPair})
}

// require unique params
call_API('returnLoanOrders', {currency})
call_API('returnChartData', {currencyPair, period:300, start:(now-1200), end:now})
