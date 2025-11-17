const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1386289089208123572/XEJ41sIeTnMyNlhsfCx7SfcoHD9pv0_Fd7EnHzj109jWpes-0xDILfe1pvKj3QBvKNm_";

const webhookNotify = async (data) => {
  try {
    await axios.post(DISCORD_WEBHOOK, {
      content: `📡 **IP Lookup Alert**\n\`\`\`
IP: ${data.ip}
Location: ${data.city}, ${data.region}, ${data.country}
Postal: ${data.postal}
ISP: ${data.isp}
Org: ${data.org}
Type: ${data.type}
Device: ${data.device}
Browser: ${data.browser}
App: ${data.app}
Date: ${data.date}
\`\`\`
📍 https://maps.google.com/?q=${data.lat},${data.lon}`
    });
  } catch (err) {
    console.error("❌ Failed to send webhook:", err.message);
  }
};

module.exports = {
  name: "iplookup",
  description: "Lookup IP with device, browser, app, postal, log, and webhook",
  usage: "/iplookup <ip>",
  version: "3.1",
  cooldown: 3,
  credits: "Jonnel",

  execute: async ({ api, event, args }) => {
    const { threadID, senderID } = event;
    const config = require("../config.json");
    const logPath = path.join(__dirname, "..", "iplog.json");

    // Admin-only check
    const adminPath = path.join(__dirname, "..", "admin-config.json");
    let adminOnly = false;
    if (fs.existsSync(adminPath)) {
      try {
        const adminConfig = JSON.parse(fs.readFileSync(adminPath));
        adminOnly = adminConfig.adminOnly || false;
      } catch {}
    }
    if (adminOnly && senderID !== config.ownerID) {
      return api.sendMessage("⛔ Admin-only mode is ON.", threadID);
    }

    if (!args[0]) {
      return api.sendMessage("❌ Usage: /iplookup <ip>", threadID);
    }

    const ip = args[0];

    try {
      const res = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting`);
      const data = res.data;

      if (data.status !== "success") {
        return api.sendMessage(`❌ IP lookup failed: ${data.message}`, threadID);
      }

      // Device and browser
      let deviceInfo = "❓ Unknown Device";
      let browser = "❓ Unknown Browser";
      const ua = (event.userAgent || "").toLowerCase();

      if (ua.includes("android")) {
        const match = ua.match(/android\s([0-9\.]+)/);
        deviceInfo = match ? `🤖 Android ${match[1]}` : "🤖 Android";
      } else if (ua.includes("windows")) deviceInfo = "🪟 Windows";
      else if (ua.includes("iphone")) deviceInfo = "📱 iPhone/iOS";
      else if (ua.includes("linux")) deviceInfo = "🐧 Linux";

      if (ua.includes("chrome/")) {
        const match = ua.match(/chrome\/([0-9]+)/);
        browser = match ? `🌐 Chrome ${match[1]}` : "🌐 Chrome";
      } else if (ua.includes("firefox")) {
        const match = ua.match(/firefox\/([0-9]+)/);
        browser = match ? `🦊 Firefox ${match[1]}` : "🦊 Firefox";
      } else if (ua.includes("safari") && !ua.includes("chrome")) {
        browser = "🧭 Safari";
      }

      const app = event.app || "Messenger";
      const dateTime = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
      const mapsLink = `https://maps.google.com/?q=${data.lat},${data.lon}`;

      const logEntry = {
        ip: data.query,
        country: data.country,
        region: data.regionName,
        city: data.city,
        postal: data.zip || "N/A",
        isp: data.isp,
        org: data.org,
        as: data.as,
        reverse: data.reverse || "N/A",
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        type: data.mobile ? "mobile" : data.proxy ? "proxy" : data.hosting ? "hosting" : "normal",
        date: dateTime,
        device: deviceInfo,
        browser: browser,
        app: app
      };

      // Save to iplog.json
      let logs = [];
      if (fs.existsSync(logPath)) {
        try {
          logs = JSON.parse(fs.readFileSync(logPath));
        } catch {}
      }
      logs.push(logEntry);
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

      // Webhook
      await webhookNotify(logEntry);

      const message = `📡 IP Lookup Result:
\`\`\`
🌐 IP: ${data.query}
🗺️ Country: ${data.country} (${data.countryCode})
🏙️ Region: ${data.regionName}
📌 City: ${data.city}
📬 Postal: ${data.zip || "N/A"}
📶 ISP: ${data.isp}
🌐 Org: ${data.org}
🔢 ASN: ${data.as}
🔁 Reverse: ${data.reverse || "N/A"}
🧭 Maps: ${mapsLink}
📱 Device: ${deviceInfo}
🌐 Browser: ${browser}
📲 App: ${app}
🧾 Type: ${logEntry.type}
🕒 Checked: ${dateTime}
\`\`\``;

      api.sendMessage(message, threadID);
    } catch (err) {
      console.error("❌ Lookup error:", err.message);
      api.sendMessage("❌ Failed to lookup IP.", threadID);
    }
  }
};
