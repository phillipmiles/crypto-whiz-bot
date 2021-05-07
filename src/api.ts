import axios, { AxiosResponse, AxiosError } from 'axios';
import { authenticateRestHeaders } from './authenticate';
import { Market } from './market';
// import { Subaccount } from './config';
import { Order, TriggerOrder } from './order';
// interface ApiError extends Error {
//   code: string;
//   codeText: string;
// }

// XXX Caution. There are issues with extending Error.
// https://stackoverflow.com/questions/41102060/typescript-extending-error-class
class ApiError extends Error {
  code: number | undefined;
  codeText: string | undefined;
  request: unknown;
  response: unknown;

  constructor(message?: string) {
    // 'Error' breaks prototype chain here
    super(message);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// XXXX TODO!!!!!
// I should probably convert what's returned from FTX api calls into
// typed interfaces in each api function below. This way I can ensure that if FTX
// changes/depreciates properties from what's returned it won't fill my app with
// dirt data.
// XXXX TODO!!!!!

const createAxiosError = (axiosError: AxiosError) => {
  const error = new ApiError();

  if (!axiosError.response) {
    return error;
  }

  error.code = axiosError.response.status;
  error.codeText = axiosError.response.statusText;
  error.request = axiosError.response.config;
  error.response = axiosError.response.data;
  error.message = axiosError.response.data.error;

  return error;
};

const callApi = async (apiCall: () => Promise<AxiosResponse>): Promise<any> => {
  let response;
  try {
    response = await apiCall();
  } catch (error) {
    // / XXXX If error code is whatever unauthorised is then
    // reattempt call a few times before throwing error.
    throw createAxiosError(error);
  }
  return response.data.result;
};

// PUBLIC API CALLS

async function getHistoricalPrices(marketId: string, timeframe: number) {
  const response = await axios.get(
    `${process.env.API_ENDPOINT}/markets/${marketId}/candles`,
    {
      params: {
        resolution: timeframe,
        limit: 100,
      },
    },
  );

  return response.data.result;
}

async function getMarkets(): Promise<Market[]> {
  return callApi(() => axios.get(`${process.env.API_ENDPOINT}/markets`));
}

async function getMarket(marketId: string): Promise<Market> {
  const response = await axios.get(
    `${process.env.API_ENDPOINT}/markets/${marketId}`,
  );

  return response.data.result;
}

// PRIVATE API CALLS

interface Account {
  freeCollateral: number;
  takerFee: number;
  leverage: number;
}

async function getAccount(subaccount: string): Promise<Account> {
  const response = await axios.get(`${process.env.API_ENDPOINT}/account`, {
    headers: authenticateRestHeaders('/account', 'GET', subaccount),
  });

  return response.data.result;
}

interface Balance {
  coin: string;
  free: number;
}

async function getBalances(subaccount: string): Promise<Balance[]> {
  const response = await axios.get(
    `${process.env.API_ENDPOINT}/wallet/balances`,
    {
      headers: authenticateRestHeaders('/wallet/balances', 'GET', subaccount),
    },
  );

  return response.data.result;
}

async function getOpenOrders(subaccount: string): Promise<Order[]> {
  const response = await axios.get(`${process.env.API_ENDPOINT}/orders`, {
    headers: authenticateRestHeaders('/orders', 'GET', subaccount),
  });

  return response.data.result;
}

// Returns all trigger orders which have a status of 'open'.
async function getOpenTriggerOrders(
  subaccount: string,
  marketId: string,
): Promise<TriggerOrder[]> {
  const response = await axios.get(
    `${process.env.API_ENDPOINT}/conditional_orders?market=${marketId}`,
    {
      // params: {
      //   market: marketId,
      // },
      headers: authenticateRestHeaders(
        `/conditional_orders?market=${marketId}`,
        'GET',
        subaccount,
      ),
    },
  );

  return response.data.result;
}

// https://docs.ftx.com/#get-order-history
async function getOrderHistory(
  subaccount: string,
  marketId: string,
): Promise<Order[]> {
  return callApi(() =>
    axios.get(`${process.env.API_ENDPOINT}/orders/history?market=${marketId}`, {
      headers: authenticateRestHeaders(
        `/orders/history?market=${marketId}`,
        'GET',
        subaccount,
      ),
    }),
  );
}

// https://docs.ftx.com/#get-trigger-order-history
async function getTriggerOrderHistory(
  subaccount: string,
  marketId: string,
): Promise<TriggerOrder[]> {
  return callApi(() =>
    axios.get(
      `${process.env.API_ENDPOINT}/conditional_orders/history?market=${marketId}`,
      {
        headers: authenticateRestHeaders(
          `/conditional_orders/history?market=${marketId}`,
          'GET',
          subaccount,
        ),
      },
    ),
  );
}

async function getOrderStatus(
  subaccount: string,
  orderId: string,
): Promise<Order> {
  return callApi(() =>
    axios.get(`${process.env.API_ENDPOINT}/orders/${orderId}`, {
      headers: authenticateRestHeaders(`/orders/${orderId}`, 'GET', subaccount),
    }),
  );
}

async function placeOrder(subaccount: string, payload: unknown) {
  return callApi(() =>
    axios.post(`${process.env.API_ENDPOINT}/orders`, payload, {
      headers: authenticateRestHeaders('/orders', 'POST', subaccount, payload),
    }),
  );
  // // console.log('do')
  // let response;
  // try {
  //   response = await axios.post(`${process.env.API_ENDPOINT}/orders`, payload, {
  //     headers: authenticateRestHeaders('/orders', 'POST', subaccount, payload)
  //   });
  // } catch (error) {
  //   throw createAxiosError(error);
  // }

  // return response.data.result;
}

async function placeConditionalOrder(subaccount: string, payload: unknown) {
  return callApi(() =>
    axios.post(`${process.env.API_ENDPOINT}/conditional_orders`, payload, {
      headers: authenticateRestHeaders(
        '/conditional_orders',
        'POST',
        subaccount,
        payload,
      ),
    }),
  );
}

async function cancelOrder(subaccount: string, orderId: string) {
  const response = await axios.delete(
    `${process.env.API_ENDPOINT}/orders/${orderId}`,
    {
      headers: authenticateRestHeaders(
        `/orders/${orderId}`,
        'DELETE',
        subaccount,
      ),
    },
  );

  return response.data.result;
}

async function cancelOpenTriggerOrder(subaccount: string, orderId: string) {
  return callApi(() =>
    axios.delete(`${process.env.API_ENDPOINT}/conditional_orders/${orderId}`, {
      headers: authenticateRestHeaders(
        `/conditional_orders/${orderId}`,
        'DELETE',
        subaccount,
      ),
    }),
  );
}

export default {
  getHistoricalPrices,
  getMarkets,
  getMarket,
  getAccount,
  getBalances,
  getOpenOrders,
  getTriggerOrderHistory,
  getOpenTriggerOrders,
  getOrderHistory,
  getOrderStatus,
  placeOrder,
  placeConditionalOrder,
  cancelOrder,
  cancelOpenTriggerOrder,
};
