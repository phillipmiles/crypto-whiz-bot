import axios, { AxiosResponse } from 'axios';
import { generateAuthApiHeaders, AuthConfig } from './auth';
import { createAxiosError } from './error';

export const callApi = async (
  apiCall: () => Promise<AxiosResponse>,
): Promise<any> => {
  let response;
  try {
    response = await apiCall();
  } catch (error) {
    // / XXXX If error code is whatever unauthorised is then
    // reattempt call a few times before throwing error.
    throw createAxiosError(error);
  }
  return response.data.result;
};

interface Account {
  username: 'string';
  collateral: number;
  freeCollateral: number;
  totalAccountValue: number;
  totalPositionSize: number;
  initialMarginRequirement: number;
  maintenanceMarginRequirement: number;
  marginFraction: number | null;
  openMarginFraction: number | null;
  liquidating: boolean;
  backstopProvider: boolean;
  positions: any[];
  takerFee: number;
  makerFee: number;
  leverage: number;
  positionLimit: number | null;
  positionLimitUsed: number | null;
  useFttCollateral: boolean;
  chargeInterestOnNegativeUsd: boolean;
  spotMarginEnabled: boolean;
  spotLendingEnabled: boolean;
}

interface Balance {
  coin: string;
  free: number;
}

export type MarketType = 'future' | 'spot';
export type OrderType = 'limit' | 'market';
export type TriggerOrderType = 'stop' | 'trailingStop' | 'takeProfit';
export type TriggerOrderStatus = 'open' | 'cancelled' | 'triggered';
// new (accepted but not processed yet), open, or closed (filled or cancelled)
export type OrderStatus = 'new' | 'open' | 'closed';
export type SideType = 'buy' | 'sell';

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

interface NewOrder {
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

interface Order {
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

interface NewTriggerOrder {
  market: string;
  side: SideType;
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

export const getAccount = async (authConfig: AuthConfig): Promise<Account> => {
  return callApi(() =>
    axios.get(`${process.env.FTX_API_ENDPOINT}/account`, {
      headers: generateAuthApiHeaders('/account', 'GET', authConfig),
    }),
  );
};

export const getBalances = async (
  authConfig: AuthConfig,
): Promise<Balance[]> => {
  return callApi(() =>
    axios.get(`${process.env.FTX_API_ENDPOINT}/wallet/balances`, {
      headers: generateAuthApiHeaders('/wallet/balances', 'GET', authConfig),
    }),
  );
};

export const getMarket = async (marketId: string): Promise<Market> => {
  return callApi(() =>
    axios.get(`${process.env.FTX_API_ENDPOINT}/markets/${marketId}`),
  );
};

export const getOrder = async (
  authConfig: AuthConfig,
  orderId: string,
): Promise<Order> => {
  return callApi(() =>
    axios.get(`${process.env.FTX_API_ENDPOINT}/orders/${orderId}`, {
      headers: generateAuthApiHeaders(`/orders/${orderId}`, 'GET', authConfig),
    }),
  );
};

// NOT SURE IF IT SOHULD BE GET TRIGGER ORDER HISTORY OR OPEN TRIGGER ORDERS OR WHAT!!?!?!?!

export const placeOrder = async (
  authConfig: AuthConfig,
  payload: NewOrder,
): Promise<Order> => {
  return callApi(() =>
    axios.post(`${process.env.FTX_API_ENDPOINT}/orders`, payload, {
      headers: generateAuthApiHeaders('/orders', 'POST', authConfig, payload),
    }),
  );
};

export const placeTriggerOrder = async (
  authConfig: AuthConfig,
  payload: NewTriggerOrder,
): Promise<TriggerOrder> => {
  return callApi(() =>
    axios.post(`${process.env.FTX_API_ENDPOINT}/conditional_orders`, payload, {
      headers: generateAuthApiHeaders(
        '/conditional_orders',
        'POST',
        authConfig,
        payload,
      ),
    }),
  );
};

export const cancelOrder = async (
  authConfig: AuthConfig,
  orderId: string,
): Promise<Order> => {
  return callApi(() =>
    axios.delete(`${process.env.FTX_API_ENDPOINT}/orders/${orderId}`, {
      headers: generateAuthApiHeaders(
        `/orders/${orderId}`,
        'DELETE',
        authConfig,
      ),
    }),
  );
};

export const cancelTriggerOrder = async (
  authConfig: AuthConfig,
  orderId: string,
): Promise<TriggerOrder> => {
  return callApi(() =>
    axios.delete(
      `${process.env.FTX_API_ENDPOINT}/conditional_orders/${orderId}`,
      {
        headers: generateAuthApiHeaders(
          `/conditional_orders/${orderId}`,
          'DELETE',
          authConfig,
        ),
      },
    ),
  );
};
