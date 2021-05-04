const config = {
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
    markets: ['DOGE-PERP', 'XRP-PERP', 'ADA-PERP', 'KNC-PERP', 'ZRX-PERP', 'GRT-PERP', 'IOTA-PERP', 'ALGO-PERP', 'BAT-PERP', 'REN-PERP', 'LRC-PERP', 'MATIC-PERP', 'ZIL-PERP', 'RSR-PERP', 'VET-PERP', 'AUDIO-PERP', 'STX-PERP', 'STORJ-PERP', 'CRV-PERP'],
  }
}

// XXXX CLOSE - SUSHI
// XXXX - SOLANA
// XXXX - CAKE
// XXXX - CREAM
// XXXX CLOSE SEREM
// XXXX CLOSE LUNA
// XXXX DOT


module.exports = config;