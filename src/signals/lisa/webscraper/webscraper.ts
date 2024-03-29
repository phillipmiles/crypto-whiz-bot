import { Page } from 'puppeteer';
import { getMarket } from '../../../lisaTradeBot/api/ftx/api';
import {
  convertRelativeTimeStringToMilliseconds,
  toMilliseconds,
} from '../../../utils/time';
import { Signal } from '../../signal';

const floatRegex = /(\d+)(.(\d+))?/g;

interface ArticleScrap {
  title: string;
  author: string;
  date: string;
  time: string;
  content: string;
}

const removeComma = (str: string): string => {
  return str.replace(/,/g, '');
};

const parseForScalp = (str: string): boolean => {
  const scalpLineRegex = /SCALP/g;
  const scalpLineMatches = str.match(scalpLineRegex);

  if (scalpLineMatches && scalpLineMatches.length > 0) return true;

  return false;
};

const parseForHighRisk = (str: string): boolean => {
  const riskLineRegex = /((HIGH|HIGHER|MORE)\W+RISK|\WRISKY)\W/g;
  const riskLineMatches = str.match(riskLineRegex);

  if (riskLineMatches && riskLineMatches.length > 0) return true;

  return false;
};

const parseForExchanges = (str: string): string[] | undefined => {
  const exchangeLineRegex = /\w+\s+for\s+this\s+signal\W/g;
  const exchangeLineMatches = str.match(exchangeLineRegex);
  const exchanges: string[] = [];

  if (!exchangeLineMatches || exchangeLineMatches.length === 0) return;

  exchangeLineMatches.forEach((line) => {
    const split = line.split(' ');

    if (split[0]) exchanges.push(split[0].toLowerCase());
  });

  return exchanges;
};

const parseForTargets = (str: string): number[] | undefined => {
  const targetsLineRegex = /TARGET\s+\d\s*((–|-)\s*)?\$?\s*(\d+)(.(\d+))?/g;

  const lineMatches = str.match(targetsLineRegex);
  if (!lineMatches || lineMatches.length === 0) return;

  const targets: number[] = [];

  lineMatches.forEach((line) => {
    const targetString = line.match(floatRegex);
    if (!targetString || targetString.length === -1) return;

    // Use index 1 not 0 as we want to skip the target number and get to the price.
    if (targetString[1].indexOf(',') >= 0) {
      targets.push(parseFloat(removeComma(targetString[1])));
    } else {
      targets.push(parseFloat(targetString[1]));
    }
  });

  if (targets.length < 1) return;

  return targets;
};

const parseForBuyZone = (string: string) => {
  // Built and tested on https://regex101.com/r/e8i8ma/1.
  const buyzoneLineRegex = /(BUYZONE|BUY ZONE|BUY)\s+\$?\s*(\d+)(.(\d+))?\s*(-|–)\s*\$?\s*(\d+)(.(\d+))?/g;
  const splitDelimRegex = /(-|–)/g;

  const lineMatch = string.match(buyzoneLineRegex);

  if (!lineMatch || lineMatch.length === 0) return;

  const buyzoneSplitIndex = lineMatch[0].search(splitDelimRegex);

  if (buyzoneSplitIndex === -1) return;

  const buyzone1String = lineMatch[0].slice(0, buyzoneSplitIndex);
  const buyzone2String = lineMatch[0].slice(buyzoneSplitIndex);

  if (!buyzone1String || !buyzone2String) return;

  const buyzone1Price = buyzone1String.match(floatRegex);
  const buyzone2Price = buyzone2String.match(floatRegex);

  if (!buyzone1Price || !buyzone2Price) return;

  let buyzone1Float;
  let buyzone2Float;

  // Remove comma if one exists before converting to a float.
  if (buyzone1Price[0].indexOf(',') >= 0) {
    buyzone1Float = parseFloat(removeComma(buyzone1Price[0]));
  } else {
    buyzone1Float = parseFloat(buyzone1Price[0]);
  }

  if (buyzone2Price[0].indexOf(',') >= 0) {
    buyzone2Float = parseFloat(removeComma(buyzone2Price[0]));
  } else {
    buyzone2Float = parseFloat(buyzone2Price[0]);
  }

  return {
    low: buyzone1Float > buyzone2Float ? buyzone2Float : buyzone1Float,
    high: buyzone1Float > buyzone2Float ? buyzone1Float : buyzone2Float,
  };
};

const parseForCoin = (str: string): string | undefined => {
  const coinLineRegex = /TRADE\s+SIGNAL\s+(-|–)\s+\$[A-Z]{3,6}/g;
  const lineMatch = str.match(coinLineRegex);
  if (!lineMatch || lineMatch.length === 0) return;

  const coinStartIndex = lineMatch[0].indexOf('$');

  return lineMatch[0].substring(coinStartIndex + 1);
};

const parseForStopLoss = (str: string): number | undefined => {
  const stopLossLineRegex = /STOP\s*LOSS\s*\$\s*(\d+)(.(\d+))?/g;
  const lineMatch = str.match(stopLossLineRegex);
  if (!lineMatch || lineMatch.length === 0) return;

  const stopLossStartIndex = lineMatch[0].indexOf('$');
  const stopLoss = lineMatch[0].substring(stopLossStartIndex + 1);

  // Remove comma if one exists before converting to a float.
  if (stopLoss.indexOf(',') >= 0) {
    return parseFloat(removeComma(stopLoss));
  } else {
    return parseFloat(stopLoss);
  }
};

const defineSignalTimestamp = (date: string, time: string): number => {
  const relativeTimeAgo = convertRelativeTimeStringToMilliseconds(time);

  if (relativeTimeAgo) {
    return new Date().getTime() - relativeTimeAgo;
  } else {
    return new Date(date).getTime();
  }
};

export const parseLisaScrapForSignalData = (
  scrapedArticles: ArticleScrap[],
): Signal[] => {
  const signals: Signal[] = [];

  scrapedArticles.forEach((scrapedArticle) => {
    const { date, time, content } = scrapedArticle;
    const timestamp = defineSignalTimestamp(date, time);
    const datestamp = new Date(date).getTime();

    // Lisa signals are all long signals.
    const side = 'buy';

    const coin = parseForCoin(content);
    if (!coin) return;

    const stopLoss = parseForStopLoss(content);
    if (!stopLoss) return;

    const buyzone = parseForBuyZone(content);

    if (!buyzone) return;

    const targets = parseForTargets(content);

    if (!targets) return;

    // Validates that found targets are above buy price if it's a long signal, or below
    const targetsAreValid = targets.reduce(
      (accumulator, target) =>
        accumulator &&
        !!target &&
        (side === 'buy' ? target > buyzone.high : target < buyzone.high),
      true,
    );

    if (!targetsAreValid) return;

    const exchanges = parseForExchanges(content);

    const isRisky = parseForHighRisk(content);
    const isScalpTrade = parseForScalp(content);

    // XXX Don't bother dealing with trades with the term scalp in them for the
    // time being. Can change this later but I'll likily have to change parseForCoin's
    // regex to include 'BTC Scalp' or 'BTC Scalp trade'.
    if (isScalpTrade) return;

    const author = 'LisaNEdwards';
    // Hardcoding lisa's markets as coin/usd ones.
    const marketId = `${coin}/USD`;

    const signal = {
      // ID makes assumption that an author will never create multiple signals
      // for the same coin on the same day. If assumption is wrong then the only
      // result is that the latest signal isn't recorded. Big whoop.
      id: `${author}-${coin}-${datestamp}`,
      coin: coin,
      marketId: marketId,
      author: author,
      side: side,
      timestamp: timestamp,
      entryPrice: buyzone,
      stopLossPrice: stopLoss,
      targets: targets,
      isRisky: isRisky,
      exchanges: exchanges,
    };
    signals.push(signal);
  });

  return signals;
};

export const loginToPage = async (page: Page): Promise<any> => {
  const login = process.env.LISA_LOGIN;
  const password = process.env.LISA_PASSWORD;

  if (!login || !password) {
    return;
  }

  await page.goto('https://gettingstartedincrypto.com/wp-login.php');

  await page.click('input[id=user_login]');
  await page.waitForTimeout(1000);
  await page.keyboard.type(login);
  await page.click('input[id=user_pass]');
  await page.waitForTimeout(1000);
  await page.keyboard.type(password);
  await page.waitForTimeout(1000);
  await Promise.all([
    page.waitForNavigation(), // The promise resolves after navigation has finished
    page.click('input[id=wp-submit]'), // Clicking the link will indirectly cause a navigation
  ]);
  return page;
};

export const scrapPageContentForSignals = async (page: Page): Promise<any> => {
  const articleHandlers = await page.$$('article');
  const articles = [];

  for await (const articleHandler of articleHandlers) {
    const title = await articleHandler.$eval(
      '.elementor-post__title',
      (el) => el.textContent,
    );
    const author = await articleHandler.$eval(
      '.elementor-post-author',
      (el) => el.textContent,
    );
    const date = await articleHandler.$eval(
      '.elementor-post-date',
      (el) => el.textContent,
    );
    const time = await articleHandler.$eval(
      '.elementor-post-time',
      (el) => el.textContent,
    );
    const content = await articleHandler.$eval(
      '.elementor-post__text',
      (el) => el.textContent,
    );

    articles.push({
      title: title ? title.trim() : '',
      author: author ? author.trim() : '',
      date: date ? date.trim() : '',
      time: time ? time.trim() : '',
      content: content ? content.trim().replace(/\t/g, '') : '',
    });
  }

  return articles;
};

export const scrapLisaForSignals = async (page: Page): Promise<Signal[]> => {
  // await loginToPage(page);
  await page.goto('https://gettingstartedincrypto.com/signals/');

  // Checks if we can see articles on the page. If not, should mean
  // that we are unauthenticated.
  if (!(await page.$('article'))) {
    await loginToPage(page);
    await page.goto('https://gettingstartedincrypto.com/signals/', {
      waitUntil: 'domcontentloaded', //Should stop timeout bugs
    });
  }
  const scrapedSignals = await scrapPageContentForSignals(page);
  const signals = parseLisaScrapForSignalData(scrapedSignals);

  // Prevent signals found older then 1 hour ago from being returned.
  // We can't generate an accurate time of signal down to the minute which
  // makes the timestamp too unreliable for using.
  const recentSignals = signals.filter(
    (signal) =>
      signal.timestamp > new Date().getTime() - toMilliseconds(1, 'hours'),
  );

  // XXX TODO Validate recent signal's buy zone is actually close to what is recorded in signal?
  return recentSignals;
};
