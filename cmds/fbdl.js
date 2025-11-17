const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fbdl",
    version: "1.2",
    author: "Jonnel",
    countDown: 15,
    role: 0,
    shortDescription: "Auto FB Download",
    longDescription: "Download and send high-quality Facebook videos",
    category: "media",
    guide: "{pn} <facebook video url>"
  },

  execute: async function ({ api, event, args, message }) {
    const { threadID } = event;

    if (!args[0] || !args[0].includes("facebook.com")) {
      return message("❗ Please provide a valid Facebook video URL.", threadID);
    }

    const header = "🟢⚪🔴  🤖 𝗔𝗨𝗧𝗢 𝗙𝗕 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗕𝗬 𝗡𝗢𝗕𝗜𝗧𝗔 🤖  🟢⚪🔴\n";

    let fetchingMsg;
    try {
      fetchingMsg = await message(header + "⏳ Fetching Facebook video...", threadID);

      // Ensure cache directory exists
      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

      const form = new FormData();
      form.append("k_exp", "1749611486");
      form.append("k_token", "aa26d4a3b2bf844c8af6757179b85c10ab6975dacd30b55ef79d0d695f7ea764");
      form.append("q", args[0]);
      form.append("lang", "en");
      form.append("web", "fdownloader.net");
      form.append("v", "v2");

      const res = await axios.post("https://v3.fdownloader.net/api/ajaxSearch", form, {
        headers: form.getHeaders(),
        timeout: 10000
      });

      if (res.data.status !== "ok" || !res.data.data) {
        throw new Error("❌ No video found or invalid link.");
      }

      const html = res.data.data;
      const links = [];
      const regex = /<a href="(https:\/\/dl\.snapcdn\.app\/download\?token=[^"]+)"[^>]*>Download<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const qualityMatch = html.substring(0, match.index).match(/video-quality[^>]*>([^<]+)</);
        if (qualityMatch) links.push({ url: match[1], quality: qualityMatch[1].trim() });
      }

      if (links.length === 0) throw new Error("❌ No downloadable links found.");
      links.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
      const best = links[links.length - 1];

      const cleanQuality = best.quality.toUpperCase().replace(/\(HD\)/, "").trim();

      const filePath = path.join(cachePath, `fb_${Date.now()}.mp4`);
      const videoRes = await axios.get(best.url, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      videoRes.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Delete fetching message
      if (fetchingMsg?.messageID) setTimeout(() => api.unsendMessage(fetchingMsg.messageID), 10000);

      // Send final video
      await message({
        body: header +
              `✅ FACEBOOK VIDEO (${cleanQuality} HD)\n\n` +
              "💻 API: Jonnel Soriano\n" +
              "👑 Bot Owner: Jonnel Soriano",
        attachment: fs.createReadStream(filePath)
      }, threadID);

      // Keep file in cache (do NOT delete)
      
    } catch (err) {
      console.error("❌ fbdl error:", err.message);
      if (fetchingMsg?.messageID) api.unsendMessage(fetchingMsg.messageID);

      const errMsg = await message(header + `⚠️ Could not fetch the video.\nError: ${err.message}`, threadID);
      if (errMsg?.messageID) setTimeout(() => api.unsendMessage(errMsg.messageID), 10000);
    }
  }
};