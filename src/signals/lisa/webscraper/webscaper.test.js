import puppeteer from 'puppeteer';
import path from 'path';
import { scrapPageContentForSignals } from './webscraper';

const scrapSite = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  const scrapedSignals = await scrapPageContentForSignals(page);

  return scrapedSignals;
};

describe('webscraper', () => {
  test('webscaper 1', async () => {
    const articles = await scrapSite(
      `file:${path.join(__dirname, 'site.html')}`,
    );
    console.log(articles);
    expect('CODE123').toBe('CODE123');
  });
});
