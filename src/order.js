function calcBreakeven(side, price, volume, fee) {
  const value = price * volume;
  const cost = value * fee * 2;
  return side === 'buy' ? (value + cost) / volume : (value - cost) / volume;
}

function calcStoplossTriggerPrice(fillPrice, side, deviationPercentage) {
  const stoplossPercentage = fillPrice * (deviationPercentage / 100);
  return side === 'buy' ? fillPrice - stoplossPercentage : fillPrice + stoplossPercentage;
}

// Order must be of type Order as recieved from FTX api.
function hasOrderSuccessfullyFilled(order) {
  return order.status === 'closed' && order.remainingSize === 0;
}

function hasPriceDeviatedFromBidOrder(side, bidPrice, marketPrice, allowedDeviationPercentage) {
  const percentageChangeFromBidPrice = percentageChange(bidPrice, marketPrice);
  // If shorting, inverse percentage change to make comparison easier.
  const normalisedChangeFromBidPrice = side === 'buy' ? percentageChangeFromBidPrice : percentageChangeFromBidPrice * -1;
  return normalisedChangeFromBidPrice > allowedDeviationPercentage;
}

module.exports = { calcBreakeven, calcStoplossTriggerPrice, hasOrderSuccessfullyFilled, hasPriceDeviatedFromBidOrder }