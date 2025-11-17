const axios = require("axios");

module.exports = {
  config: {
    name: "phivolcs",
    version: "1.0",
    author: "Jonnel Soriano",
    description: "Get latest earthquake info from PHIVOLCS",
    category: "info",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID } = event;
    if (!args || args.length === 0) {
      return api.sendMessage("⚠️ Usage: phivolcs <search query>\nExample: phivolcs lindol in the Philippines", threadID);
    }

    const query = args.join(" ");
    api.sendMessage(`🌋 Fetching PHIVOLCS info for: ${query}...`, threadID);

    try {
      const res = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/phivolcs?info=${encodeURIComponent(query)}`);
      if (res.data && res.data.result) {
        const info = res.data.result;
        let msg = `🌋 PHIVOLCS Info for: ${query}\n\n`;
        if (Array.isArray(info)) {
          info.forEach((item, i) => {
            msg += `📌 #${i+1}\n`;
            for (const key in item) {
              msg += `• ${key}: ${item[key]}\n`;
            }
            msg += `\n`;
          });
        } else {
          for (const key in info) {
            msg += `• ${key}: ${info[key]}\n`;
          }
        }
        return api.sendMessage(msg, threadID);
      } else {
        return api.sendMessage("⚠️ No information found.", threadID);
      }
    } catch (err) {
      console.error("❌ PHIVOLCS API Error:", err.message);
      return api.sendMessage("❌ Error fetching PHIVOLCS info. Try again later.", threadID);
    }
  }
};