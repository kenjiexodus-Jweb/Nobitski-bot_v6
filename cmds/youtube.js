const axios = require("axios");

module.exports = {
  config: {
    name: "youtube",
    version: "1.1",
    author: "Jonnel Soriano 👑",
    role: 0,
    shortDescription: "Search YouTube videos",
    longDescription: "Search and fetch top YouTube videos using Haji-Mix API.",
    category: "tools",
    guide: {
      en: "{pn} <search keyword>\n\nHalimbawa:\nyoutube bagyong uwan"
    },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(
        "⚠️ Pakilagay ang keyword para maghanap sa YouTube.\n\nHalimbawa: youtube bagyong uwan",
        threadID,
        messageID
      );
    }

    const query = args.join(" ");
    const apiKey = "b4d62c41ceb8af172f8f592bea566cb441c4e541c37915d04169cca7c5ee675f";
    const apiUrl = `https://haji-mix-api.gleeze.com/api/youtube?search=${encodeURIComponent(
      query
    )}&stream=false&limit=5&api_key=${apiKey}`;

    // Send "fetching" message + set loading reaction
    try { await api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}
    const loadingMsg = await api.sendMessage(
      `🔍 Fetching top YouTube results for: *${query}*...`,
      threadID
    );

    try {
      const res = await axios.get(apiUrl);
      const data = res.data;

      // Dynamic detection: result or data
      const videosList = data.result || data.data || [];

      if (!videosList || videosList.length === 0) {
        if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
        await api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Walang nahanap na resulta sa YouTube.", threadID);
      }

      const videos = videosList.slice(0, 5).map(
        (v, i) =>
          `🎬 ${i + 1}. ${v.title}\n📺 Channel: ${v.channel || v.author || "Unknown"}\n🔗 Link: ${v.url}`
      ).join("\n\n");

      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);

      await api.sendMessage(
        `✅ *Top 5 YouTube Results for:* ${query}\n\n${videos}\n\n👑 OWNER: JONNEL SORIANO`,
        threadID
      );

      await api.setMessageReaction("✅", messageID, () => {}, true);
      setTimeout(() => api.setMessageReaction("", messageID, () => {}, true), 4000);

    } catch (err) {
      console.error("❌ YouTube API Error:", err.message);
      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
      await api.setMessageReaction("❌", messageID, () => {}, true);
      const errMsg = await api.sendMessage(
        "⚠️ May error habang kumukuha ng data sa YouTube. Subukan ulit mamaya.",
        threadID
      );
      setTimeout(() => api.unsendMessage(errMsg.messageID), 20000);
    }
  },
};