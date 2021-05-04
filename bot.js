require('dotenv').config()
const api = require('./src/api');
const { secondsTo } = require('./src/util/time');
const { calcBreakeven, hasOrderSuccessfullyFilled, calcStoplossTriggerPrice } = require('./src/order');
const { calculateMA, recursiveEMAStep, calculateEMA, } = require('./src/metrics');
// const marketId = 'DOGE/USD';
const marketId = 'DOGE-PERP';
const subaccount = 'BOT-1';

let trade = {};

// TODO
// - Git
// - Firebase trade saving
// XXXX
// ON MA 100/200 thats on a downward trend - immediantly take profit
// on new candle that's above breakeven. On upward trend can be more liberal.
// XXXX
// Also could hold off selling on the next candle to instead sell on the next subsequent candle
// where the open price was higher then the previous candle's close price. IE Immeidantly
// after having a read candle. This would let the bot take advantage of any green candle streaks.
// XXXXX
// When not in a trade. Bot should scout out other markets for any other EMA crosses to
// capitalise on.
// XXXXXX
// ERROR HANDLING
// XXXXXX
// Calculate funding rate into PnL
// XXXXXX
// Use Jest - test individual parts and maybe even FTXs api but defininetly MA and EMA functions.
// XXXXXXX
// Could chart bots performances against one another from Firebase. Overlay them
// and overlay them over the respective markets as well and see if any market trends
// make certain bots more performant then at other times.
// XXXXXXX
// LINITING
// XXXXXXX
// XXXXXXX
// Typescript
// XXXXXXX



// function recursiveHistoricalEMAStep(data, previousMA, smoothing, step, num) {
//   if (step < data.length) {
//     const ema = data[step].close * smoothing + previousMA * (1 - smoothing);
//     console.log(num, data.length, step)
//     if (num >= data.length - step) {
//       return [...recursiveHistoricalEMAStep(data, ema, smoothing, step + 1, num), { time: data[step].time, ema: ema }];
//     } else {
//       return recursiveHistoricalEMAStep(data, ema, smoothing, step + 1, num);
//     }
//   } else {
//     return [];

//   }
// }

// function calculateHistoricalEMA(data, observations, num) {
//   // Smoothing / Weighting
//   const smoothing = 2 / (observations + 1);
//   const initMA = calculateMA(data.slice(data.length - num - (observations * 2) + 1, data.length - num - observations + 1));
//   return recursiveHistoricalEMAStep(data.slice(data.length - observations), initMA, smoothing, 0, num);
// }

async function hasEMACrossed(marketId, timeframe) {
  const historicalData = await api.getHistoricalPrices(marketId, timeframe);
  // Use marketData for more frequently updated current price.
  const marketData = await api.getMarket(marketId);

  const data = [...historicalData.slice(0, historicalData.length - 1), ...[{ close: marketData.price }]];
  // console.log('MA', calculateMA(data.slice(data.length - 21)));
  // console.log(historicalData[historicalData.length - 1].close, marketData.price)
  // console.log('data', data)

  const previousLongEMA = calculateEMA(historicalData.slice(0, historicalData.length - 1), 21);
  const previousShortEMA = calculateEMA(historicalData.slice(0, historicalData.length - 1), 10);
  // const currentLongEMA = calculateEMA(historicalData.slice(0), 21);
  // const currentShortEMA = calculateEMA(historicalData.slice(0), 10);
  const currentLongEMA = calculateEMA(data, 21);
  const currentShortEMA = calculateEMA(data, 10);

  if (Math.sign(previousLongEMA - previousShortEMA) !== Math.sign(currentLongEMA - currentShortEMA)) {
    console.log("CROSSED");
    if (Math.sign(currentLongEMA - currentShortEMA) === 1) {
      console.log('GO LONG');
      return 'long';
    } else {
      console.log('GO SHORT');
      return 'short';
    }
  }
  return;
}

async function findStoplossOrder(subaccount, marketId, stoplossOrderId) {
  const openTriggerOrders = await api.getOpenTriggerOrders(subaccount, marketId);
  return openTriggerOrders.find(order => order.id === stoplossOrderId);
}

// Cancel orders left on a trade.
async function cancelAllTradeOrders(trade) {
  const orderHistory = await api.getOrderHistory(trade.subaccount, trade.marketId);
  const triggerOrderHistory = await api.getTriggerOrderHistory(trade.subaccount, trade.marketId);

  if (trade.orderId) {
    const order = orderHistory.find(order => order.id === trade.orderId);
    if (order.status === 'new' || order.status === 'open') {
      await api.cancelOrder(order.id);
    }
  }

  if (trade.stoplossOrderId) {
    const order = triggerOrderHistory.find(order => order.id === trade.stoplossOrderId);
    if (order.status === 'open') {
      await api.cancelOpenTriggerOrder(order.id);
    }
  }

  if (trade.closeOrderId) {
    const order = orderHistory.find(order => order.id === trade.closeOrderId);
    if (order.status === 'new' || order.status === 'open') {
      await api.cancelOrder(order.id);
    }
  }
}


async function startNewTrade() {
  // const emaCross = await hasEMACrossed(marketId, secondsTo(15, 'minutes'));
  // console.log('cross?', emaCross);

  const emaCross = "long";
  if (emaCross) {
    // const openOrders = await api.getOpenOrders(subaccount);
    // console.log(openOrders);

    const openOrders = await api.getOpenOrders(subaccount);

    if (openOrders.length === 0) {
      // await startTrade(marketId, emaCross === 'long' ? 'buy' : 'sell', price, volume, subaccount);

      const marketData = await api.getMarket(marketId);
      console.log(marketData);

      if (emaCross === 'short' && marketData.type === 'spot') {
        return;
      }



      const accountData = await api.getAccount(subaccount);

      const balances = await api.getBalances(subaccount);
      console.log(accountData, balances)
      const usdBalance = balances.find(balance => balance.coin === marketData.quoteCurrency);


      const price = marketData.price;
      let volume;
      if (marketData.type === 'spot') {
        if (!usdBalance) {
          throw new Error('Missing USD balance when attempting to open a trade.');
        }
        volume = Math.floor(usdBalance.free / price);
      } else if (marketData.type === 'future') {
        volume = Math.floor(accountData.freeCollateral / price);
      }



      console.log('Order price', price)
      console.log('Order volume', volume)


      // try {
      const order = await api.placeOrder(subaccount, {
        "market": 'marketId',
        "side": emaCross === 'long' ? 'buy' : 'sell',
        "price": price,
        "type": "limit",
        "size": volume,
        "reduceOnly": false,
        "ioc": false,
        "postOnly": false,
        "clientId": null
      }).catch(error => {
        console.log(error.message);
      })
      // } catch (err) {
      //   console.log('ERROR', err.message);
      // }

      return {
        orderId: order.id,
        status: 'pending',
        positionType: emaCross === 'long' ? 'long' : 'short',
        breakeven: breakeven,
        timeOfOrder: new Date().getTime(),
        coin: marketData.baseCurrency,
        currency: marketData.quoteCurrency,
        subaccount: subaccount,
        marketId: marketId,
        marketType: marketData.type,
      }
    }
  }
}


async function runInterval() {
  console.log('=== interval ===');

  if (!trade.status) {
    try {
      trade = await startNewTrade();
    } catch (error) {
      console.log('Error found in starting a new trade.');
      console.log(error);
    }
  } else if (trade.status === 'pending') {
    const fillOrder = await api.getOrderStatus(subaccount, trade.orderId);
    // Check to see if trade has been filled.
    if (hasOrderSuccessfullyFilled(fillOrder)) {
      console.log("SETTING STOP LOSS")
      // Set stoploss
      const triggerPrice = calcStoplossTriggerPrice(fillOrder.avgFillPrice, fillOrder.side, 0.75);

      const stoplossOrder = await api.placeConditionalOrder(subaccount, {
        market: marketId,
        side: fillOrder.side === 'buy' ? 'sell' : 'buy',
        size: fillOrder.size,
        type: 'stop',
        reduceOnly: trade.marketType === 'future' ? true : false,
        retryUntilFilled: true,
        triggerPrice: triggerPrice,
      })
      // XXXX THIS EMERGENCY CHECK PROBABLY DOESN'T WORK -> IF API ERRORS OUT
      // IT'LL STILL RETURN SOMETHING THAT MIGHT RESULT IN UNEXPECTED CONCEQUENCES.
      // If can't set stop loss close trade at market value. Need to wrap above in
      // try catch and react to that with this.
      if (!stoplossOrder.id) {
        console.log('Oh shit cant set stoploss');
        const closeOrder = await api.placeOrder(subaccount, {
          market: trade.marketId,
          side: trade.positionType === 'long' ? 'sell' : 'buy',
          price: null,
          type: "market",
          size: openOrder.size,
          reduceOnly: trade.marketType === 'future' ? true : false,
          ioc: false,
          postOnly: false,
          clientId: null
        });

        if (closeOrder.id) {
          // If can't set stop loss close trade at market value
          trade = {};
        }
      } else {

        trade.status = 'filled';
        trade.stoplossOrderId = stoplossOrder.id;

        // const account = await api.getAccount(subaccount);
        // const balances = await api.getBalances(subaccount);
        // const coinBalance = balances.find(coin => coin.coin === trade.coin);
        // console.log(balances, coinBalance);
      }
    } else if (fillOrder.status === 'open') {
      const marketData = await api.getMarket(marketId);
      const cancelOrderPriceDeviation = fillOrder.price * (0.75 / 100);
      // Cancel open order if market moves away from the buy order too much.
      if (fillOrder.side === 'buy' && fillOrder.price + cancelOrderPriceDeviation < marketData.price) {
        await api.cancelOrder(fillOrder.id);
      }
    }
  } else if (trade.status === 'closed') {
    const openOrder = await api.getOrderStatus(subaccount, trade.orderId)
    // try {
    const openStoplossOrder = await findStoplossOrder(subaccount, trade.marketId, trade.stoplossOrderId)
    // } catch(err) {

    // }

    // Check if its hit stop loss
    if (openStoplossOrder.id) {
      const historicalPrices = await api.getHistoricalPrices(trade.marketId, secondsTo(15, 'minutes'));
      console.log("HP", trade.timeOfOrder, new Date(openStoplossOrder.createdAt).getTime(), historicalPrices[historicalPrices.length - 2]);
      if (trade.timeOfOrder < new Date(historicalPrices[historicalPrices.length - 1].startTime).getTime()) {
        console.log('Looking for profit');
        const marketData = await api.getMarket(trade.marketId);
        const takeProfitPercentage = openOrder.avgFillPrice * (0.2 / 100);
        console.log(marketData.price, trade.breakeven + takeProfitPercentage)
        if (marketData.price > trade.breakeven + takeProfitPercentage) {
          console.log('TAKING PROFIT');
          const order = await api.placeOrder(subaccount, {
            market: trade.marketId,
            side: trade.positionType === 'long' ? 'sell' : 'buy',
            price: marketData.price,
            type: "limit",

            // Do a search of order histories and locate the buy order!!!!
            // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!
            size: openStoplossOrder.size,
            // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!

            reduceOnly: trade.marketType === 'future' ? true : false,
            ioc: false,
            postOnly: false,
            clientId: null
          });
          trade.status = 'closing';
          trade.closeOrderId = order.id;
        }
      }
    } else {
      console.log('HIT STOPLOSS');
      // Reset trade object.
      trade = {};
    }
  } else if (trade.status === 'closing') {
    const orderHistory = await api.getOrderHistory(trade.subaccount, trade.marketId)
    const closeOrder = orderHistory.find(order => order.id === trade.closeOrderId);
    const openStoplossOrder = await findStoplossOrder(subaccount, trade.marketId, trade.stoplossOrderId)

    // If close order can't be found. Then profit was taken.
    if (closeOrder && closeOrder.status === 'closed') {
      console.log('PROFIT TAKEN - TRADE CLOSED');

      // Cleanup remaining trade orders.
      await cancelAllTradeOrders(trade);
      // Reset trade object.
      trade = {};
      // If open stoploss isn't found then stoploss was hit.
    } else if (!openStoplossOrder) {
      console.log('HIT STOPLOSS');
      // Cleanup remaining trade orders.
      await cancelAllTradeOrders(trade);
      // Reset trade object.
      trade = {};
    }
  }
}

async function runBot() {
  runInterval();
  setInterval(runInterval, 15000)
}

runBot();