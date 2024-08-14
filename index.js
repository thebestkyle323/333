import dayjs from 'dayjs';
import Telegraf from 'telegraf';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const bot = new Telegraf(process.env.TOKEN);

async function sendTgMessage(title, messages, imageUrl) {
  const message = messages.join('\n');
  try {
    await bot.telegram.sendPhoto(process.env.CHANNEL_ID, { url: imageUrl }, {
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
    const res = await fetch('https://developer.apple.com/news/releases/rss/releases.rss');
    const xmlText = await res.text();
    const $ = cheerio.load(xmlText, { xmlMode: true });

    const lastBuildDateString = $('channel > lastBuildDate').text();
    const lastBuildDate = dayjs(lastBuildDateString, 'ddd, DD MMM YYYY HH:mm:ss ZZ');

    const messages = [];

    let index = 1; // 初始化序号

    $('item').each((_, element) => {
      const title = $(element).find('title').text();
      const link = $(element).find('link').text();
      const pubDateString = $(element).find('pubDate').text();
      const pubDate = dayjs(pubDateString, 'ddd, DD MMM YYYY HH:mm:ss ZZ');

      // 修改为 58 小时内的内容
      if (lastBuildDate.isAfter(dayjs().subtract(58, 'hours')) && pubDate.isAfter(dayjs().subtract(58, 'hours'))) {
        messages.push(`${index}. [${title}](${link}) - ${pubDate.format('YYYY-MM-DD')}`);
        index++; // 增加序号
      }
    });

    if (messages.length > 0) {
      const imageUrl = 'https://app.iwanshare.club/uploads/20240809/e0eb992abff3daa8fe192de457a8039c.jpg'; // 图片 URL
      const title = 'Apple发布系统更新'; // 固定标题
      await sendTgMessage(title, messages, imageUrl);
    } else {
      console.log('No new items found in the last 58 hours.');
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
