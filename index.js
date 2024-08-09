import fs from 'fs-extra';
import util from 'util';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import _ from 'lodash';
import telegraf from 'telegraf';
const { Telegraf } = telegraf;


const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const bot = new Telegraf(TOKEN);

let RETRY_TIME = 5;


// 引入必要的模块
const axios = require('axios');
const { parseString } = require('xml2js');

// 定义 RSS 源的 URL
const rssUrl = 'https://developer.apple.com/news/releases/rss/releases.rss'; // 替换为实际的 RSS 源 URL

// Telegram Bot 的 Token 和频道 ID
const TELEGRAM_BOT_TOKEN = 'your_telegram_bot_token'; // 替换成你的 Telegram Bot Token
const TELEGRAM_CHANNEL_ID = '@your_channel_id'; // 替换成你的 Telegram 频道 ID

// 发起 HTTP 请求获取 RSS 数据
axios.get(rssUrl)
  .then(response => {
    // 解析 XML 数据
    parseString(response.data, (err, result) => {
      if (err) {
        console.error('Error parsing RSS XML:', err);
        return;
      }

      // 解析得到的 RSS 数据
      const rssItems = result.rss.channel[0].item;

      // 构建 Markdown 格式的消息内容
      const markdownContent = rssItems.map(item => `- [${item.title}](${item.link})`).join('\n');

      // 发送到 Telegram 频道
      sendTelegramMessage(markdownContent);
    });
  })
  .catch(error => {
    console.error('Error fetching RSS feed:', error);
  });

// 函数：使用 Telegram Bot 发送消息到频道
function sendTelegramMessage(message) {
  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHANNEL_ID,
    text: message,
    parse_mode: 'Markdown'
  })
  .then(response => {
    console.log('Message sent to Telegram:', response.data);
  })
  .catch(error => {
    console.error('Error sending message to Telegram:', error);
  });
}

