import * as dotenv from 'dotenv';
dotenv.config();
import api from './api';
import { secondsTo } from './utils/time';
import {
  hasOrderSuccessfullyFilled,
  calcStoplossTriggerPrice,
  hasPriceDeviatedFromBidOrder,
  cancelAllTradeOrders,
  calcSellPrice,
  Side,
} from './order';
import { calculateEMA } from './metrics';
import config, { Subaccount } from './config';
import { Trade } from './Trade';

// TODO
// - Firebase trade saving
// XXXX
// ON MA 100/200 thats on a downward trend - immediantly take profit
// on new candle that's above breakeven. On upward trend can be more liberal.
// XXXX
// Also could hold off selling on the next candle to instead sell on the next subsequent candle
// where the open price was higher then the previous candle's close price. IE Immeidantly
// after having a read candle. This would let the bot take advantage of any green candle streaks.
// XXXXX
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
// Use CRON to restart server after crash and do any cleanup before switching off for me
// to later bug fix.
// XXXXXXX
// Consider taking profit after a certain percentage even if new candle hasn't started.
// Ie after 0.6%. OTherwise I tend to get 0.4%s only.
// XXXXXXX
// Consider preventing getting straight back into a trade in the same market that was just sold
// Especially if I implement take profit 0.6% automatically from above.
// XXXXXXX
// Consider instead of using percentage to set stoploss to instead shift it to just above/below
// previous candle. It would have prevented the ZIL-PERP stoploss hit losing 12 cents
// which otherwise would have been a good profit if it was left to run down. This might also be necessary
// for markets with more volatility despite volatitly having no impact on chart movement
// and ema predictions that the candles will move in a particular direction overall.
// XXXXXXX
// NEed a fallback plan for when ftx goes down for maintainence. How do I even detect
// that it's down for maintainence.
// -
// MAYBE RESPONSE COMES BACK WITH AN ERROR CODE STATUS I COULD USE!!!!
// -
// Could store current trade data in a database so I can retreive it on a CRON server restart.
// XXXXXX
// Manually translate what's returned from FTX into typed interfaces rather then assume
// FTX is giving me the correct data now and for always. This can happen because I'm using
// the 'any' type definintion on what's returned from apis which is fine but throws a risk
// that the data I working with in the app might be bad.
// XXXXXX

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

async function hasEMACrossedInMarket(marketId: string, timeframe: number) {
  const historicalData = await api.getHistoricalPrices(marketId, timeframe);
  // Use marketData for more frequently updated current price.
  const marketData = await api.getMarket(marketId);

  const data = [
    ...historicalData.slice(0, historicalData.length - 1),
    ...[{ close: marketData.price }],
  ];
  // console.log('MA', calculateMA(data.slice(data.length - 21)));
  // console.log(historicalData[historicalData.length - 1].close, marketData.price)
  // console.log('data', data)

  const previousLongEMA = calculateEMA(
    historicalData.slice(0, historicalData.length - 1),
    21,
  );
  const previousShortEMA = calculateEMA(
    historicalData.slice(0, historicalData.length - 1),
    10,
  );
  // const currentLongEMA = calculateEMA(historicalData.slice(0), 21);
  // const currentShortEMA = calculateEMA(historicalData.slice(0), 10);
  const currentLongEMA = calculateEMA(data, 21);
  const currentShortEMA = calculateEMA(data, 10);
  console.log(
    Math.sign(previousLongEMA - previousShortEMA),
    Math.sign(currentLongEMA - currentShortEMA),
    Math.floor((currentLongEMA - currentShortEMA) * 100000),
  );
  // console.log(Math.sign(previousLongEMA - previousShortEMA), Math.sign(currentLongEMA - currentShortEMA));
  if (
    Math.sign(previousLongEMA - previousShortEMA) !==
    Math.sign(currentLongEMA - currentShortEMA)
  ) {
    console.log('CROSSED');
    if (Math.sign(currentLongEMA - currentShortEMA) === 1) {
      console.log('GO SHORT');
      return 'short';
    } else {
      console.log('GO LONG');
      return 'long';
    }
  }
  return;
}

// If can't find stoploss order. Returns undefined.
async function getTriggerOrder(
  subaccount: Subaccount,
  marketId: string,
  orderId: string,
) {
  const triggerOrders = await api.getTriggerOrderHistory(subaccount, marketId);
  return triggerOrders.find((order) => order.id === orderId);
}

async function isStoplossTriggered(
  subaccount: Subaccount,
  marketId: string,
  stoplossOrderId: string,
) {
  const stoplossOrder = await getTriggerOrder(
    subaccount,
    marketId,
    stoplossOrderId,
  );
  return stoplossOrder && stoplossOrder.status === 'triggered';
}

interface TradeOpportunity {
  marketId: string;
  side: Side;
  price: number;
}
async function findTradeOpportunity(
  subaccount: Subaccount,
): Promise<TradeOpportunity | undefined> {
  const marketIds = config[subaccount].markets;

  // XXX TODO: Need to check that account has enough money to buy smallest amount
  // of coin.

  for (const marketId of marketIds) {
    console.log(`Checking market ${marketId}`);

    const emaCross = await hasEMACrossedInMarket(
      marketId,
      secondsTo(15, 'minutes'),
    );

    if (emaCross) {
      console.log(`Found EMA cross '${emaCross}' in market ${marketId}.`);
      const marketData = await api.getMarket(marketId);

      // Can't short a spot market.
      if (emaCross === 'short' && marketData.type === 'spot') {
        return;
      }

      return {
        marketId: marketId,
        side: emaCross === 'long' ? 'buy' : 'sell',
        price: marketData.price,
      };
    }
  }
}

async function startNewTrade(
  subaccount: Subaccount,
  marketId: string,
  side: Side,
  price: number,
): Promise<Trade | undefined> {
  console.log('or here');
  const openOrders = await api.getOpenOrders(subaccount);
  console.log(openOrders);
  if (openOrders.length === 0) {
    console.log('or are we');
    const marketData = await api.getMarket(marketId);
    const accountData = await api.getAccount(subaccount);
    const balances = await api.getBalances(subaccount);
    const usdBalance = balances.find(
      (balance) => balance.coin === marketData.quoteCurrency,
    );

    let volume;

    console.log('we in');

    if (marketData.type === 'spot') {
      if (!usdBalance) {
        throw new Error('Missing USD balance when attempting to open a trade.');
      }
      volume = Math.floor(usdBalance.free / price);
    } else if (marketData.type === 'future') {
      volume = Math.floor(accountData.freeCollateral / price);
    }

    if (!volume || volume <= 1) {
      console.log('ERROR - NOT ENOUGH MONEY FOR TRADE');
      return;
    }

    const order = await api
      .placeOrder(subaccount, {
        market: marketId,
        side: side,
        price: price,
        type: 'limit',
        size: volume,
        reduceOnly: false,
        ioc: false,
        postOnly: false,
        clientId: null,
      })
      .catch((error) => {
        error.message = `Error placing order. ${error.message}`;
        throw error;
      });

    console.log(
      `New ${
        side === 'buy' ? 'LONG' : 'SHORT'
      } trade started for market ${marketId}.`,
    );
    console.log(`Bid size set for ${volume} at $${price}.`);

    // const trade = new Trade();
    console.log('here');
    return {
      orderId: order.id,
      status: 'pending',
      positionType: side === 'buy' ? 'long' : 'short',
      side: side,
      timeOfOrder: new Date().getTime(),
      coin: marketData.baseCurrency,
      currency: marketData.quoteCurrency,
      subaccount: subaccount,
      marketId: marketId,
      marketType: marketData.type,
    };
  }
}

async function runInterval(
  subaccount: Subaccount,
  trade: Trade | undefined,
): Promise<Trade | undefined> {
  console.log(`=== Polling FTX | ${new Date().toISOString()} ===`);

  if (!trade || !trade.status) {
    const tradeOpportunity = await findTradeOpportunity(subaccount);

    if (tradeOpportunity) {
      console.log(tradeOpportunity);
      trade = await startNewTrade(
        subaccount,
        tradeOpportunity.marketId,
        tradeOpportunity.side,
        tradeOpportunity.price,
      ).catch((error) => {
        throw error;
      });

      console.log(trade);
    }
  } else if (trade.status === 'pending' && trade.orderId) {
    const fillOrder = await api.getOrderStatus(trade.subaccount, trade.orderId);

    // XXXX  looks like hasOrderSuccessfullyFilled(fillOrder) return true after an
    // order was cancelled due to market price deviating away from bid.
    // placeConditionalOrder return error 'Negative trigger price'

    // Check to see if trade has been filled.
    console.log(fillOrder, hasOrderSuccessfullyFilled(fillOrder));
    if (hasOrderSuccessfullyFilled(fillOrder)) {
      console.log(`Trade order has been filled for market ${trade.marketId}.`);
      console.log(
        `Filled ${fillOrder.filledSize} with average fill price of $${fillOrder.avgFillPrice}.`,
      );

      // Set stoploss
      const triggerPrice = calcStoplossTriggerPrice(
        fillOrder.avgFillPrice,
        fillOrder.side,
        config[subaccount].stoplossDeviation,
      );

      const stoplossOrder = await api.placeConditionalOrder(trade.subaccount, {
        market: trade.marketId,
        side: fillOrder.side === 'buy' ? 'sell' : 'buy',
        size: fillOrder.size,
        type: 'stop',
        reduceOnly: trade.marketType === 'future' ? true : false,
        retryUntilFilled: true,
        triggerPrice: triggerPrice,
      });
      console.log(`Stoploss order set at ${triggerPrice}`);

      // XXXX THIS EMERGENCY CHECK PROBABLY DOESN'T WORK -> IF API ERRORS OUT
      // IT'LL STILL RETURN SOMETHING THAT MIGHT RESULT IN UNEXPECTED CONCEQUENCES.
      // If can't set stop loss close trade at market value. Need to wrap above in
      // try catch and react to that with this.
      if (!stoplossOrder.id) {
        console.log('Oh shit cant set stoploss');
        const closeOrder = await api.placeOrder(trade.subaccount, {
          market: trade.marketId,
          side: trade.positionType === 'long' ? 'sell' : 'buy',
          price: null,
          type: 'market',
          size: fillOrder.size,
          reduceOnly: trade.marketType === 'future' ? true : false,
          ioc: false,
          postOnly: false,
          clientId: null,
        });

        // If can't set stop loss close trade at market value
        if (closeOrder.id) {
          trade.status = 'closed';
        }
      } else {
        trade.status = 'filled';
        trade.stoplossOrderId = stoplossOrder.id;
        trade.avgFillPrice = fillOrder.avgFillPrice;
        trade.size = fillOrder.size;
        trade.stoplossTriggerPrice = triggerPrice;
      }
    } else if (fillOrder.status === 'open' && trade.marketId) {
      // Cancel open order if market moves away from the buy order too much.
      const marketData = await api.getMarket(trade.marketId);

      if (
        hasPriceDeviatedFromBidOrder(
          fillOrder.side,
          fillOrder.price,
          marketData.price,
          config[subaccount].cancelBidDeviation,
        )
      ) {
        await api.cancelOrder(trade.subaccount, fillOrder.id);
      }
    }
  } else if (trade.status === 'filled') {
    // Require typescript aborter
    if (
      !trade.stoplossOrderId ||
      !trade.orderId ||
      !trade.timeOfOrder ||
      !trade.avgFillPrice ||
      !trade.size
    ) {
      throw new Error('Something went wrong. Missing required trade data.');
    }
    const openOrder = await api.getOrderStatus(trade.subaccount, trade.orderId);
    const openStoplossOrder = await getTriggerOrder(
      trade.subaccount,
      trade.marketId,
      trade.stoplossOrderId,
    );

    // Check if its hit stop loss
    if (openStoplossOrder && openStoplossOrder.status === 'open') {
      const historicalPrices = await api.getHistoricalPrices(
        trade.marketId,
        secondsTo(15, 'minutes'),
      );
      // XXXX!!!!! if(hasNewCandleStarted) {}
      if (
        trade.timeOfOrder <
        new Date(
          historicalPrices[historicalPrices.length - 1].startTime,
        ).getTime()
      ) {
        console.log('Looking for profit');
        const marketData = await api.getMarket(trade.marketId);
        const accountData = await api.getAccount(trade.subaccount);

        const sellPrice = calcSellPrice(
          trade.side,
          trade.avgFillPrice,
          trade.size,
          config[trade.subaccount].profitDeviation,
          accountData.takerFee,
        );
        console.log(
          'sellPrice',
          trade.side,
          trade.avgFillPrice,
          trade.size,
          config[trade.subaccount].profitDeviation,
          accountData.takerFee,
          sellPrice,
        );
        console.log(marketData.price > sellPrice, marketData.price < sellPrice);

        if (
          trade.side === 'buy'
            ? marketData.price > sellPrice
            : marketData.price < sellPrice
        ) {
          console.log('TAKING PROFIT');
          const order = await api.placeOrder(trade.subaccount, {
            market: trade.marketId,
            side: trade.positionType === 'long' ? 'sell' : 'buy',
            price: marketData.price,
            type: 'limit',

            // Do a search of order histories and locate the buy order!!!!
            // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!
            size: openOrder.size,
            // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!

            reduceOnly: trade.marketType === 'future' ? true : false,
            ioc: false,
            postOnly: false,
            clientId: null,
          });
          trade.status = 'closing';
          trade.closeOrderId = order.id;
        }
      }
    } else {
      console.log('HIT STOPLOSS');
      trade.status = 'closed';
    }
  } else if (trade.status === 'closing') {
    if (!trade || !trade.closeOrderId || !trade.stoplossOrderId) {
      throw new Error('Something went wrong. Missing required trade data.');
    }

    const orderHistory = await api.getOrderHistory(
      trade.subaccount,
      trade.marketId,
    );

    const closeOrder = orderHistory.find((order) => {
      if (trade) {
        return order.id === trade.closeOrderId;
      } else {
        return false;
      }
    });
    const openStoplossOrder = await getTriggerOrder(
      trade.subaccount,
      trade.marketId,
      trade.stoplossOrderId,
    );

    // If close order can't be found. Then profit was taken.
    if (closeOrder && closeOrder.status === 'closed') {
      console.log('PROFIT TAKEN - TRADE CLOSED');
      trade.status = 'closed';
    } else if (openStoplossOrder && openStoplossOrder.status !== 'open') {
      // If open stoploss isn't found then stoploss was hit.
      console.log('HIT STOPLOSS');
      trade.status = 'closed';
    }
  }

  // Cancel remaining trade orders and reset trade object.
  if (trade && trade.status === 'closed') {
    await cancelAllTradeOrders(trade);
    // Reset trade object.
    trade = undefined;
  }
  console.log(`Trade status: ${trade ? trade.status : 'unknown'}`);
  return trade;
}

interface PollConfig {
  fn: () => unknown;
  validate: (result: unknown) => unknown;
  interval: number;
  maxAttempts?: number;
}

const poll = async ({ fn, validate, interval, maxAttempts }: PollConfig) => {
  let attempts = 0;

  const executePoll = async (resolve: any, reject: any) => {
    const result = await fn();
    attempts++;

    if (validate(result)) {
      return resolve(result);
    } else if (maxAttempts && attempts === maxAttempts) {
      return reject(new Error('Exceeded max attempts'));
    } else {
      setTimeout(executePoll, interval, resolve, reject);
    }
  };

  return new Promise(executePoll);
};

async function runBot(subaccount: Subaccount) {
  const POLL_INTERVAL = 5000;

  let trade: Trade | undefined;

  let poll = true;

  // .XXXXXX
  // const pol = async (fn, intervalBetween: number) => {
  //   const executePol = async (resolve: any, reject: any) => {
  //     const result = await fn();

  //     setTimeout(executePoll, intervalBetween, resolve, reject);
  //   };
  //   return new Promise(executePol);
  // };

  while (poll) {
    try {
      // // XXXXCould seperate out to searchMarketForTrade and then manageTrade
      // // as two seperate intervals

      // // XXXXCreate a generic waitfor interval function and move out the interval
      // // is finished check into that.
      trade = await runInterval(subaccount, trade);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      poll = false;
      await criticalErrorCleanup(trade).catch((error) => {
        console.log(error);
        console.log('!!!!!!!!!!!!!!!');
        console.log('FAILED TO CLEANUP AFTER CRITICAL ERROR');
        console.log('TRADES MIGHT STILL BE ACTIVE');
        console.log('!!!!!!!!!!!!!!!');
        throw new Error(error);
      });
      console.log('Successfully cleaned up.');
    }
  }

  // await poll({
  //   fn: () => runInterval(subaccount, trade),
  //   validate: () => false,
  //   interval: POLL_INTERVAL,
  // });

  // .XXXXXX

  // await runInterval(subaccount).catch((error) => {
  //   throw error;
  // });
  // // let trade: Trade | undefined;
  // // XXXXCould seperate out to searchMarketForTrade and then manageTrade
  // // as two seperate intervals

  // // XXXXCreate a generic waitfor interval function and move out the interval
  // // is finished check into that.

  // const pollingInterval = setInterval(async function () {
  //   await runInterval(subaccount).catch((error) => {
  //     clearInterval(pollingInterval);
  //     throw error;
  //   });
  // }, 15000);
}

// An emergency cleanup function to attempt to cleanup any active orders.
// XXXX TODO - WIll not yet try to sell out of any positions!!!! Maybe won't
// need to if I store trades in database. Restarting server can just
// continue from where it left off.
async function criticalErrorCleanup(trade: Trade | undefined) {
  if (trade) {
    await cancelAllTradeOrders(trade);
  }
}

async function main() {
  const subaccount = 'BOT-1';

  try {
    await runBot(subaccount);
  } catch (error) {
    console.error('===== CRITICAL ERROR =====');
    console.error(error);
  }
}

main();
