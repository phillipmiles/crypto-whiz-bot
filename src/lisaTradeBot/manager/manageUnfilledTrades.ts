import db from '../../db/firebase/db';
import firebase from 'firebase';
import {
  getFills,
  getOrder,
  placeTriggerOrder,
  modifyTriggerOrder,
  TriggerOrder,
  getMarket,
} from '../api/exchangeApi';
import config from '../config';

// This is a particular trading strategy where at each target 20% of the REMAINING
// trade size is sold. Remaining NOT total trade size.
const calculateTargetSellSizes = (
  initialSize: number,
  numOfTargets: number,
  percentage: number,
): number[] => {
  let fallingPercentage = percentage;

  const targetSizes: number[] = [];
  for (let i = 1; i <= numOfTargets; i++) {
    targetSizes.push(initialSize * fallingPercentage);
    fallingPercentage = fallingPercentage - fallingPercentage * 0.2;
  }
  return targetSizes;
};

const setStopLossForTrade = async (trade: any, price: number, size: number) => {
  // Sets stoploss if it doesn't exist or updates existing one.
  if (!trade.xStopLossId) {
    return await placeTriggerOrder(trade.xId, trade.accountId, {
      market: trade.marketId,
      side: trade.side === 'buy' ? 'sell' : 'buy',
      size: size,
      type: 'stop',
      triggerPrice: price,
      retryUntilFilled: true,
    });
  } else {
    return await modifyTriggerOrder(
      trade.xId,
      trade.accountId,
      trade.xStopLossId,
      {
        size: size,
        triggerPrice: price,
      },
    );
  }
};

const setTargetsForTrade = async (
  trade: any,
  size: number,
  targetPrices: number[],
): Promise<TriggerOrder[]> => {
  const triggerOrders = [];

  const targetSellSizes = calculateTargetSellSizes(
    size,
    targetPrices.length,
    0.2,
  );

  const targetOrders = targetPrices.map((target: number, index: number) => {
    return {
      price: target,
      size: targetSellSizes[index],
    };
  });

  for (const target of targetOrders) {
    const targetOrder = await placeTriggerOrder(trade.xId, trade.accountId, {
      market: trade.marketId,
      side: trade.side === 'buy' ? 'sell' : 'buy',
      size: target.size,
      type: 'takeProfit',
      triggerPrice: target.price,
      retryUntilFilled: true,
    });
    triggerOrders.push(targetOrder);
  }
  return triggerOrders;
};

const handleFilledTrade = async (
  trade: any,
  tradeRef: firebase.firestore.DocumentReference,
  signal: any,
  entryOrder: any,
) => {
  // Grab trade fills for easier trade performance monitoring and tax reporting.
  const fills = await getFills(trade.xId, trade.accountId, {
    orderId: trade.xEntryId,
  });

  // Grab fill details ????
  // I think adding the fills is just for monitoring trade
  // performance easier further down the line, rather then as part of the
  // management. Also reporting.
  // Update DB fills ????

  const stopLossOrder = await setStopLossForTrade(
    trade,
    signal.stopLossPrice,
    entryOrder.size,
  );

  // Set targets
  const triggerOrders = await setTargetsForTrade(
    trade,
    entryOrder.size,
    signal.targets,
  );

  // Update DB
  await tradeRef.update({
    status: 'filled',
    remainingSize: entryOrder.size,
    xStopLossId: stopLossOrder.id,
    xTargetIds: firebase.firestore.FieldValue.arrayUnion(
      ...triggerOrders.map((triggerOrder) => triggerOrder.id),
    ),
    xFills: firebase.firestore.FieldValue.arrayUnion(...fills),
  });
};

const handlePartiallyFilledTrade = async (
  trade: any,
  tradeRef: firebase.firestore.DocumentReference,
  signal: any,
  entryOrder: any,
) => {
  const market = await getMarket(trade.xId, trade.marketId);

  // If order is still unfilled check if buy order should be canceled.
  if (
    trade.side === 'buy'
      ? market.price > trade.cancelPrice
      : market.price < trade.cancelPrice
  ) {
    // Check if order has been partially filled.
    if (entryOrder.remainingSize > 0 && entryOrder.filledSize > 0) {
      // forceFillTrade()
    } else {
      // XXX Cancel trade
    }
  } else {
    // Does remaining fill size match whats in DB.
    // If not update DB with fills and update remainingFillSize.
    // Add or update stoploss to match filled size.
  }
};

const manageUnfilledTrade = async (
  tradeSnapshot: firebase.firestore.DocumentSnapshot,
) => {
  const tradeRef = tradeSnapshot.ref;
  const trade = await tradeSnapshot.data();

  if (!trade) throw new Error(`Trade doesn't exist in database.`);

  // Fetch trade's signal
  const signalRef = await db
    .collection(config.SIGNALS_COLLECTION)
    .doc(trade.signalId)
    .get();

  const signal = await signalRef.data();

  if (!signal)
    throw new Error(
      `Cannot find signal ${trade.signalId} from trade ${trade.id}`,
    );

  const entryOrder = await getOrder(trade.xId, trade.accountId, trade.xEntryId);

  // Check if trade has been filled.
  if (entryOrder.status === 'closed' && entryOrder.remainingSize === 0) {
    await handleFilledTrade(trade, tradeRef, signal, entryOrder);
  } else if (entryOrder.remainingSize > 0) {
    await handlePartiallyFilledTrade(trade, tradeRef, signal, entryOrder);
  }
};

const manageUnfilledTrades = async (
  tradesRef: firebase.firestore.CollectionReference,
): Promise<void> => {
  const pendingTradesSnapshot = await tradesRef
    .where('status', '==', 'unfilled')
    .get();

  // XXX Does it matter that the loop isn't awaited???
  pendingTradesSnapshot.forEach(async (doc) => {
    await manageUnfilledTrade(doc);
  });
};

export default manageUnfilledTrades;
