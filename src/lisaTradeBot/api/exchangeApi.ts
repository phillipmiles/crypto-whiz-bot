import * as ftx from './ftx/api';
import * as ftxAuth from './ftx/auth';
import config, { AccountId } from '../config';

export type Side = 'buy' | 'sell';
export type OrderStatus = 'new' | 'open' | 'closed';
export type OrderType = 'limit' | 'market';
export type TriggerOrderType = 'stop' | 'trailingStop' | 'takeProfit';
export type TriggerOrderStatus = 'open' | 'cancelled' | 'triggered';
export type MarketType = 'future' | 'spot';

interface Balance {
  coin: string;
  free: number;
}
export interface Market {
  name: string; // e.g. "BTC/USD" for spot, "BTC-PERP" for futures
  type: MarketType; // "future" or "spot"
  enabled: boolean;
  postOnly: boolean; // if the market is in post-only mode (all orders get modified to be post-only, in addition to other settings they may hve)
  priceIncrement: number;
  sizeIncrement: number;
  minProvideSize: number;
  restricted: boolean; // if the market has nonstandard restrictions on which jurisdictions can trade it
  underlying: string | null; // The currency a future market has underlying it. Future markets only
  baseCurrency: string | null; // A spot markets currency. Spot markets only.
  quoteCurrency: string | null; // The currency used to transact with spot market. Spot markets only.
  bid: number; // best bid
  ask: number; // best ask
  last: number; // last traded price
  price: number; // Same as bid?????
  highLeverageFeeExempt: boolean; // Assuming whether it avoids additional fees for leverages above 10*. BTC and ETH avoide this i think.
  change1h: number; // percentage change
  change24h: number; // percentage change
  changeBod: number; // percentage change
  quoteVolume24h: number;
  volumeUsd24h: number;
}
export interface NewOrder {
  market: string;
  side: Side;
  price: number | null; // Send null for market orders.
  type: OrderType;
  size: number;
  reduceOnly?: boolean; // Default is false
  ioc?: boolean; // Default is false
  postOnly?: boolean; // Default is false
  clientId?: string | null;
}

export interface Order {
  createdAt: string;
  id: string;
  market: string;
  side: Side;
  price: number;
  filledSize: number;
  remainingSize: number;
  size: number;
  status: OrderStatus;
  type: OrderType;
  reduceOnly: boolean;
  ioc: boolean;
  postOnly: boolean;
  clientId?: string | null;
  future?: string;
}

export interface NewTriggerOrder {
  market: string;
  side: Side;
  size: number;
  type: TriggerOrderType; // default is 'stop'
  reduceOnly?: boolean; // default is false - Spot trades cannot have reduceOnly set to true.
  retryUntilFilled?: boolean; //	Whether or not to keep re-triggering until filled. optional, default true for market orders

  // For stop loss and take profit orders
  triggerPrice?: number;
  orderPrice?: number; // optional; order type is limit if this is specified; otherwise market

  // For trailing orders
  trailValue?: number; //negative for "sell"; positive for "buy"
}

export interface TriggerOrder {
  createdAt: string;
  id: string;
  market: string;
  triggerPrice: number;
  side: Side;
  size: number;
  status: TriggerOrderStatus;
  type: TriggerOrderType;
  orderType: OrderType;
  orderPrice: number; // price of the order sent when this stop loss triggered
  triggeredAt: number; // time at which this stop loss order triggered
  reduceOnly: boolean;
  retryUntilFilled: boolean; // Whether or not to keep re-triggering until filled
  future?: string;
}

export interface ModifyTriggerOrder {
  size: number;

  // For stop loss and take profit orders
  triggerPrice?: number;
  orderPrice?: number; // optional; order type is limit if this is specified; otherwise market

  // For trailing orders
  trailValue?: number; //negative for "sell"; positive for "buy"
}

// const ftxAuthConfig: ftxAuth.AuthConfig = {
//   subaccount: config.FTX_SUBACCOUNT ? config.FTX_SUBACCOUNT : '',
//   key: config.FTX_API_KEY ? config.FTX_API_KEY : '',
//   secret: config.FTX_API_SECRET ? config.FTX_API_SECRET : '',
// };

export const getFtxAuthConfig = (accountId: AccountId): ftxAuth.AuthConfig => {
  const { FTX_SUBACCOUNT, FTX_API_KEY, FTX_API_SECRET } = config.accounts[
    accountId
  ];
  return {
    subaccount: FTX_SUBACCOUNT ? FTX_SUBACCOUNT : '',
    key: FTX_API_KEY ? FTX_API_KEY : '',
    secret: FTX_API_SECRET ? FTX_API_SECRET : '',
  };
};

export const getMarket = async (
  exchangeId: string,
  marketId: string,
): Promise<Market> => {
  if (exchangeId === 'ftx') {
    return ftx.getMarket(marketId);
  } else if (exchangeId === 'binance') {
    throw new Error(
      `Binance is not yet supported. Failed to get market ${marketId}.`,
    );
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to get market ${marketId}.`,
    );
  }
};

export const getBalances = async (
  exchangeId: string,
  accountId: AccountId,
): Promise<Balance[]> => {
  if (exchangeId === 'ftx') {
    return ftx.getBalances(getFtxAuthConfig(accountId));
  } else if (exchangeId === 'binance') {
    throw new Error(`Binance is not yet supported. Failed to get balances.`);
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to get balances.`,
    );
  }
};

export const getOrder = async (
  exchangeId: string,
  accountId: AccountId,
  orderId: string,
): Promise<Order> => {
  if (exchangeId === 'ftx') {
    return ftx.getOrder(getFtxAuthConfig(accountId), orderId);
  } else if (exchangeId === 'binance') {
    throw new Error(
      `Binance is not yet supported. Failed to get order ${orderId}.`,
    );
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to get order ${orderId}.`,
    );
  }
};

export const placeOrder = async (
  exchangeId: string,
  accountId: AccountId,
  payload: NewOrder,
): Promise<Order> => {
  if (exchangeId === 'ftx') {
    return ftx.placeOrder(getFtxAuthConfig(accountId), payload);
  } else if (exchangeId === 'binance') {
    throw new Error(`Binance is not yet supported. Failed to place order.`);
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to place order.`,
    );
  }
};

export const placeTriggerOrder = async (
  exchangeId: string,
  accountId: AccountId,
  payload: NewTriggerOrder,
): Promise<TriggerOrder> => {
  if (exchangeId === 'ftx') {
    return ftx.placeTriggerOrder(getFtxAuthConfig(accountId), payload);
  } else if (exchangeId === 'binance') {
    throw new Error(
      `Binance is not yet supported. Failed to place trigger order.`,
    );
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to place trigger order.`,
    );
  }
};

export const modifyTriggerOrder = async (
  exchangeId: string,
  accountId: AccountId,
  triggerOrderId: string,
  payload: ModifyTriggerOrder,
): Promise<TriggerOrder> => {
  if (exchangeId === 'ftx') {
    return ftx.modifyTriggerOrder(
      getFtxAuthConfig(accountId),
      triggerOrderId,
      payload,
    );
  } else if (exchangeId === 'binance') {
    throw new Error(
      `Binance is not yet supported. Failed to modify trigger order ${triggerOrderId}.`,
    );
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to modify trigger order ${triggerOrderId}.`,
    );
  }
};

export const cancelOrder = async (
  exchangeId: string,
  accountId: AccountId,
  orderId: string,
): Promise<Order> => {
  if (exchangeId === 'ftx') {
    return ftx.cancelOrder(getFtxAuthConfig(accountId), orderId);
  } else if (exchangeId === 'binance') {
    throw new Error(
      `Binance is not yet supported. Failed to cancel order ${orderId}.`,
    );
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to cancel order ${orderId}.`,
    );
  }
};

export const cancelTriggerOrder = async (
  exchangeId: string,
  accountId: AccountId,
  triggerOrderId: string,
): Promise<TriggerOrder> => {
  if (exchangeId === 'ftx') {
    return ftx.cancelTriggerOrder(getFtxAuthConfig(accountId), triggerOrderId);
  } else if (exchangeId === 'binance') {
    throw new Error(
      `Binance is not yet supported. Failed to cancel trigger order ${triggerOrderId}.`,
    );
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to cancel trigger order ${triggerOrderId}.`,
    );
  }
};
