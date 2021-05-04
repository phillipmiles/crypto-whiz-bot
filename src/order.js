function calcBreakeven(side, price, volume, fee) {
  const value = price * volume;
  const cost = value * fee * 2;
  return side === 'buy' ? (value + cost) / volume : (value - cost) / volume;
}

function calcStoplossTriggerPrice(fillPrice, side, percentageDeviation) {
  const stoplossPercentage = fillPrice * (percentageDeviation / 100);
  return side === 'buy' ? fillPrice - stoplossPercentage : fillPrice + stoplossPercentage;
}

// Order must be of type Order as recieved from FTX api.
function hasOrderSuccessfullyFilled(order) {
  return order.status === 'closed' && order.remainingSize === 0;
}

module.exports = { calcBreakeven, calcStoplossTriggerPrice, hasOrderSuccessfullyFilled }