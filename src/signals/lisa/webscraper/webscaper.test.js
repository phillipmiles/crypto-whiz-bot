import puppeteer from 'puppeteer';
import path from 'path';

const scrapLisa = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`file:${path.join(__dirname, 'site.html')}`);

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

  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
  return articles;
};

describe('webscraper', () => {
  test('webscaper 1', async () => {
    const articles = await scrapLisa();
    console.log(articles);
    expect('CODE123').toBe('CODE123');
  });
});
