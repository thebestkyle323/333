import fs from 'fs-extra';
import util from 'util';
import dayjs from 'dayjs';
import telegraf from 'telegraf';
import fetch from 'node-fetch';

const { Telegraf } = telegraf;

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const APPLE_NEWS_RSS_URL = 'https://developer.apple.com/news/releases/rss/releases.rss'; // Apple Developer 新闻发布的 RSS 订阅链接

const bot = new Telegraf(TOKEN);

let RETRY_TIME = 5;

async function sendTgMessage(title, link) {
  const message = `${title}\n${link}`;
  await bot.telegram.sendMessage(CHANNEL_ID, message);
}

async function fetchAppleNewsRss() {
  try {
    const res = await fetch(APPLE_NEWS_RSS_URL);
    const xmlText = await res.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(xmlText);
    $('item').each((index, element) => {
      const title = $(element).find('title').text();
      const link = $(element).find('link').text();
      sendTgMessage(title, link);
    });
  } catch (err) {
    console.error('Error fetching Apple News RSS:', err);
  }
}

async function bootstrap() {
  while (RETRY_TIME > 0) {
    try {
      await fetchAppleNewsRss();
      RETRY_TIME = 0; // 成功获取 RSS 后退出重试
    } catch (err) {
      console.error(err);
      RETRY_TIME -= 1;
    }
  }
  process.exit(0);
}

bootstrap();
