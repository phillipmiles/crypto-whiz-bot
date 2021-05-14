import * as ftx from './ftx/api';
import * as ftxAuth from './ftx/auth';
import config from '../config';

const ftxAuthConfig: ftxAuth.AuthConfig = {
  subaccount: config.FTX_SUBACCOUNT ? config.FTX_SUBACCOUNT : '',
  key: config.FTX_API_KEY ? config.FTX_API_KEY : '',
  secret: config.FTX_API_SECRET ? config.FTX_API_SECRET : '',
};

export type SideType = 'buy' | 'sell';
export type OrderStatus = 'new' | 'open' | 'closed';
export type OrderType = 'limit' | 'market';
export type TriggerOrderType = 'stop' | 'trailingStop' | 'takeProfit';
export type TriggerOrderStatus = 'open' | 'cancelled' | 'triggered';

export interface NewOrder {
  market: string;
  side: SideType;
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
  side: SideType;
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

interface TriggerOrder {
  createdAt: string;
  id: string;
  market: string;
  triggerPrice: number;
  side: SideType;
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

export const getOrder = async (
  exchangeId: string,
  orderId: string,
): Promise<Order> => {
  if (exchangeId === 'ftx') {
    return ftx.getOrder(ftxAuthConfig, orderId);
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
  payload: NewOrder,
): Promise<Order> => {
  if (exchangeId === 'ftx') {
    return ftx.placeOrder(ftxAuthConfig, payload);
  } else if (exchangeId === 'binance') {
    throw new Error(`Binance is not yet supported. Failed to place order.`);
  } else {
    throw new Error(
      `Exchange ${exchangeId} not supported. Failed to place order.`,
    );
  }
};

export const cancelOrder = async (
  exchangeId: string,
  orderId: string,
): Promise<Order> => {
  if (exchangeId === 'ftx') {
    return ftx.cancelOrder(ftxAuthConfig, orderId);
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
  triggerOrderId: string,
): Promise<TriggerOrder> => {
  if (exchangeId === 'ftx') {
    return ftx.cancelTriggerOrder(ftxAuthConfig, triggerOrderId);
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
