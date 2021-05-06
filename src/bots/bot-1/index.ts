import mange from './manage';
import search from './search';
import config from './config';

const bot = {
  ...config,
  search: search,
  manage: mange,
};

export default bot;
