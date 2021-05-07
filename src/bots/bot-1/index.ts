import mange from './manage';
import evaluateMarket from './evaluateMarket';
import config from './config';

const bot = {
  ...config,
  evaluateMarket: evaluateMarket,
  manage: mange,
};

export default bot;
