import puppeteer, { Page } from 'puppeteer';
import { subStringBetween } from '../../../utils/string';
import { Signal } from '../../signal';

interface ArticleScrap {
  title: string;
  author: string;
  date: string;
  time: string;
  content: string;
}

const COIN_STR_START_IDENTIFIER = 'TRADE SIGNAL – $';
const COIN_STR_END_IDENTIFIER = ' – ';

const STOPLOSS_STR_START_IDENTIFIER = 'STOP LOSS $';
const STOPLOSS_STR_END_IDENTIFIER = '(';

const parseForBuyZone = (string: string) => {
  // Built and tested on https://regex101.com/r/e8i8ma/1.
  const regex = /(BUYZONE|BUY ZONE|BUY)\s+\$?\s*(\d+)(.(\d+))?\s*(-|–)\s*\$?\s*(\d+)(.(\d+))?/g;
  const match = string.match(regex);

  if (!match || match.length === 0) return;

  // Split match at - or em dash
  // Parse ints.
  // return buyzones object.
};
const parseForCoin = (str: string): string | undefined => {
  return subStringBetween(
    str,
    COIN_STR_START_IDENTIFIER,
    COIN_STR_END_IDENTIFIER,
  );
};

const parseForStopLoss = (str: string): number | undefined => {
  const stopLossStr = subStringBetween(
    str,
    STOPLOSS_STR_START_IDENTIFIER,
    STOPLOSS_STR_END_IDENTIFIER,
  );

  if (!stopLossStr || stopLossStr.length > 10) return;

  return parseFloat(stopLossStr);
};

export const parseLisaScrapForSignalData = (
  scrapedArticles: ArticleScrap[],
): Signal[] => {
  const signals: Signal[] = [];

  scrapedArticles.forEach((scrapedArticle) => {
    const { date, content } = scrapedArticle;
    const timestamp = new Date(date).getTime();

    const coin = parseForCoin(content);
    if (!coin) return;

    const stopLoss = parseForStopLoss(content);
    if (!stopLoss) return;

    parseForBuyZone(content);

    const signal = {
      // ID makes assumption that an author will never create multiple signals
      // for the same coin on the same day.
      id: `LisaNEdwards-BTC-${timestamp}`,
      coin: coin,
      author: 'LisaNEdwards',
      timestamp: timestamp,
      buyzone: {
        lowerbound: 34.1,
        upperbound: 36.0,
      },
      stopLossPrice: stopLoss,
      targets: [39.45, 40.9, 44.8, 48.33],
    };
    signals.push(signal);
  });

  return signals;
};

const loginToPage = async (page: Page): Promise<any> => {
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
  // await page.click('input[id=wp-submit]');
  // await page.waitForNavigation();
  const [response] = await Promise.all([
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

export const scrapLisa = async (): Promise<void> => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await loginToPage(page);
  await page.goto('https://gettingstartedincrypto.com/signals/');

  const scrapedSignals = await scrapPageContentForSignals(page);

  console.log(scrapedSignals);

  await browser.close();
  const signals = parseLisaScrapForSignalData(scrapedSignals);
  console.log(signals);
};
