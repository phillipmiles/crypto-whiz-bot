const axios = require('axios');
const { authenticateRestHeaders } = require('./authenticate');


// PUBLIC API CALLS

async function getHistoricalPrices(marketId, timeframe) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/markets/${marketId}/candles`, {
    params: {
      resolution: timeframe,
      limit: 100,
    }
  });

  return response.data.result;
}


async function getMarket(marketId) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/markets/${marketId}`);

  return response.data.result;
}

// PRIVATE API CALLS

async function getAccount(subaccount) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/account`,
    {
      headers: authenticateRestHeaders('/account', 'GET', subaccount)
    });

  return response.data.result;
}

async function getBalances(subaccount) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/wallet/balances`,
    {
      headers: authenticateRestHeaders('/wallet/balances', 'GET', subaccount)
    });

  return response.data.result;
}

async function getOpenOrders(subaccount) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/orders`,
    {
      headers: authenticateRestHeaders('/orders', 'GET', subaccount)
    });

  return response.data.result;
}

// Returns all trigger orders which have a status of 'open'.
async function getOpenTriggerOrders(subaccount, marketId) {

  const response = await axios.get(`${process.env.API_ENDPOINT}/conditional_orders?market=${marketId}`, {
    // params: {
    //   market: marketId,
    // },
    headers: authenticateRestHeaders(`/conditional_orders?market=${marketId}`, 'GET', subaccount)
  }
  );

  return response.data.result;
}

// https://docs.ftx.com/#get-order-history
async function getOrderHistory(subaccount, marketId) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/orders/history?market={marketId}`, {
    headers: authenticateRestHeaders(`/orders/?market=${marketId}`, 'GET', subaccount)
  });

  return response.data.result;
}

// https://docs.ftx.com/#get-trigger-order-history
async function getTriggerOrderHistory(subaccount, marketId) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/conditional_orders/history?market={marketId}`, {
    headers: authenticateRestHeaders(`/conditional_orders/?market=${marketId}`, 'GET', subaccount)
  });

  return response.data.result;
}

async function getOrderStatus(subaccount, orderId) {

  const response = await axios.get(`${process.env.API_ENDPOINT}/orders/${orderId}`, {
    headers: authenticateRestHeaders(`/orders/${orderId}`, 'GET', subaccount)
  });

  return response.data.result;
}


async function placeOrder(subaccount, payload) {
  const response = await axios.post(`${process.env.API_ENDPOINT}/orders`, payload, {
    headers: authenticateRestHeaders('/orders', 'POST', subaccount, payload)
  });

  return response.data.result;
}

async function placeConditionalOrder(subaccount, payload) {
  const response = await axios.post(`${process.env.API_ENDPOINT}/conditional_orders`, payload, {
    headers: authenticateRestHeaders('/conditional_orders', 'POST', subaccount, payload)
  });

  return response.data.result;
}

async function cancelOrder(subaccount, orderId) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/orders/${orderId}`, {
    headers: authenticateRestHeaders(`/orders/${orderId}`, 'DELETE', subaccount)
  });

  return response.data.result;
}

async function cancelOpenTriggerOrder(subaccount, orderId) {
  const response = await axios.get(`${process.env.API_ENDPOINT}/conditional_orders/${orderId}`, {
    headers: authenticateRestHeaders(`/conditional_orders/${orderId}`, 'DELETE', subaccount)
  });

  return response.data.result;
}


module.exports = { getHistoricalPrices, getMarket, getAccount, getBalances, getOpenOrders, getTriggerOrderHistory, getOpenTriggerOrders, getOrderHistory, getOrderStatus, placeOrder, placeConditionalOrder, cancelOrder, cancelOpenTriggerOrder }