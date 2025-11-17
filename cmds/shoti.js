const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "shoti",
    version: "2.0",
    author: "Jonnel x Kaizenji (Updated by Jonnel Soriano)",
    role: 0,
    shortDescription: "Auto generate and send random Shoti video",
    longDescription: "Automatic Shoti video generator using Haji-Mix API",
    category: "fun",
    guide: {
      en: "{pn} — sends a random Shoti video"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const apiKey = "b4d62c41ceb8af172f8f592bea566cb441c4e541c37915d04169cca7c5ee675f";
    const apiUrl = `https://haji-mix-api.gleeze.com/api/shoti?stream=true&api_key=${apiKey}`;

    // Send waiting message
    const waitMsg = await api.sendMessage("🎬 Generating your Shoti video, please wait...", threadID);
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const videoBuffer = response.data;

      const videoPath = path.join(__dirname, `../temp/shoti_${Date.now()}.mp4`);
      fs.writeFileSync(videoPath, videoBuffer);

      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

      await api.sendMessage(
        {
          body: "💃 Here’s your random Shoti video!",
          attachment: fs.createReadStream(videoPath)
        },
        threadID
      );

      fs.unlinkSync(videoPath);
      api.setMessageReaction("✅", messageID, () => {}, true);
      setTimeout(() => api.setMessageReaction("", messageID, () => {}, true), 4000);
    } catch (err) {
      console.error("❌ Shoti Error:", err.message);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
      const errMsg = await api.sendMessage("⚠️ Error fetching Shoti video. Please try again later.", threadID);
      setTimeout(() => api.unsendMessage(errMsg.messageID), 20000);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};