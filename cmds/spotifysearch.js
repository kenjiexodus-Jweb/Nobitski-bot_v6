// cmds/spotifysearch.js
const axios = require("axios");

module.exports = {
  name: "spotifysearch",
  version: "1.2",
  description: "Search Spotify tracks using BetaDash API",
  guide: "spotifysearch <song name>",
  category: "music",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args || args.length === 0) {
      return api.sendMessage(
        "❌ Please provide a song name. Usage: spotifysearch <song name>",
        threadID
      );
    }

    const query = args.join(" ");
    const url = `https://betadash-api-swordslush-production.up.railway.app/spt?title=${encodeURIComponent(query)}`;

    try {
      // React to original message with ⌛ while searching
      await api.setMessageReaction("⌛", messageID, (err) => { if(err) console.log(err); });

      // Send searching message
      const searchingMsg = await api.sendMessage(`🔍 Searching music 🎶\nPlease wait a moment...`, threadID);

      const res = await axios.get(url);
      const tracks = res.data; // expects array of results

      // Remove ⌛ react & add ✅
      await api.setMessageReaction("✅", messageID, (err) => { if(err) console.log(err); });

      if (!tracks || tracks.length === 0) {
        await api.unsendMessage(searchingMsg.messageID);
        return api.sendMessage(`❌ No results found for "${query}"`, threadID);
      }

      // Build message with style
      let msg = `🟢⚪🔴 SPOTIFY SONG 🔴⚪🟢\nSearch Results for "${query}"\n─────────────────────────────\n`;

      tracks.slice(0, 5).forEach((track, i) => {
        msg += `${i + 1}. ${track.title} 🎶\n`;
        msg += `👤 Artist: ${track.author || track.artist}\n`;
        msg += `⏱ Duration: ${track.duration || "Unknown"}\n`;
        msg += `🔗 Listen: ${track.trackUrl || track.url}\n`;
        msg += `🖼 Thumbnail: ${track.thumbnail || "No thumbnail"}\n─────────────────────────────\n`;
      });

      msg += `Enjoy listening! 🎧\n\n__________________________\nPowered by: Jonnel Soriano 👑`;

      // Send final message
      await api.sendMessage(msg, threadID);

      // Delete searching message
      await api.unsendMessage(searchingMsg.messageID);

    } catch (err) {
      console.error("Spotify search error:", err.message);
      return api.sendMessage("❌ Error fetching Spotify results. Try again later.", threadID);
    }
  }
};