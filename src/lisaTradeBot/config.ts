export type AccountId = 'LisaNEdwards' | 'lucas';

const config = {
  TRADES_COLLECTION: 'trades',
  SIGNALS_COLLECTION: 'fake-signals',
  accounts: {
    LisaNEdwards: {
      FTX_SUBACCOUNT: process.env.FTX_LISA_BOT_SUBACCOUNT,
      FTX_API_KEY: process.env.FTX_LISA_BOT_API_KEY,
      FTX_API_SECRET: process.env.FTX_LISA_BOT_API_SECRET,
      TRADE_CAPITAL: 10,
      // Cancels trade if market moves this far away from it's price at time of trades initialised (as percentage)
      CANCEL_ENTRY_BID_PRICE_CHANGE: 0.3,
      // Validate's that the market price isn't this percentage away from singals buy zone. (as percentage)
      MAXIMUM_MARKET_PRICE_DIFFERENCE_TO_ENTRY_PRICE: 0.75,
    },
    lucas: {
      FTX_SUBACCOUNT: '',
      FTX_API_KEY: '',
      FTX_API_SECRET: '',
      TRADE_CAPITAL: 10,
      CANCEL_ENTRY_BID_PRICE_CHANGE: 0.3,
      MAXIMUM_MARKET_PRICE_DIFFERENCE_TO_ENTRY_PRICE: 0.75,
    },
  },
};

export default config;
