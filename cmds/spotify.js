const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "spotify",
  version: "5.4",
  hasPrefix: false,
  description: "Spotify-style song search with direct MP3 download (using BetaDash API)",
  usage: "spotify <song name>",
  credits: "JONNEL SORIANO",

  async execute({ api, event, args }) {
    const autoDelete = 30000;

    if (!args[0]) {
      const msg = await api.sendMessage(
        "🎧 Usage: spotify <song name>\nExample: spotify Beautiful in White",
        event.threadID
      );
      setTimeout(() => api.unsendMessage(msg.messageID), autoDelete);
      return;
    }

    const query = args.join(" ");
    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/spt?title=${encodeURIComponent(query)}`;

    try {
      const loading = await api.sendMessage("🔍 Searching and preparing your song...", event.threadID);

      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data || !data.result || !data.result.download_url) {
        const err = await api.sendMessage("❌ No result found or invalid API response.", event.threadID);
        setTimeout(() => api.unsendMessage(err.messageID), autoDelete);
        await api.unsendMessage(loading.messageID);
        return;
      }

      const result = data.result;
      const title = result.title || "Unknown Title";
      const artist = result.artist || "Unknown Artist";
      const thumbnail = result.thumbnail || "https://i.imgur.com/ZJj2K5S.png";
      const audioUrl = result.download_url;

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // Download MP3
      const mp3Path = path.join(__dirname, `spotify_${Date.now()}.mp3`);
      const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(mp3Path, audioRes.data);

      // Download Thumbnail
      const imgPath = path.join(__dirname, `cover_${Date.now()}.jpg`);
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);

      await api.unsendMessage(loading.messageID);

      await api.sendMessage(
        {
          body: `🎧 SPOTIFY STYLE\n\n🎵 Title: ${title}\n🎤 Artist: ${artist}\n👑 OWNER: JONNEL SORIANO`,
          attachment: fs.createReadStream(imgPath),
        },
        event.threadID
      );
      fs.unlinkSync(imgPath);

      await api.sendMessage(
        {
          body: "✅ Here's your song 🎶",
          attachment: fs.createReadStream(mp3Path),
        },
        event.threadID
      );

      fs.unlinkSync(mp3Path);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      setTimeout(() => api.setMessageReaction("", event.messageID, () => {}, true), 4000);
    } catch (err) {
      console.error("❌ Spotify Error:", err.message);
      const errMsg = await api.sendMessage("❌ Error fetching the song. Please try again later.", event.threadID);
      setTimeout(() => api.unsendMessage(errMsg.messageID), autoDelete);
    }
  },
};