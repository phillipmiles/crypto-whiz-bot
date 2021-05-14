import db from '../db/firebase/db';
import { Signal } from '../signals/signal';
import { toMilliseconds } from '../utils/time';
import config from './config';
import {
  getAccount,
  getBalances,
  getMarket,
  placeOrder,
  placeTriggerOrder,
  SideType,
} from './api/ftx/api';
import { AuthConfig } from './api/ftx/auth';
import firebase from 'firebase';

const ftxAuthConfig: AuthConfig = {
  subaccount: config.FTX_SUBACCOUNT ? config.FTX_SUBACCOUNT : '',
  key: config.FTX_API_KEY ? config.FTX_API_KEY : '',
  secret: config.FTX_API_SECRET ? config.FTX_API_SECRET : '',
};

const enterSpotTradeOnFTX = async (
  marketId: string,
  entryPrice: number,
  side: SideType,
) => {
  const marketData = await getMarket(marketId);

  // Does market exist on exchange.
  if (!marketData) throw new Error("Market doesn't exist.");

  const balances = await getBalances(ftxAuthConfig);
  const usdBalance = balances.find((balance) => balance.coin === 'USD');

  // Abort if balance doesn't contain the required capital.
  if (!usdBalance || usdBalance.free < config.TRADE_CAPITAL)
    throw new Error('Not enough captial in account.');

  const volume = config.TRADE_CAPITAL / entryPrice;

  // Abort if the purchase volume doesn't exceed the markets minimum.
  if (!volume || volume <= marketData.sizeIncrement)
    throw new Error("Volume doesn't exceed market minimum.");

  return await placeOrder(ftxAuthConfig, {
    market: marketId,
    side: side,
    price: entryPrice,
    type: 'limit',
    size: volume,
  });
};

const setupTradeWithLisaMainStrategyOnFtx = async (
  signal: any,
  tradeRef: any,
) => {
  const marketId = `${signal.coin}/USD`;

  const entryOrder = await enterSpotTradeOnFTX(
    marketId,
    signal.entryPrice.high,
    'buy',
  );

  await tradeRef.update({
    xId: 'ftx',
    xEntryId: entryOrder.id,
    marketId: marketId,
    side: 'buy',
  });

  const stopLossOrder = await placeTriggerOrder(ftxAuthConfig, {
    market: marketId,
    side: 'sell',
    size: entryOrder.size,
    type: 'stop',
    triggerPrice: signal.stopLossPrice,
    retryUntilFilled: true,
  });

  await tradeRef.update({
    xStopLossId: stopLossOrder.id,
  });

  const targetOrderIds = [];

  try {
    for (const target of signal.targets) {
      const targetOrder = await placeTriggerOrder(ftxAuthConfig, {
        market: marketId,
        side: 'sell',
        size: entryOrder.size,
        type: 'takeProfit',
        triggerPrice: target,
        retryUntilFilled: true,
      });

      targetOrderIds.push(targetOrder.id);
    }
  } catch (error) {
    await tradeRef.update({
      xTargetIds: firebase.firestore.FieldValue.arrayUnion(...targetOrderIds),
    });
    throw error;
  }

  await tradeRef.update({
    xTargetIds: firebase.firestore.FieldValue.arrayUnion(...targetOrderIds),
  });
};

const createTradeWithLisaMainStrategy = async (signal: any, tradeRef: any) => {
  // Don't enter risky trades
  if (signal.isRisky) throw new Error('Trade is too risky.');
  // Don't enter trade if signal is more then 30 minutes old.
  if (signal.timestamp < new Date().getTime() - toMilliseconds(30, 'minutes'))
    throw new Error(`Trade signal ${signal.id} is too old.`);

  // Try to create trade in relavent exchange.
  if (signal.exchanges && signal.exchanges.length > 0) {
    if (signal.exchanges.find((exchange: string) => exchange === 'ftx')) {
      await setupTradeWithLisaMainStrategyOnFtx(signal, tradeRef);
    } else if (
      signal.exchanges.find((exchange: string) => exchange === 'binance')
    ) {
      throw new Error(`Binance support not yet added.`);
    } else {
      throw new Error(`Could not find supported exchange.`);
    }
  } else {
    await setupTradeWithLisaMainStrategyOnFtx(signal, tradeRef);
  }
};

const createTradeFromSignal = async (signal: any) => {
  const existingTrade = await db
    .collection('trades')
    .where('signalId', '==', signal.id)
    .get();

  // Don't enter trade if one already exists for this signal
  if (!existingTrade.empty) return;

  const tradeRef = await db.collection('trades').add({
    signalId: signal.id,
    status: 'initialising',
    xId: '',
    xEntryId: '',
    xStopLossId: '',
    xTargetIds: [],
    marketId: '',
    side: '',
    remainingSize: 0,
    error: false,
    errorMessage: '',
    didCleanup: false,
  });

  // If we didn't record a new trade to DB then abort!
  if (!tradeRef.get()) throw new Error('Failed to init new trade to DB.');

  try {
    if (signal.strategy === 'take-profit-at-targets') {
      await createTradeWithLisaMainStrategy(signal, tradeRef);
    } else if (signal.strategy === 'scalp') {
      // XXX Implement scalp trading... maybe.
    }
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
    await tradeRef.update({
      error: true,
      errorMessage: error.message,
      didCleanup: false,
    });
  }

  await tradeRef.update({
    status: 'waiting-for-entry',
  });
};

const listenForSignals = async (): Promise<void> => {
  db.collection('fake-signals')
    // .where('state', '==', 'CA')
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          console.log('New signal: ', change.doc.data());
          try {
            await createTradeFromSignal(change.doc.data());
          } catch (error) {
            console.log('===== In catch ===== ');
            console.log(error);
            // if (error.trade) {
            //   await recordTradeError(error.tradeId, error.trade, error.message);
            // }
          }
        }
        // if (change.type === 'modified') {
        //   console.log('Modified city: ', change.doc.data());
        // }
        // if (change.type === 'removed') {
        //   console.log('Removed city: ', change.doc.data());
        // }
      });
    });
};

export default listenForSignals;
