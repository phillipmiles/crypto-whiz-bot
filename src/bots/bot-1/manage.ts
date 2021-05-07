import { Trade } from '../../Trade';
import { secondsTo } from '../../utils/time';
import {
  hasOrderSuccessfullyFilled,
  calcStoplossTriggerPrice,
  hasPriceDeviatedFromBidOrder,
  cancelAllTradeOrders,
  calcSellPrice,
} from '../../order';
import api from '../../api';

// Percentage change that market price can move away from ther bid price before cancelling order.
const CANCEL_BID_DEFINITION = 0.75;
// Percentage change from fill price that a stoploss will be set.
const STOPLOSS_DEVIATION = 1.5;
// Percentage change from breakeven price required to trigger sell order.
const PROFIT_DEVIATION = 0.2;

// If can't find stoploss order. Returns undefined.
const getTriggerOrder = async (
  subaccount: string,
  marketId: string,
  orderId: string,
) => {
  const triggerOrders = await api.getTriggerOrderHistory(subaccount, marketId);
  return triggerOrders.find((order) => order.id === orderId);
};

const mange = async (trade: Trade): Promise<Trade> => {
  if (trade && trade.status === 'pending' && trade.orderId) {
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
        STOPLOSS_DEVIATION,
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
          CANCEL_BID_DEFINITION,
        )
      ) {
        await api.cancelOrder(trade.subaccount, fillOrder.id);
        trade.status = 'closed';
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
        console.log(`${trade.marketId}: Looking for profit`);
        const marketData = await api.getMarket(trade.marketId);
        const accountData = await api.getAccount(trade.subaccount);

        const sellPrice = calcSellPrice(
          trade.side,
          trade.avgFillPrice,
          trade.size,
          PROFIT_DEVIATION,
          accountData.takerFee,
        );
        console.log(
          'sellPrice',
          trade.side,
          trade.avgFillPrice,
          trade.size,
          PROFIT_DEVIATION,
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
  }
  console.log(`Trade status: ${trade ? trade.status : 'unknown'}`);
  return trade;
};

export default mange;
