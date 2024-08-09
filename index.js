import { Telegraf } from 'telegraf';
import axios from 'axios';
import dayjs from 'dayjs';

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const RSS_FEED_URL = 'https://developer.apple.com/news/releases/rss/releases.rss';  // 替换为你的 RSS 源链接

const bot = new Telegraf(TOKEN);

async function fetchRssFeed() {
  try {
    const response = await axios.get(RSS_FEED_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch RSS feed:', error);
    return null;
  }
}

async function formatAndSendToTelegram(feed) {
  if (!feed || !feed.items) {
    console.error('Invalid RSS feed format');
    return;
  }

  const items = feed.items.slice(0, 5); // 只处理前 5 条
  const markdownLines = items.map((item, index) => {
    return `${index + 1}. [${item.title}](${item.link})`;
  });

  const message = `
${dayjs().format('YYYY-MM-DD HH:mm:ss')} RSS Feed:
${markdownLines.join('\n')}
`;

  try {
    await bot.telegram.sendMessage(CHANNEL_ID, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
    console.log('Message sent successfully');
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

async function main() {
  const feed = await fetchRssFeed();
  if (feed) {
    await formatAndSendToTelegram(feed);
  }
}

main();
