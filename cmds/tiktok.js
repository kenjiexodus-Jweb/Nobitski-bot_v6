const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    version: "1.3",
    author: "Jonnel",
    countDown: 5,
    role: 0,
    shortDescription: "Search TikTok videos",
    longDescription: "Search and send a random TikTok video from a keyword",
    category: "media",
    guide: {
      en: "{p}tiktok [keyword]"
    }
  },

  onStart: async function ({ message, args, api, event }) {
    const query = args.join(" ") || "cute cat";
    const apiUrl = `https://rapido.zetsu.xyz/api/tk?search=${encodeURIComponent(query)}`;

    // React with status
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    // Remove status reaction after 5 seconds
    setTimeout(() => {
      api.setMessageReaction("", event.messageID, () => {}, true);
    }, 5000);

    try {
      const res = await axios.get(apiUrl);
      if (!res.data.status || res.data.count === 0) {
        return api.sendMessage("❌ Walang nahanap na video.", event.threadID, event.messageID);
      }

      const video = res.data.data[Math.floor(Math.random() * res.data.data.length)];
      const filePath = path.join(__dirname, "cache", `tiktok_${Date.now()}.mp4`);

      const videoRes = await axios.get(video.video_url, { responseType: "stream" });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        videoRes.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Send video with branding
      api.sendMessage({
        body: `🎥 Jonnel TikTok\n🎬 ${video.title}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error habang kumukuha ng TikTok video.", event.threadID, event.messageID);
    }
  }
};
