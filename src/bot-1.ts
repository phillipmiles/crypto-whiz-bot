import * as dotenv from 'dotenv';
dotenv.config();
import api from './api';
import { cancelAllTradeOrders, TradeOrder } from './order';
import { Trade } from './Trade';
import bots from './bots/bots';

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
// XXXXX
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
// Could improve EMA check by getting the tangent line at the cross point or something.
// Essentially find out the angle of the cross, perhaps taking in multiple data points.
// Sharper angles might be more reliable.
// XXXXXX
// Bot variant - Sell on reverse EMA cross before letting it hit stop loss.
// XXXXXX
// Bot variant - Only get into EMA crosses if current ptice is or ema is a certain disatnce from the cloest long MA line.
// For this variant may want to hold on until ema crosses back again.
// XXXXXX
// For variant waiting for returning ema cross, probably should be shifting stoploss
// higher as it goes. This will protect it on those moonshots that return back down again.
// XXXXX
// BUG!!!! - In the past have recieved not logged in error with an unauthorided error
// code - forgot to take it down. But need to reattempt loggin when this happens as
// this was likily a discrepency with the timestamp sent in the authorisation headers.
// and not a real fail.
// XXXXXX
// SENTRY
// XXXXXX
// Test miniumum coin purchase size with BTT - minimum purchase 1000 but it only costs $0.0087 for 1.

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

const openTrade = async (
  tradeOrder: TradeOrder,
): Promise<Trade | undefined> => {
  const { marketId, side, subaccount, price } = tradeOrder;

  const openOrders = await api.getOpenOrders(subaccount);

  console.log(openOrders);
  if (openOrders.length === 0) {
    const marketData = await api.getMarket(marketId);
    const accountData = await api.getAccount(subaccount);
    const balances = await api.getBalances(subaccount);
    const usdBalance = balances.find(
      (balance) => balance.coin === marketData.quoteCurrency,
    );

    let volume;

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
};

async function runBot() {
  const POLL_INTERVAL = 5000;
  const openTrades: Trade[] = [];

  let poll = true;

  while (poll) {
    console.log(`=== Polling FTX | ${new Date().toISOString()} ===`);
    try {
      // // XXXXCreate a generic waitfor interval function and move out the interval
      // // is finished check into that.
      // change while loop to
      // while !trade {
      // interval searchMarketForTrade()
      // }

      // Instead of bots call them and think of them as subaccounts!!!!
      // Instead of bots call them and think of them as subaccounts!!!!
      // Instead of bots call them and think of them as subaccounts!!!!

      // This way of editing the openTrade array seems overengineered. Maybe use class instances...??
      for (const subaccount of bots) {
        const trade = openTrades.find(
          (trade) => trade.subaccount === subaccount.name,
        );

        if (!trade) {
          console.log('Started search');
          // Look for a trade order.
          const tradeOrder = await subaccount.search();
          console.log('Finished search');
          // If a trade order was made, start a new trade.
          if (tradeOrder) {
            const newTrade = await openTrade(tradeOrder);

            if (newTrade) {
              openTrades.push(newTrade);
            }
          }
        } else {
          // XXXXXXXX
          // XXX Need to detect a successful trade here so I
          // can automatically post to Firebase without needing
          // to include it in every bots manage function.
          // XXXXXXXX
          const updatedTrade = await subaccount.manage(trade);

          const openTradeIndex = openTrades.findIndex(
            (item) => item.subaccount === updatedTrade.subaccount,
          );

          // Stop observing trade if it's closed otherwise update it.
          if (updatedTrade.status === 'closed') {
            openTrades.splice(openTradeIndex, 1);
          } else {
            openTrades.splice(openTradeIndex, 1, updatedTrade);
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      poll = false;
      // await criticalErrorCleanup(trade).catch((error) => {
      console.log(error);
      console.log('!!!!!!!!!!!!!!!');
      console.log('FAILED TO CLEANUP AFTER CRITICAL ERROR');
      console.log('TRADES MIGHT STILL BE ACTIVE');
      console.log('!!!!!!!!!!!!!!!');
      throw new Error(error);
      // });
      // console.log('Successfully cleaned up.');
    }
  }

  // // XXXXCreate a generic waitfor interval function and move out the interval
  // // is finished check into that.
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
  try {
    await runBot();
  } catch (error) {
    console.error('===== CRITICAL ERROR =====');
    console.error(error);
  }
}

main();
