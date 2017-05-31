### [Node.js Poloniex API](https://github.com/warren-bank/node-poloniex-api)

Node.js Client Library for the Poloniex (poloniex.com) API

This is an asynchronous Promise-based Node.js client for the poloniex.com API.

#### Installation:

```bash
npm install --save @warren-bank/node-poloniex-api
```

#### Usage:

* class constructor:
  * input: `api_key` (required), `api_secret` (required), `config` (optional: `{agent, timeout}`)
* `api()` method:
  * input: `method` (required), `params` (varies by method)<br>
    where: `method` is one of the following values (as specified in the [official API docs](https://poloniex.com/support/api/) ):
    * public:
      * 'returnTicker', `{}`
      * 'return24hVolume', `{}`
      * 'returnOrderBook', `{currencyPair, depth}`
      * 'returnTradeHistory', `{currencyPair, start, end}`
      * 'returnChartData', `{currencyPair, period, start, end}`
      * 'returnCurrencies', `{}`
      * 'returnLoanOrders', `{currency, limit}`
    * private:
      * 'returnBalances', `{}`
      * 'returnCompleteBalances', `{account}`
      * 'returnDepositAddresses', `{}`
      * 'generateNewAddress', `{currency}`
      * 'returnDepositsWithdrawals', `{start, end}`
      * 'returnOpenOrders', `{currencyPair}`
      * 'returnMyTradeHistory', `{currencyPair, start, end}`
      * 'returnOrderTrades', `{orderNumber}`
      * 'buy', `{currencyPair, rate, amount, fillOrKill, immediateOrCancel, postOnly}`
      * 'sell', `{currencyPair, rate, amount, fillOrKill, immediateOrCancel, postOnly}`
      * 'cancelOrder', `{orderNumber}`
      * 'moveOrder', `{orderNumber, rate, amount, immediateOrCancel, postOnly}`
      * 'withdraw', `{currency, amount, address}`
      * 'returnFeeInfo', `{}`
      * 'returnAvailableAccountBalances', `{account}`
      * 'returnTradableBalances', `{}`
      * 'transferBalance', `{currency, amount, fromAccount, toAccount}`
      * 'returnMarginAccountSummary', `{}`
      * 'marginBuy', `{currencyPair, rate, amount, lendingRate}`
      * 'marginSell', `{currencyPair, rate, amount, lendingRate}`
      * 'getMarginPosition', `{currencyPair}`
      * 'closeMarginPosition', `{currencyPair}`
      * 'createLoanOffer', `{currency, amount, duration, autoRenew, lendingRate}`
      * 'cancelLoanOffer', `{orderNumber}`
      * 'returnOpenLoanOffers', `{}`
      * 'returnActiveLoans', `{}`
      * 'returnLendingHistory', `{start, end, limit}`
      * 'toggleAutoRenew', `{orderNumber}`
  * output: Promise
* `helper` library methods:
  * `helper.get_ticker(currencyPair)`
    * input: `currencyPair`
    * output: Promise
    * behavior:
      * call `api('returnTicker')`
      * filter response hash table by key: `currencyPair`
      * return filtered hash table
  * `helper.get_trading_pairs()`
    * input:
    * output: Promise
    * behavior:
      * call `api('returnTicker')`
      * return array of keys in response hash table
  * `helper.get_total_balance(currency)`
    * input: currency
    * output: Promise
    * behavior:
      * call `api('returnBalances')`
      * call `api('returnTicker')`
      * for each coin having a balance:
        * add to sum: value of coin in `currency`, based on its current ticker price
        * call `api('returnOpenOrders', {currencyPair})`
        * for each open order:
          * add to sum: the value of the order in `currency`
      * return sum
  * `helper.get_total_btc_balance()`
    * input:
    * output: Promise
    * behavior:
      * call `helper.get_total_balance('BTC')`
  * `helper.get_total_eth_balance()`
    * input:
    * output: Promise
    * behavior:
      * call `helper.get_total_balance('ETH')`

#### Example:

```javascript
const PoloniexClient = require('@warren-bank/node-poloniex-api')
const poloniex = new PoloniexClient('api_key', 'api_secret', {timeout: 10000})

// Public API method: Get Ticker Info
poloniex.api('returnTicker')
.then((result) => {
  console.log('Ticker:', result)
})
.catch((error) => {
  console.log('Error:', error.message)
})

// Private API method: Display User's Balances
poloniex.api('returnBalances')
.then((result) => {
  console.log('Balances:', result)
})
.catch((error) => {
  console.log('Error:', error.message)
})
```

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
