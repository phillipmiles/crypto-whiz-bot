import * as dotenv from 'dotenv';
import { toMilliseconds } from '../../utils/time';
dotenv.config();
import { scrapLisaForSignals } from './webscraper/webscraper';

const log = (message: any) => {
  console.log(message);
};

const pollForSignals = async (debug: boolean) => {
  const poll = true;

  while (poll) {
    const signals = await scrapLisaForSignals();

    // Put into da firebase
    if (debug) {
      log(signals);
    }
    console.log(toMilliseconds(1, 'minutes'));
    const interval =
      Math.floor(Math.random() * toMilliseconds(1, 'minutes')) + 1;

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

const debug = true;

pollForSignals(debug);
