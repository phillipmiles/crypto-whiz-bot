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
    expect(JSON.stringify(articles[0])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-BTC-1620396000000',
        coin: 'STORJ',
        author: 'LisaNEdwards',
        side: 'buy',
        timestamp: 1620396000000,
        entryPrice: { lowerbound: 2.3, upperbound: 2.45 },
        stopLossPrice: 2.2,
        targets: [2.78, 3.29, 3.75],
      }),
    );
    expect(JSON.stringify(articles[1])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-BTC-1620396000000',
        coin: 'BADGER',
        author: 'LisaNEdwards',
        side: 'buy',
        timestamp: 1620396000000,
        entryPrice: { lowerbound: 34.1, upperbound: 36 },
        stopLossPrice: 32.5,
        targets: [39.45, 40.9, 44.8, 48.33],
      }),
    );
    expect(JSON.stringify(articles[2])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-BTC-1620309600000',
        coin: 'HBAR',
        author: 'LisaNEdwards',
        side: 'buy',
        timestamp: 1620309600000,
        entryPrice: { lowerbound: 0.2979, upperbound: 0.3152 },
        stopLossPrice: 0.2865,
        targets: [0.3366, 0.3763, 0.4184, 0.4841, 0.5413],
      }),
    );
  });
  test('Scrap lisa signals #2', async () => {
    const scrapedArticles = await scrapSite(
      `file:${path.join(__dirname, 'site2.html')}`,
    );
    const articles = parseLisaScrapForSignalData(scrapedArticles);
    expect(articles.length).toBe(1);
    expect(JSON.stringify(articles[0])).toBe(
      JSON.stringify({
        id: 'LisaNEdwards-BTC-1620482400000',
        coin: 'THETA',
        author: 'LisaNEdwards',
        side: 'buy',
        timestamp: 1620482400000,
        entryPrice: { lowerbound: 11.4, upperbound: 11.9 },
        stopLossPrice: 10.88,
        targets: [13.11, 15.31, 18.11],
      }),
    );
  });
});
