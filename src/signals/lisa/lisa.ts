import * as dotenv from 'dotenv';
import { toMilliseconds } from '../../utils/time';
dotenv.config();
import { scrapLisaForSignals } from './webscraper/webscraper';
import { signInWithEmailAndPassword } from '../../db/firebase/api/auth';
import { getSignals } from '../../db/firebase/api/signals';
import puppeteer from 'puppeteer';
import db from '../../db/firebase/db';
import { Signal } from '../signal';

const log = (message: any) => {
  console.log(message);
};

const saveSignals = async (signals: Signal[]) => {
  if (process.env.FIREBASE_DB_LOGIN && process.env.FIREBASE_DB_PASSWORD) {
    await signInWithEmailAndPassword(
      process.env.FIREBASE_DB_LOGIN,
      process.env.FIREBASE_DB_PASSWORD,
    );
  }

  const response = await getSignals();
  const savedSignals: any[] = [];

  response.forEach((doc) => {
    savedSignals.push(doc.data());
  });

  // XXX WARNING: This operation gets more expensive the larger the data set.
  // Can't find a good way to add only if doesn't exist though. This is important
  // because the timestamp field gets more inaccurate after the first hour of
  // a signals creation due to relying on relative 'X hours ago' time definition
  // on raw signals.
  const filteredSignals = signals.filter(
    (signal) =>
      !savedSignals.find((savedSignal) => signal.id === savedSignal.id),
  );

  // Batch commit.
  const batch = db.batch();
  filteredSignals.forEach((doc) => {
    const docRef = db.collection('signals').doc(doc.id);
    batch.set(docRef, doc);
  });
  return batch.commit();
};

const pollForSignals = async (debug: boolean) => {
  const poll = true;

  while (poll) {
    // Shifted browser to open and close on each loop as there appears to be
    // a time limit that the browser can run for. Around 15 to 30 minutes
    // before it gets automatically closed.
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const signals = await scrapLisaForSignals(page);

    // Put into da firebase if not already in it.
    if (debug) {
      log(signals);
    }

    // 3 hours ago
    // now 19:13
    // 1620627225334 16:13
    // 1620627535218 16:18
    // 1620627762368 16:22 (3 hours ago); - assume it was made at 4:30 or 13:30
    // 1620624865827 15:34:25 ('4 hours ago');

    if (signals && signals.length > 0) {
      // Add signals to db.
      await saveSignals(signals);
    }

    // Set a timeout between 3 and 6 minutes to make this look less bot like.
    const interval =
      Math.floor(Math.random() * toMilliseconds(3, 'minutes')) +
      toMilliseconds(3, 'minutes');
    await browser.close();
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

const debug = true;

pollForSignals(debug);
