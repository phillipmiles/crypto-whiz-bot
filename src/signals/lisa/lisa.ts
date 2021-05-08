import * as dotenv from 'dotenv';
dotenv.config();
import { scrapLisa } from './webscraper/webscraper';

const lookForSignals = async () => {
  await scrapLisa();
};

lookForSignals();
