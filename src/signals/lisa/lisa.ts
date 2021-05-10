import * as dotenv from 'dotenv';
import { toMilliseconds, toSeconds } from '../../utils/time';
dotenv.config();
import { scrapLisaForSignals } from './webscraper/webscraper';
import { signInWithEmailAndPassword } from '../../db/firebase/api/auth';
import { getSignals } from '../../db/firebase/api/signals';
import puppeteer from 'puppeteer';

const log = (message: any) => {
  console.log(message);
};

const pollForSignals = async (debug: boolean) => {
  const poll = true;

  if (process.env.FIREBASE_DB_LOGIN && process.env.FIREBASE_DB_PASSWORD) {
    await signInWithEmailAndPassword(
      process.env.FIREBASE_DB_LOGIN,
      process.env.FIREBASE_DB_PASSWORD,
    );

    const response = await getSignals();
    const signals = [];
    response.forEach((doc) => {
      console.log(doc.data());
      signals.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    // console.log(signals);
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  while (poll) {
    const signals = await scrapLisaForSignals(page);

    // Put into da firebase if not already in it.
    if (debug) {
      log(signals);
    }

    // Set a timeout betwee 3 and 6 minutes to make this look less bot like.
    const interval =
      Math.floor(Math.random() * toMilliseconds(3, 'minutes')) +
      toMilliseconds(3, 'minutes');

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  await browser.close();
};

const debug = true;

pollForSignals(debug);
