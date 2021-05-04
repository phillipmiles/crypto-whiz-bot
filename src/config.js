const config = {
  'BOT-1': {
    credentials: {
      key: process.env.BOT_1_API_KEY,
      secret: process.env.BOT_1_API_SECRET,
    },
    // Percentage change that market price can move away from ther bid price before cancelling order.
    cancelBidDeviation: 0.75,
    // Percentage change from fill price that a stoploss will be set.
    stoplossDeviation: 0.75,
    markets: ['DOGE-PERP'],
  }
}

module.exports = config;