const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "lyrics",
  version: "2.3",
  hasPrefix: false,
  description: "Search and get lyrics using Betadash API with loading indicator",
  usage: "lyrics <song name>",
  credits: "Jonnel x Betadash",

  async execute({ api, event, args, message }) {
    try {
      if (args.length === 0) {
        return api.sendMessage(
          "❗ Usage: lyrics <song name>\n\nHalimbawa: lyrics Bakit Pa Ba",
          event.threadID,
          event.messageID
        );
      }

      const query = args.join(" ");

      // Animated loading message
      const loadingMsg = await message(`⏳ Kinukuha ang lyrics ng: "${query}"...`);

      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/lyrics-finder?title=${encodeURIComponent(query)}`;
      const res = await axios.get(apiUrl, { timeout: 15000 });
      const data = res.data;

      if (!data || !data.lyrics) {
        if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
        return api.sendMessage(
          "❌ Walang lyrics na nahanap para sa kantang iyan.",
          event.threadID,
          event.messageID
        );
      }

      // Download thumbnail if available
      let attachment = null;
      if (data.thumbnail) {
        try {
          const thumbPath = path.join(__dirname, "cache", "lyrics_thumb.jpg");
          const img = await axios.get(data.thumbnail, { responseType: "arraybuffer" });
          fs.writeFileSync(thumbPath, Buffer.from(img.data, "binary"));
          attachment = fs.createReadStream(thumbPath);
        } catch {
          attachment = null;
        }
      }

      const messageBody = `🎶 𝗧𝗶𝘁𝗹𝗲: ${data.title || "Unknown Title"}\n\n${data.lyrics}\n\n📜 Lyrics fetched by Betadash API`;

      // Delete loading message
      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);

      api.sendMessage(
        { body: messageBody, attachment },
        event.threadID,
        () => {
          // cleanup temp image if downloaded
          if (attachment) fs.unlinkSync(path.join(__dirname, "cache", "lyrics_thumb.jpg"));
        },
        event.messageID
      );
    } catch (err) {
      console.error("[lyrics] Error:", err.message);
      api.sendMessage(
        "⚠️ Nagkaroon ng error habang kumukuha ng lyrics. Subukan ulit mamaya.",
        event.threadID,
        event.messageID
      );
    }
  },
};