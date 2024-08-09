import fetch from 'node-fetch';
import cheerio from 'cheerio';
import dayjs from 'dayjs';
import Telegraf from 'telegraf'; // 注意这里的导入方式变为整体导入
import dotenv from 'dotenv';

dotenv.config();

const { TOKEN, CHANNEL_ID } = process.env;
const APPLE_NEWS_RSS_URL = 'https://developer.apple.com/news/releases/rss/releases.rss'; // Apple Developer 新闻发布的 RSS 订阅链接

const bot = new Telegraf.Telegraf(TOKEN); // 这里也需要调整为使用 Telegraf.Telegraf

async function sendTgMessage(title, messages, imageUrl) {
  const message = messages.join('\n');
  try {
    await bot.telegram.sendPhoto(CHANNEL_ID, { url: imageUrl }, {
      caption: `*${title}*\n\n${message}`,
      parse_mode: 'Markdown'
    });
    console.log('Message sent successfully to Telegram channel.');
  } catch (err) {
    console.error('Error sending message to Telegram:', err);
  }
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
      const imageUrl = 'http://app.iwanshare.club/uploads/20240809/e0eb992abff3daa8fe192de457a8039c.jpg'; // 替换为您的图片链接
      const title = 'Apple发布系统更新'; // 固定的标题
      await sendTgMessage(title, messages, imageUrl);
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
