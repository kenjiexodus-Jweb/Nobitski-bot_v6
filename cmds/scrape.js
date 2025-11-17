const axios = require("axios");
const cheerio = require("cheerio");
const { format } = require("date-fns");
const dns = require("dns").promises;
const { URL } = require("url");
const fs = require("fs");

// === Config ===
const TELEGRAM_TOKEN = "8478033153:AAHitUt7iOLWMlNRtkiQSbI0NKwk44FbaB0";
const TELEGRAM_CHAT_ID = "7540290780";
const ADMIN_UID = "100082770721408";

// Resolve IP and Port
async function resolveIPandPort(targetUrl) {
  try {
    const parsed = new URL(/^https?:\/\//.test(targetUrl) ? targetUrl : `https://${targetUrl}`);
    const hostname = parsed.hostname;
    const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
    const { address } = await dns.lookup(hostname);
    return { ip: address, port };
  } catch {
    return { ip: "Unknown", port: "Unknown" };
  }
}

// GeoIP Lookup
async function geoIP(ip) {
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org`);
    const data = res.data;
    if (data.status !== "success") throw new Error("GeoIP failed");
    return {
      country: data.country,
      region: data.regionName,
      city: data.city,
      org: data.org || data.isp || "Unknown"
    };
  } catch {
    return {
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      org: "Unknown"
    };
  }
}

// Send to Telegram
async function sendToTelegram(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML"
    });
  } catch (err) {
    console.error("❌ Telegram error:", err.message);
  }
}

// Save to local logs
function appendToLogFile(logText) {
  fs.appendFileSync("scrape_logs.txt", logText + "\n\n", "utf8");
}

module.exports = {
  name: "scrape",
  version: "3.4.0",
  description: "Scrape a website and send output to Messenger and Telegram",
  usage: "scrape <url>",
  cooldown: 10,
  hasPermission: 0,
  credits: "Nikox (updated by Jonnel)",

  async execute({ api, event, args }) {
    const { threadID, senderID, messageID } = event;

    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ This command is restricted to the developer.", threadID, () =>
        setTimeout(() => api.unsendMessage(messageID), 10000)
      );
    }

    const input = args[0];
    if (!input) {
      return api.sendMessage("❌ Please provide a URL.\nUsage: scrape <url>", threadID);
    }

    const url = /^https?:\/\//.test(input) ? input : `https://${input}`;

    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (NikoxScraper)" }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const title = $("title").text() || "No title";
      const description = $('meta[name="description"]').attr("content") || "No description";
      const keywords = $('meta[name="keywords"]').attr("content") || "No keywords";
      const h1 = $("h1").first().text() || "No H1";
      const h2 = $("h2").first().text() || "No H2";
      const charset = $('meta[charset]').attr("charset") || "Unknown";
      const lang = $("html").attr("lang") || "Unknown";
      const imgSrc = $("img").first().attr("src") || "No image";

      const { ip, port } = await resolveIPandPort(url);
      const geo = await geoIP(ip);
      const dateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${geo.city}, ${geo.region}, ${geo.country}`)}`;

      const message = `🌐 SCRAPED SITE INFO

🕒 Date & Time: ${dateTime}
🔗 URL: ${url}
🌍 IP: ${ip}
🔌 Port: ${port}
🏙️ Location: ${geo.city}, ${geo.region}, ${geo.country}
📍 Google Maps: ${mapLink}
🏢 ISP/ORG: ${geo.org}

🔖 Title: ${title}
📄 Description: ${description}
🔑 Keywords: ${keywords}
🧱 H1: ${h1}
🔡 H2: ${h2}
🖼️ Image: ${imgSrc}
🌐 Charset: ${charset}
🗣️ Language: ${lang}`;

      await api.sendMessage(message, threadID);
      await sendToTelegram(message);
      appendToLogFile(`[${dateTime}] ${url}\nIP: ${ip} (${geo.city}, ${geo.region})\nTitle: ${title}`);
    } catch (err) {
      console.error("❌ Scrape error:", err.message);
      await api.sendMessage("⚠️ Failed to scrape.", threadID, () =>
        setTimeout(() => api.unsendMessage(messageID), 10000)
      );
    }
  }
};