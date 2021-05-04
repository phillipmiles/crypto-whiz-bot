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

// Cancel orders left on a trade.
async function cancelAllTradeOrders(trade) {
  const orderHistory = await api.getOrderHistory(trade.subaccount, trade.marketId);
  const triggerOrderHistory = await api.getTriggerOrderHistory(trade.subaccount, trade.marketId);

  if (trade.orderId) {
    const order = orderHistory.find(order => order.id === trade.orderId);
    if (order.status === 'new' || order.status === 'open') {
      await api.cancelOrder(order.id);
    }
  }

  if (trade.stoplossOrderId) {
    const order = triggerOrderHistory.find(order => order.id === trade.stoplossOrderId);
    if (order.status === 'open') {
      await api.cancelOpenTriggerOrder(trade.subaccount, order.id);
    }
  }

  if (trade.closeOrderId) {
    const order = orderHistory.find(order => order.id === trade.closeOrderId);
    if (order.status === 'new' || order.status === 'open') {
      await api.cancelOrder(trade.subaccount, order.id);
    }
  }
}

module.exports = { calcBreakeven, calcStoplossTriggerPrice, hasOrderSuccessfullyFilled, hasPriceDeviatedFromBidOrder, cancelAllTradeOrders }