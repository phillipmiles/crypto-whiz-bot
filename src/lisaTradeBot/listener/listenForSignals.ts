import db from '../../db/firebase/db';
import { toMilliseconds } from '../../utils/time';
import config, { AccountId } from '../config';
import { SideType } from '../api/ftx/api';
import firebase from 'firebase';
import {
  placeOrder,
  placeTriggerOrder,
  getMarket,
  getBalances,
} from '../api/exchangeApi';

const enterSpotTradeOnFTX = async (
  accountId: AccountId,
  marketId: string,
  entryPrice: number,
  side: SideType,
) => {
  const marketData = await getMarket('ftx', marketId);

  // Does market exist on exchange.
  if (!marketData) throw new Error("Market doesn't exist.");

  const balances = await getBalances('ftx', accountId);
  const usdBalance = balances.find((balance) => balance.coin === 'USD');

  // Abort if balance doesn't contain the required capital.
  if (!usdBalance || usdBalance.free < config.accounts[accountId].TRADE_CAPITAL)
    throw new Error('Not enough captial in account.');

  const volume = config.accounts[accountId].TRADE_CAPITAL / entryPrice;

  // Abort if the purchase volume doesn't exceed the markets minimum.
  if (!volume || volume <= marketData.sizeIncrement)
    throw new Error("Volume doesn't exceed market minimum.");

  return await placeOrder('ftx', accountId, {
    market: marketId,
    side: side,
    price: entryPrice,
    type: 'limit',
    size: volume,
  });
};

const setupTradeWithLisaMainStrategyOnFtx = async (
  signal: any,
  tradeRef: firebase.firestore.DocumentReference,
  accountId: AccountId,
  marketId: string,
) => {
  const entryOrder = await enterSpotTradeOnFTX(
    accountId,
    marketId,
    signal.entryPrice.high,
    signal.side,
  );

  await tradeRef.update({
    xId: 'ftx',
    xEntryId: entryOrder.id,
    marketId: marketId,
    accountId: accountId,
    status: 'unfilled',
  });
};

const initNewTradeFromSignal = async (
  signal: any,
): Promise<firebase.firestore.DocumentReference> => {
  return await db.collection('trades').add({
    signalId: signal.id,
    status: 'initialising',
    accountId: '',
    xId: '',
    xEntryId: '',
    xStopLossId: '',
    xTargetIds: [],
    marketId: '',
    side: signal.side,
    remainingSize: 0,
    createdAt: new Date().getTime(),
    error: false,
    errorMessage: '',
    didCleanup: false,
  });
};

const createTradeWithLisaMainStrategy = async (signal: any) => {
  const accountId = signal.author;
  const marketId = `${signal.coin}/USD`;

  // Don't enter risky trades
  if (signal.isRisky) throw new Error('Trade is too risky.');
  // Don't enter trade if signal is more then 30 minutes old.
  if (signal.timestamp < new Date().getTime() - toMilliseconds(30, 'minutes'))
    throw new Error(`Trade signal ${signal.id} is too old.`);

  // If account already has a trade in this market.
  const existingTradeInMarket = await db
    .collection('trades')
    .where('status', '!=', closed)
    .where('accountId', '==', accountId)
    .where('marketId', '==', marketId)
    .get();

  // Don't enter trade if one already exists in market. Program doesn't
  // yet support multiple active trades in the same account sharing the same
  // market. See TODO.md for more info.
  if (!existingTradeInMarket.empty) return;

  const tradeRef = await initNewTradeFromSignal(signal);

  // Try to create trade in relavent exchange.
  // XXXX TODO: For now just default to using ftx. This will all need a rewrite
  // anyway when I make it use the generalised exchanges api.
  try {
    if (signal.exchanges && signal.exchanges.length > 0) {
      if (signal.exchanges.find((exchange: string) => exchange === 'ftx')) {
        await setupTradeWithLisaMainStrategyOnFtx(
          signal,
          tradeRef,
          accountId,
          marketId,
        );
        // } else if (
        //   signal.exchanges.find((exchange: string) => exchange === 'binance')
        // ) {
        //   throw new Error(`Binance support not yet added.`);
      } else {
        await setupTradeWithLisaMainStrategyOnFtx(
          signal,
          tradeRef,
          accountId,
          marketId,
        );
        // throw new Error(`Could not find supported exchange.`);
      }
    } else {
      await setupTradeWithLisaMainStrategyOnFtx(
        signal,
        tradeRef,
        accountId,
        marketId,
      );
    }
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
    await tradeRef.update({
      error: true,
      errorMessage: error.message,
      didCleanup: false,
    });
  }
};

const createTradeFromSignal = async (signal: any) => {
  const existingTrade = await db
    .collection('trades')
    .where('signalId', '==', signal.id)
    .get();

  // Don't enter trade if one already exists for this signal
  if (!existingTrade.empty) return;

  // // If we didn't record a new trade to DB then abort!
  // if (!tradeRef.get()) throw new Error('Failed to init new trade to DB.');

  if (signal.strategy === 'take-profit-at-targets') {
    await createTradeWithLisaMainStrategy(signal);
  } else if (signal.strategy === 'scalp') {
    // XXX Implement scalp trading... maybe.
  }
};

const listenForSignals = async (): Promise<void> => {
  db.collection(config.SIGNALS_COLLECTION).onSnapshot((snapshot) => {
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
    });
  });
};

export default listenForSignals;
