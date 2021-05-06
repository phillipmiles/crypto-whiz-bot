import api from './api';
import { Subaccount } from './config';
import { percentageChange } from './utils/math';
import { Trade } from './Trade';

export type Side = 'buy' | 'sell';

export interface Order {
  id: string;
  status: string;
  size: number;
  filledSize: number;
  avgFillPrice: number;
  side: Side;
  price: number;
}

export interface TriggerOrder {
  id: string;
  status: string;
  size: number;
  filledSize: number;
}

export const calcBreakeven = (
  side: Side,
  price: number,
  volume: number,
  fee: number,
): number => {
  const value = price * volume;
  const cost = value * fee * 2;

  return side === 'buy' ? (value + cost) / volume : (value - cost) / volume;
};

export const calcSellPrice = (
  side: Side,
  fillPrice: number,
  size: number,
  requiredProfitPercentage: number,
  fees: number,
): number => {
  const breakeven = calcBreakeven(side, fillPrice, size, fees);
  const requiredProfit = breakeven * (requiredProfitPercentage / 100);
  return side === 'buy'
    ? breakeven + requiredProfit
    : breakeven - requiredProfit;
};

export const calcStoplossTriggerPrice = (
  fillPrice: number,
  side: Side,
  deviationPercentage: number,
): number => {
  const stoplossPercentage = fillPrice * (deviationPercentage / 100);
  return side === 'buy'
    ? fillPrice - stoplossPercentage
    : fillPrice + stoplossPercentage;
};

// Order must be of type Order as recieved from FTX api.
export const hasOrderSuccessfullyFilled = (order: Order): boolean => {
  return order.status === 'closed' && order.size === order.filledSize;
  // return order.status === 'closed' && order.remainingSize === 0;
};

export const hasPriceDeviatedFromBidOrder = (
  side: Side,
  bidPrice: number,
  marketPrice: number,
  allowedDeviationPercentage: number,
): boolean => {
  const percentageChangeFromBidPrice = percentageChange(bidPrice, marketPrice);
  // If shorting, inverse percentage change to make comparison easier.
  const normalisedChangeFromBidPrice =
    side === 'buy'
      ? percentageChangeFromBidPrice
      : percentageChangeFromBidPrice * -1;
  return normalisedChangeFromBidPrice > allowedDeviationPercentage;
};

// Cancel orders left on a trade.
export const cancelAllTradeOrders = async (trade: Trade): Promise<void> => {
  const orderHistory = await api.getOrderHistory(
    trade.subaccount,
    trade.marketId,
  );
  const triggerOrderHistory = await api.getTriggerOrderHistory(
    trade.subaccount,
    trade.marketId,
  );

  if (trade.orderId) {
    const order = orderHistory.find(
      (order: Order) => order.id === trade.orderId,
    );

    if (order && (order.status === 'new' || order.status === 'open')) {
      await api.cancelOrder(trade.subaccount, order.id);
    }
  }

  if (trade.stoplossOrderId) {
    const order = triggerOrderHistory.find(
      (order) => order.id === trade.stoplossOrderId,
    );
    if (order && order.status === 'open') {
      await api.cancelOpenTriggerOrder(trade.subaccount, order.id);
    }
  }

  if (trade.closeOrderId) {
    const order = orderHistory.find((order) => order.id === trade.closeOrderId);
    if (order && (order.status === 'new' || order.status === 'open')) {
      await api.cancelOrder(trade.subaccount, order.id);
    }
  }
};
