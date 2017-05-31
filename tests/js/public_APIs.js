#!/usr/bin/env node

const Poloniex = require('../../poloniex')

const API = Poloniex('my_key', 'my_secret')

// public API methods

const pair = 'BTC_ETH'

API.get_trade_history(pair)
.then((data) => {
  console.log("\n\n", `Trade History (${pair}):`, "\n", data)
})

API.get_order_book(pair)
.then((data) => {
  console.log("\n\n", `Order Book (${pair}):`, "\n", data)
})

API.get_ticker(pair)
.then((data) => {
  console.log("\n\n", `Ticker (${pair}):`, "\n", data)
})

API.get_volume()
.then((data) => {
  console.log("\n\n", 'Volume:', "\n", data)
})

API.get_trading_pairs()
.then((data) => {
  console.log("\n\n", 'Trading Pairs:', "\n", data)
})
