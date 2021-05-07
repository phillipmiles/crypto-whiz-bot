export type MarketType = 'future' | 'spot';

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
