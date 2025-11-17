const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "katorsex",
    version: "1.1",
    author: "Jonnel 👑 & ChatGPT",
    role: 0,
    shortDescription: "Fetch sample videos from Betadash",
    longDescription: "Show video list (title, thumbnail, and link) from Betadash endpoint without API key.",
    category: "tools",
    guide: {
      en: "{pn} <page number (optional)>\n\nHalimbawa:\n{katorsex}\n{katorsex 2}"
    },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // ================
    // Page Handler
    // ================
    let page = 1; // default
    if (args[0] && !isNaN(args[0])) {
      page = Number(args[0]);
    }

    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/katorsex?page=${page}`;

    try { await api.setMessageReaction("⏳", messageID, () => {}, true); } catch (e) {}
    const loadingMsg = await api.sendMessage(`📡 Fetching videos (page ${page})...`, threadID);

    try {
      const res = await axios.get(apiUrl);
      const results = res.data.results || [];

      if (!results.length) {
        if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
        await api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Walang nahanap na videos sa page na yan.", threadID);
      }

      // Only get 5 results (batch)
      const topVideos = results.slice(0, 5);

      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);

      for (let i = 0; i < topVideos.length; i++) {
        const video = topVideos[i];
        const title = video.title || "Untitled";
        const thumb = video.thumbnail;
        const videoUrl = video.videoUrl;
        const downloadUrl = video.downloadUrl;

        // Download thumbnail
        const filePath = path.join(__dirname, `${Date.now()}_${i}.jpg`);
        const img = await axios.get(thumb, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(img.data, "binary"));

        const msgBody =
          `🎬 *${title}*\n\n` +
          `🔗 Video URL: ${videoUrl}\n` +
          `⬇️ Download: ${downloadUrl}\n\n👑 OWNER: JONNEL SORIANO`;

        await api.sendMessage(
          {
            body: msgBody,
            attachment: fs.createReadStream(filePath)
          },
          threadID
        );

        fs.unlinkSync(filePath);
      }

      await api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (err) {
      console.error("❌ Error fetching Betadash API:", err.message);
      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
      await api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("⚠️ May error habang kumukuha ng data. Subukan ulit mamaya.", threadID);
    }
  },
};