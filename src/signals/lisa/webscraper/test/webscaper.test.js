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
  test('webscaper 1', async () => {
    const scrapedArticles = await scrapSite(
      `file:${path.join(__dirname, 'site.html')}`,
    );
    const articles = parseLisaScrapForSignalData(scrapedArticles);
    console.log(articles);
    expect('CODE123').toBe('CODE123');
  });
});
