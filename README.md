### [Node.js Poloniex API](https://github.com/warren-bank/node-poloniex-api)

Node.js Client Library for the Poloniex (poloniex.com) API

This is an asynchronous Promise-based Node.js client for the poloniex.com API.

#### Installation:

```bash
npm install --save @warren-bank/node-poloniex-api
```

#### Usage:

* factory function:
  * input: `api_key` (required), `api_secret` (required)
* methods (as specified in the [official API docs](https://poloniex.com/support/api/) ):
  * public:
    * 'get_trade_history'
    * 'get_order_book'
    * 'get_volume'
    * 'get_ticker'
    * 'get_trading_pairs'
  * private:
    * 'get_balances'
    * 'get_open_orders'
    * 'get_my_trade_history'
    * 'buy'
    * 'sell'
    * 'cancel_order'
    * 'withdraw'
    * 'get_total_btc_balance'
  * output: Promise

#### Example:

```javascript
const Poloniex = require('@warren-bank/node-poloniex-api')
const API = Poloniex('api_key', 'api_secret')

// Public API method: Get Ticker Info
API.get_ticker('BTC_ETH')
.then((result) => {
  console.log('Ticker (BTC_ETH):', result)
})
.catch((error) => {
  console.log('Error:', error.message)
})

// Private API method: Display user's balance
API.get_balances()
.then((result) => {
  console.log('Balance:', result)
})
.catch((error) => {
  console.log('Error:', error.message)
})
```

#### Credits:

* The [PHP](https://pastebin.com/iuezwGRZ) client library was used for reference

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPLv2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
