"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapLisa = exports.scrapPageContentForSignals = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const string_1 = require("../../../utils/string");
const COIN_STR_START_IDENTIFIER = 'TRADE SIGNAL – $';
const COIN_STR_END_IDENTIFIER = ' – ';
const STOPLOSS_STR_START_IDENTIFIER = 'STOP LOSS $';
const STOPLOSS_STR_END_IDENTIFIER = '(';
const parseForBuyZone = (string) => {
    // Built and tested on https://regex101.com/r/e8i8ma/1.
    const regex = /(BUYZONE|BUY ZONE|BUY)\s+\$?\s*(\d+)(.(\d+))?\s*(-|–)\s*\$?\s*(\d+)(.(\d+))?/g;
    const match = string.match(regex);
    if (!match || match.length === 0)
        return;
    // Split match at - or em dash
    // Parse ints.
    // return buyzones object.
};
const parseForCoin = (str) => {
    return string_1.subStringBetween(str, COIN_STR_START_IDENTIFIER, COIN_STR_END_IDENTIFIER);
};
const parseForStopLoss = (str) => {
    const stopLossStr = string_1.subStringBetween(str, STOPLOSS_STR_START_IDENTIFIER, STOPLOSS_STR_END_IDENTIFIER);
    if (!stopLossStr || stopLossStr.length > 10)
        return;
    return parseFloat(stopLossStr);
};
const parseLisaScrapForSignalData = (scrapedArticles) => {
    const signals = [];
    scrapedArticles.forEach((scrapedArticle) => {
        const { date, content } = scrapedArticle;
        const timestamp = new Date(date).getTime();
        const coin = parseForCoin(content);
        if (!coin)
            return;
        const stopLoss = parseForStopLoss(content);
        if (!stopLoss)
            return;
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
const loginToPage = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const login = process.env.LISA_LOGIN;
    const password = process.env.LISA_PASSWORD;
    if (!login || !password) {
        return;
    }
    yield page.goto('https://gettingstartedincrypto.com/wp-login.php');
    yield page.click('input[id=user_login]');
    yield page.waitForTimeout(1000);
    yield page.keyboard.type(login);
    yield page.click('input[id=user_pass]');
    yield page.waitForTimeout(1000);
    yield page.keyboard.type(password);
    // await page.click('input[id=wp-submit]');
    // await page.waitForNavigation();
    const [response] = yield Promise.all([
        page.waitForNavigation(),
        page.click('input[id=wp-submit]'), // Clicking the link will indirectly cause a navigation
    ]);
    return page;
});
const scrapPageContentForSignals = (page) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const articleHandlers = yield page.$$('article');
    const articles = [];
    try {
        for (var articleHandlers_1 = __asyncValues(articleHandlers), articleHandlers_1_1; articleHandlers_1_1 = yield articleHandlers_1.next(), !articleHandlers_1_1.done;) {
            const articleHandler = articleHandlers_1_1.value;
            const title = yield articleHandler.$eval('.elementor-post__title', (el) => el.textContent);
            const author = yield articleHandler.$eval('.elementor-post-author', (el) => el.textContent);
            const date = yield articleHandler.$eval('.elementor-post-date', (el) => el.textContent);
            const time = yield articleHandler.$eval('.elementor-post-time', (el) => el.textContent);
            const content = yield articleHandler.$eval('.elementor-post__text', (el) => el.textContent);
            articles.push({
                title: title ? title.trim() : '',
                author: author ? author.trim() : '',
                date: date ? date.trim() : '',
                time: time ? time.trim() : '',
                content: content ? content.trim().replace(/\t/g, '') : '',
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (articleHandlers_1_1 && !articleHandlers_1_1.done && (_a = articleHandlers_1.return)) yield _a.call(articleHandlers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return articles;
});
exports.scrapPageContentForSignals = scrapPageContentForSignals;
const scrapLisa = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch();
    const page = yield browser.newPage();
    yield loginToPage(page);
    yield page.goto('https://gettingstartedincrypto.com/signals/');
    const scrapedSignals = yield exports.scrapPageContentForSignals(page);
    console.log(scrapedSignals);
    yield browser.close();
    const signals = parseLisaScrapForSignalData(scrapedSignals);
    console.log(signals);
});
exports.scrapLisa = scrapLisa;
