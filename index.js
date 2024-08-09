import fs from 'fs-extra';
import util from 'util';
import dayjs from 'dayjs';
import telegraf from 'telegraf';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const { Telegraf } = telegraf;

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const APPLE_NEWS_RSS_URL = 'https://developer.apple.com/news/releases/rss/releases.rss'; // Apple Developer 新闻发布的 RSS 订阅链接

const bot = new Telegraf(TOKEN);

let RETRY_TIME = 5;

async function sendTgMessage(messages) {
  const message = messages.join('\n');
  await bot.telegram.sendMessage(CHANNEL_ID, message, { parse_mode: 'Markdown' });
}

async function fetchAppleNewsRss() {
  try {
    const res = await fetch(APPLE_NEWS_RSS_URL);
    const xmlText = await res.text();
    const $ = cheerio.load(xmlText, { xmlMode: true });

    const lastBuildDateString = $('channel > lastBuildDate').text();
    const lastBuildDate = dayjs(lastBuildDateString, 'ddd, DD MMM YYYY HH:mm:ss ZZ');

    const messages = [];

    $('item').each((index, element) => {
      const title = $(element).find('title').text();
      const link = $(element).find('link').text();
      const pubDateString = $(element).find('pubDate').text();
      const pubDate = dayjs(pubDateString, 'ddd, DD MMM YYYY HH:mm:ss ZZ');

      if (lastBuildDate.isAfter(dayjs().subtract(7, 'days')) && pubDate.isAfter(dayjs().subtract(7, 'days'))) {
        messages.push(`[${title}](${link}) - ${pubDate.format('YYYY-MM-DD HH:mm:ss')}`);
      }
    });

    if (messages.length > 0) {
      await sendTgMessage(messages);
    } else {
      console.log('No new items found in the last 7 days.');
    }
  } catch (err) {
    console.error('Error fetching Apple News RSS:', err);
  }
}

async function bootstrap() {
  try {
    await fetchAppleNewsRss();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1); // 出错时退出进程
  }
}

bootstrap();
