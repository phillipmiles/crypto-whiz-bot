import * as dotenv from 'dotenv';
dotenv.config();
import { signInWithEmailAndPassword } from '../db/firebase/api/auth';
import db from '../db/firebase/db';

const addFakeSignal = async () => {
  if (process.env.FIREBASE_DB_LOGIN && process.env.FIREBASE_DB_PASSWORD) {
    await signInWithEmailAndPassword(
      process.env.FIREBASE_DB_LOGIN,
      process.env.FIREBASE_DB_PASSWORD,
    );
  }

  const fakeSignals = [
    {
      id: 'LisaNEdwards-DOGE-1620655200000',
      author: 'LisaNEdwards',
      strategy: 'take-profit-at-targets',
      coin: 'DOGE',
      entryPrice: {
        high: 0.37,
        low: 0.31,
      },
      side: 'buy',
      stopLossPrice: 0.29,
      targets: [0.478, 0.539, 0.661, 0.748, 0.878],
      timestamp: new Date().getTime(),
    },
    {
      id: 'LisaNEdwards-CHZ-1620655200000',
      author: 'LisaNEdwards',
      strategy: 'take-profit-at-targets',
      coin: 'CHZ',
      entryPrice: {
        high: 0.393,
        low: 0.374,
      },
      side: 'buy',
      stopLossPrice: 0.354,
      targets: [0.443, 0.494, 0.625, 0.801],
      timestamp: 1620733536055,
      exchanges: ['binance', 'ftx'],
    },
  ];

  // Batch commit.
  const batch = db.batch();
  fakeSignals.forEach((doc) => {
    const docRef = db.collection('fake-signals').doc(doc.id);
    batch.set(docRef, doc);
  });
  batch.commit();
  console.log('commited');
};

console.log('Adding');

addFakeSignal();

console.log('Added');
