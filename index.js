import fs from 'fs-extra';
import util from 'util';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import _ from 'lodash';
import telegraf from 'telegraf';
import axios from 'axios';
import xml2js from 'xml2js';
const { Telegraf } = telegraf;

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const bot = new Telegraf(TOKEN);

let RETRY_TIME = 5;

// 引入所需的模块

const { parseStringPromise } = require('xml2js');

// 定义 RSS 源的 URL
const rssUrl = 'https://developer.apple.com/news/releases/rss/releases.rss'; // 替换为实际的 RSS 源 URL


// 定义抓取函数
async function fetchRssAndSendToTelegram() {
  try {
    // 发送 HTTP GET 请求获取 RSS 数据
    const response = await axios.get(rssUrl);

    // 将 XML 数据解析为 JavaScript 对象
    const xmlData = response.data;
    const parsedData = await parseStringPromise(xmlData);

    // 提取所需的 title 和 link 字段
    const items = parsedData.rss.channel[0].item;
    const markdownMessages = items.map(item => {
      const title = item.title[0];
      const link = item.link[0];
      return `[${title}](${link})`;
    });

    // 合并成一个 Markdown 格式的字符串
    const markdownText = markdownMessages.join('\n');

    // 发送到 Telegram 频道
    await bot.sendMessage(CHANNEL_ID, markdownText, { parse_mode: 'Markdown' });
    console.log('RSS 抓取并发送成功！');
  } catch (error) {
    console.error('Error fetching or sending RSS feed:', error);
  }
}

// 调用抓取函数
fetchRssAndSendToTelegram();

bootstrap();
