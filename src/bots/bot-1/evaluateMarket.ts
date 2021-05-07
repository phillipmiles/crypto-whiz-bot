import { secondsTo } from '../../utils/time';
import { calculateEMA } from '../../metrics';
import api from '../../api';
import config from './config';
import { TradeOrder } from '../../order';

const hasEMACrossedInMarket = async (marketId: string, timeframe: number) => {
  const historicalData = await api.getHistoricalPrices(marketId, timeframe);
  // Use marketData for more frequently updated current price.
  const marketData = await api.getMarket(marketId);

  const data = [
    ...historicalData.slice(0, historicalData.length - 1),
    ...[{ close: marketData.price }],
  ];
  // console.log('MA', calculateMA(data.slice(data.length - 21)));
  // console.log(historicalData[historicalData.length - 1].close, marketData.price)
  // console.log('data', data)

  const previousLongEMA = calculateEMA(
    historicalData.slice(0, historicalData.length - 1),
    21,
  );
  const previousShortEMA = calculateEMA(
    historicalData.slice(0, historicalData.length - 1),
    10,
  );
  // const currentLongEMA = calculateEMA(historicalData.slice(0), 21);
  // const currentShortEMA = calculateEMA(historicalData.slice(0), 10);
  const currentLongEMA = calculateEMA(data, 21);
  const currentShortEMA = calculateEMA(data, 10);
  // console.log(
  //   Math.sign(previousLongEMA - previousShortEMA),
  //   Math.sign(currentLongEMA - currentShortEMA),
  //   Math.floor((currentLongEMA - currentShortEMA) * 100000),
  // );
  // console.log(Math.sign(previousLongEMA - previousShortEMA), Math.sign(currentLongEMA - currentShortEMA));
  if (
    Math.sign(previousLongEMA - previousShortEMA) !==
    Math.sign(currentLongEMA - currentShortEMA)
  ) {
    console.log('CROSSED');
    if (Math.sign(currentLongEMA - currentShortEMA) === 1) {
      console.log('GO SHORT');
      return 'short';
    } else {
      console.log('GO LONG');
      return 'long';
    }
  }
  return;
};

const evaluateMarket = async (
  marketId: string,
): Promise<TradeOrder | undefined> => {
  // XXX TODO: Need to check that account has enough money to buy smallest amount
  // of coin.

  // for (const marketId of marketIds) {
  //   console.log(`Checking market ${marketId}`);

  const emaCross = await hasEMACrossedInMarket(
    marketId,
    secondsTo(15, 'minutes'),
  );

  if (emaCross) {
    console.log(`Found EMA cross '${emaCross}' in market ${marketId}.`);
    const marketData = await api.getMarket(marketId);
    // Can't short a spot market.
    if (emaCross === 'short' && marketData.type === 'spot') {
      return;
    }

    return {
      subaccount: config.name,
      marketId: marketId,
      side: emaCross === 'long' ? 'buy' : 'sell',
      price: marketData.price,
    };
  }
  // }
  return;
};

export default evaluateMarket;
