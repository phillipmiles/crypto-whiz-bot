export interface BotConfig {
  credentials: {
    key: string | undefined;
    secret: string | undefined;
  };
  cancelBidDeviation: number;
  stoplossDeviation: number;
  profitDeviation: number;
  markets: string[];
}

interface Config {
  'BOT-1': BotConfig;
  'BOT-2': BotConfig;
  'BOT-3': BotConfig;
}

export type Subaccount = keyof Config;

const config: Config = {
  'BOT-1': {
    credentials: {
      key: process.env.BOT_1_API_KEY,
      secret: process.env.BOT_1_API_SECRET,
    },
    // Percentage change that market price can move away from ther bid price before cancelling order.
    cancelBidDeviation: 0.75,
    // Percentage change from fill price that a stoploss will be set.
    stoplossDeviation: 1.5,
    // Percentage change from breakeven price required to trigger sell order.
    profitDeviation: 0.2,
    markets: [
      'DOGE-PERP',
      'XRP-PERP',
      'ADA-PERP',
      'KNC-PERP',
      'ZRX-PERP',
      'GRT-PERP',
      'IOTA-PERP',
      'ALGO-PERP',
      'BAT-PERP',
      'REN-PERP',
      'LRC-PERP',
      'MATIC-PERP',
      'ZIL-PERP',
      'RSR-PERP',
      'VET-PERP',
      'AUDIO-PERP',
      'STX-PERP',
      'STORJ-PERP',
      'CRV-PERP',
    ],
    // Taking LEO out, bugger all market action.
  },
  'BOT-2': {
    credentials: {
      key: '',
      secret: '',
    },
    cancelBidDeviation: 0.75,
    stoplossDeviation: 1.5,
    profitDeviation: 0.2,
    markets: [],
  },
  'BOT-3': {
    credentials: {
      key: '',
      secret: '',
    },
    cancelBidDeviation: 0.75,
    stoplossDeviation: 1.5,
    profitDeviation: 0.2,
    markets: [],
  },
};

export default config;
