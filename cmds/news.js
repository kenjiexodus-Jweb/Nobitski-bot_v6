const axios = require("axios");

module.exports = {
  config: {
    name: "news",
    version: "1.0",
    author: "Jonnel Soriano",
    description: "Fetch latest news based on a keyword",
    category: "fun",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID } = event;
    const query = args.join(" ") || "corruption in the Philippines"; // default query
    api.sendMessage("📰 Fetching latest news...", threadID);

    try {
      const res = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/news?q=${encodeURIComponent(query)}`);
      if (res.data && Array.isArray(res.data.articles) && res.data.articles.length > 0) {
        // Take top 3 news
        const topNews = res.data.articles.slice(0, 3);
        const msg = topNews.map((n, i) => `📰 *News ${i + 1}*\nTitle: ${n.title}\nSource: ${n.source || "Unknown"}\nURL: ${n.url}\n`).join("\n");
        return api.sendMessage(msg, threadID);
      } else {
        return api.sendMessage("⚠️ No news found for this keyword.", threadID);
      }
    } catch (err) {
      console.error("❌ News API Error:", err.message);
      return api.sendMessage("❌ Error fetching news. Try again later.", threadID);
    }
  }
};