import * as dotenv from 'dotenv';
import { toMilliseconds } from '../utils/time';
dotenv.config();
import { signInWithEmailAndPassword } from '../db/firebase/api/auth';
import db from '../db/firebase/db';
// import puppeteer from 'puppeteer';
// import db from '../../db/firebase/db';
// import { Signal } from '../signal';
import listenForSignals from './listenForSignals';
import firebase from 'firebase';
import {
  cancelOrder,
  cancelTriggerOrder,
  getOrder,
  placeOrder,
} from './api/exchangeApi';

const log = (message: any) => {
  console.log(message);
};

// const saveSignals = async (signals: Signal[]) => {
//   if (process.env.FIREBASE_DB_LOGIN && process.env.FIREBASE_DB_PASSWORD) {
//     await signInWithEmailAndPassword(
//       process.env.FIREBASE_DB_LOGIN,
//       process.env.FIREBASE_DB_PASSWORD,
//     );
//   }

//   const response = await getSignals();
//   const savedSignals: any[] = [];

//   response.forEach((doc) => {
//     savedSignals.push(doc.data());
//   });

//   // XXX WARNING: This operation gets more expensive the larger the data set.
//   // Can't find a good way to add only if doesn't exist though. This is important
//   // because the timestamp field gets more inaccurate after the first hour of
//   // a signals creation due to relying on relative 'X hours ago' time definition
//   // on raw signals.
//   const filteredSignals = signals.filter(
//     (signal) =>
//       !savedSignals.find((savedSignal) => signal.id === savedSignal.id),
//   );

//   // Batch commit.
//   const batch = db.batch();
//   filteredSignals.forEach((doc) => {
//     const docRef = db.collection('signals').doc(doc.id);
//     batch.set(docRef, doc);
//   });
//   return batch.commit();
// };

const cleanUpTrade = async (tradeRef: any): Promise<any> => {
  const {
    accountId,
    xId,
    xEntryId,
    xStopLossId,
    xTargetIds,
    marketId,
    side,
    remainingSize,
  } = await tradeRef.data();

  if (xId) {
    // Cleanup entry order
    if (xEntryId) {
      const order = await getOrder(xId, accountId, xEntryId);

      // Cancel the order if it is still open.
      if (order.status === 'open' || order.status === 'new') {
        await cancelOrder(xId, accountId, xEntryId);
      }
    }

    if (xTargetIds && xTargetIds.length > 0) {
      // If order not filled - cancel it.
      // Cleanup targets orders
      for (const targetId of xTargetIds) {
        await cancelTriggerOrder(xId, accountId, targetId);
      }
    }

    if (xStopLossId) {
      // XXXX NEED TO GET TRIGGER ORDER SOMEONHOW AND ECHECK STATUS OF IT!!!
      // const stopLossOrder = await getOrder(xId, xEntryId);
      // If order not filled - cancel it.
      // Cleanup stoploss order
      await cancelTriggerOrder(xId, accountId, xStopLossId);
    }

    // Sell off whatever is left on trade at market price.
    if (remainingSize > 0) {
      // XXX Note: At the moment this all only supports spot trades
      // so we can't actually sell more then we own. But I suppose
      // it's possible another signal has also bought into this market
      // so it's good to be getting this right now anyway.
      await placeOrder(xId, accountId, {
        market: marketId,
        side: side === 'buy' ? 'sell' : 'buy',
        price: null,
        type: 'market',
        size: remainingSize,
      });
    }
  }

  // Mark trade as closed and cleaned up.
  await tradeRef.update({ status: 'closed', didCleanup: true });
};

const manageInitTrades = async (
  tradesRef: firebase.firestore.CollectionReference,
): Promise<void> => {
  console.log('Mange init');
};

const manageWaitingForEntryTrades = async (
  tradesRef: firebase.firestore.CollectionReference,
): Promise<void> => {
  const pendingTradesSnapshot = await tradesRef
    .where('status', '==', 'waiting-for-entry')
    .get();

  pendingTradesSnapshot.forEach((doc) => {
    const pendingTrade = doc.data();
    console.log(pendingTrade);
    // XXX If market price has shifted to far away - cancel
    // XXX If too much time has passed - cancel

    // XXX Trade that gets filled or even partially filled need to update status to 'filled' i think ?
    // and also need to update remainingSize value on trade to whatever has been filled.
  });
};

const manageFilledTrades = async (
  tradesRef: firebase.firestore.CollectionReference,
): Promise<void> => {
  console.log('Manage filled');
};

const manageErrorTrades = async (
  tradesRef: firebase.firestore.CollectionReference,
): Promise<void> => {
  // Find trades with errors and that have not yet cleaned up.
  const errorTradesSnapshot = await tradesRef
    .where('error', '==', true)
    .where('didCleanup', '==', false)
    .get();

  errorTradesSnapshot.forEach(async (doc) => {
    // XXXX TODO Test try catch block working in this forEach loop.
    try {
      await cleanUpTrade(doc);
    } catch (error) {
      console.log(`Failed to clean up trade ${doc.id}`);
      // XXX TODO Log this to Sentry!
    }
  });
};

const manageOpenTrades = async (debug: boolean): Promise<void> => {
  // Manager need to check for any trades with state 'waiting-for-entry'
  // that the market hasn't deviated too far from buy order OR that
  // not too much time hasn't passed by weeks.
  //
  // If trade has flag error: true then manager should handle cleanup. Once cleanup
  // is complete - set state to 'closed' and leave error flag on as true.
  //
  // XXXXXXX
  // Manager should look out for trades that say 'initialising' but have a timestamp that
  // is older then 5 minutes. Something went wrong initialising ????????
  // XXXXXX// XXXXXX
  // Need to manage stoploss movement after new targets are hit.
  // xXXXXXX
  // Need to close trades that have hit stoploss - remove remaining take profit orders
  // and make trade status as closed
  // XXXXXXX
  // Need to mark trades that have been filled as 'filled' from 'waiting-for-entry'
  // XXXXXX// XXXXXX// XXXXXX// XXXXXX// XXXXXX// XXXXXX
  const MANAGER_LOOP_INTERVAL = toMilliseconds(1, 'minutes');
  const poll = true;

  while (poll) {
    try {
      const tradesRef = await db.collection('trades');

      // manageWaitingForEntryTrades(tradesRef);
      manageErrorTrades(tradesRef);
    } catch (error) {
      console.log(error);
    }

    await new Promise((resolve) => setTimeout(resolve, MANAGER_LOOP_INTERVAL));
  }
};

const debug = true;

const runProgram = async () => {
  // XXX TODO: Do I need to manually reauthenticate after a while????
  if (process.env.FIREBASE_DB_LOGIN && process.env.FIREBASE_DB_PASSWORD) {
    await signInWithEmailAndPassword(
      process.env.FIREBASE_DB_LOGIN,
      process.env.FIREBASE_DB_PASSWORD,
    );
  }
  console.log('Authenticated');
  listenForSignals();
  manageOpenTrades(debug);
};

runProgram();
