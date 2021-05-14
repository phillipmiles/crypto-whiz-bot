import puppeteer from 'puppeteer';
import path from 'path';
import {
  scrapPageContentForSignals,
  parseLisaScrapForSignalData,
} from '../webscraper';

const scrapSite = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  const scrapedSignals = await scrapPageContentForSignals(page);

  await browser.close();

  return scrapedSignals;
};

describe('webscraper', () => {
  test('Scrap lisa signals #1', async () => {
    const scrapedArticles = await scrapSite(
      `file:${path.join(__dirname, 'site1.html')}`,
    );
    const articles = parseLisaScrapForSignalData(scrapedArticles);

    expect(articles.length).toBe(3);

    // Remove timestamps as they are imprecise.
    articles[0].timestamp = undefined;
    articles[1].timestamp = undefined;
    articles[2].timestamp = undefined;

    expect(JSON.stringify(articles[0])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-STORJ-1620396000000',
        coin: 'STORJ',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620626919270,
        entryPrice: { low: 2.3, high: 2.45 },
        stopLossPrice: 2.2,
        targets: [2.78, 3.29, 3.75],
        isRisky: false,
        exchanges: ['huobi', 'binance', 'ftx'],
      }),
    );
    expect(JSON.stringify(articles[1])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-BADGER-1620396000000',
        coin: 'BADGER',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620396000000,
        entryPrice: { low: 34.1, high: 36 },
        stopLossPrice: 32.5,
        targets: [39.45, 40.9, 44.8, 48.33],
        isRisky: false,
        exchanges: ['huobi', 'binance', 'ftx'],
      }),
    );
    expect(JSON.stringify(articles[2])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-HBAR-1620309600000',
        coin: 'HBAR',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620309600000,
        entryPrice: { low: 0.2979, high: 0.3152 },
        stopLossPrice: 0.2865,
        targets: [0.3366, 0.3763, 0.4184, 0.4841, 0.5413],
        isRisky: false,
        exchanges: ['huobi', 'binance'],
      }),
    );
  });
  test('Scrap lisa signals #2', async () => {
    const scrapedArticles = await scrapSite(
      `file:${path.join(__dirname, 'site2.html')}`,
    );
    const articles = parseLisaScrapForSignalData(scrapedArticles);
    articles[0].timestamp = undefined;
    expect(articles.length).toBe(1);
    expect(JSON.stringify(articles[0])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-THETA-1620482400000',
        coin: 'THETA',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620482400000,
        entryPrice: { low: 11.4, high: 11.9 },
        stopLossPrice: 10.88,
        targets: [13.11, 15.31, 18.11],
        isRisky: false,
        exchanges: ['huobi', 'binance'],
      }),
    );
  });
  test('Scrap lisa signals #3', async () => {
    const scrapedArticles = await scrapSite(
      `file:${path.join(__dirname, 'site3.html')}`,
    );
    const articles = parseLisaScrapForSignalData(scrapedArticles);
    articles[0].timestamp = undefined;
    articles[1].timestamp = undefined;
    articles[2].timestamp = undefined;
    articles[3].timestamp = undefined;

    expect(articles.length).toBe(4);
    expect(JSON.stringify(articles[0])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-LTC-1620914400000',
        coin: 'LTC',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620482400000,
        entryPrice: { low: 306, high: 315 },
        stopLossPrice: 291,
        targets: [349, 389, 443],
        isRisky: false,
        exchanges: ['kucoin', 'huobi', 'binance'],
      }),
    );
    expect(JSON.stringify(articles[1])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-FIL-1620914400000',
        coin: 'FIL',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620482400000,
        entryPrice: { low: 108, high: 116 },
        stopLossPrice: 103,
        targets: [134, 154, 174, 184],
        isRisky: false,
        exchanges: ['huobi', 'binance'],
      }),
    );
    expect(JSON.stringify(articles[2])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-CEL-1620914400000',
        coin: 'CEL',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620482400000,
        entryPrice: { low: 6.8, high: 7.1 },
        stopLossPrice: 6.61,
        targets: [7.7, 8.55, 10.05, 11.59],
        isRisky: false,
        exchanges: ['ftx'],
      }),
    );
    expect(JSON.stringify(articles[3])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-ICP-1620828000000',
        coin: 'ICP',
        author: 'LisaNEdwards',
        side: 'buy',
        // timestamp: 1620482400000,
        entryPrice: { low: 287, high: 303 },
        stopLossPrice: 272,
        targets: [350, 406, 470],
        isRisky: true,
        exchanges: ['kucoin', 'binance', 'ftx'],
      }),
    );
  });
});
