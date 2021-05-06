// new Trade('DOGE-PERP', 'long',)

import { Subaccount } from './config';
import { Order, Side } from './order';

// class Trade

// class SpotTrade

// class MarginTrade

// class Position ???

// class Market {
//   constructor(id, type) {
//     this.id = id;
//     this.type = type; // future or spot
//   }
// }

// class Trade {
//   constructor(market, positionType,) {
//     this.market = market;
//     this.positionType = positionType; // short or long

//   }
// }

export interface Trade {
  subaccount: string;
  marketId: string;
  marketType: string;
  side: Side;
  initialOrder?: Order;

  orderId?: string;
  positionType?: string;

  timeOfOrder?: number;
  coin?: string;
  currency?: string;
  stoplossOrderId?: string;
  status?: string;
  closeOrderId?: string;
  avgFillPrice?: number;
  size?: number;
  stoplossTriggerPrice?: number;
}

export interface MarginTrade extends Trade {
  marketType: 'future';
  leverage?: string;
}
