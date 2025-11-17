const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anime",
    aliases: ["animetop", "animelist"],
    version: "1.2",
    author: "Jonnel",
    countDown: 5,
    role: 0,
    description: "Show popular anime with images from Haji Mix API"
  },

  onStart: async function ({ api, event, args }) {
    const page = args[0] || 1;
    const apiKey = "8672951c715e5945e70b9da2663e3bbc2a3e7c678738a094057e3117c3a699ea";
    const url = `https://haji-mix-api.gleeze.com/api/anime/popular?page=${page}&api_key=${apiKey}`;

    try {
      const res = await axios.get(url);
      const list = res.data.recommendations;

      if (!list || list.length === 0) {
        return api.sendMessage("❌ Walang nahanap na anime sa page na ito.", event.threadID, event.messageID);
      }

      const topAnime = list.slice(0, 3);
      const attachments = [];

      // Siguraduhing may cache folder
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (const anime of topAnime) {
        const item = anime.anyCard;
        const imagePath = path.join(cacheDir, `${item._id}.jpg`);

        const response = await axios.get(item.thumbnail, { responseType: "stream" });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        attachments.push(fs.createReadStream(imagePath));
      }

      // Build caption with design
      let caption = `☕ 𝗡𝗘𝗦𝗖𝗔𝗙𝗘 𝗖𝗟𝗔𝗦𝗦𝗜𝗖 🟢⚪🔴\n`;
      caption += `📄 Page: ${page}\n👨‍💻 Creator: Jonnel Soriano\n━━━━━━━━━━━━━━━━\n\n`;

      topAnime.forEach((anime, i) => {
        const a = anime.anyCard;
        caption += `🎌 𝗡𝗮𝗺𝗲: ${a.englishName || a.name}\n`;
        caption += `📊 𝗦𝗰𝗼𝗿𝗲: ${a.score}\n`;
        caption += `📺 𝗦𝘂𝗯: ${a.availableEpisodes.sub}, 𝗗𝘂𝗯: ${a.availableEpisodes.dub}\n`;
        caption += `━━━━━━━━━━━━━━━━\n\n`;
      });

      caption += `👨‍💻 Bot developer by: Jonnel Soriano\n☕ Bot Name: 𝗡𝗘𝗦𝗖𝗔𝗙𝗘 𝗖𝗟𝗔𝗦𝗦𝗜𝗖`;

      return api.sendMessage({
        body: caption,
        attachment: attachments
      }, event.threadID, async () => {
        // Clean up images after sending
        for (const anime of topAnime) {
          const imagePath = path.join(cacheDir, `${anime.anyCard._id}.jpg`);
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
      }, event.messageID);

    } catch (err) {
      console.error("❌ Anime command error:", err);
      return api.sendMessage("❌ Error fetching or sending anime data.", event.threadID, event.messageID);
    }
  }
};