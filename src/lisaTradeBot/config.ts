export type AccountId = 'LisaNEdwards' | 'lucas';

const config = {
  accounts: {
    LisaNEdwards: {
      FTX_SUBACCOUNT: process.env.FTX_LISA_BOT_SUBACCOUNT,
      FTX_API_KEY: process.env.FTX_LISA_BOT_API_KEY,
      FTX_API_SECRET: process.env.FTX_LISA_BOT_API_SECRET,
      TRADE_CAPITAL: 10,
    },
    lucas: {
      FTX_SUBACCOUNT: '',
      FTX_API_KEY: '',
      FTX_API_SECRET: '',
      TRADE_CAPITAL: 10,
    },
  },
};

export default config;
