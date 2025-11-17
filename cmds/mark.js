const axios = require("axios");

module.exports = {
  config: {
    name: "mark",
    version: "1.1",
    author: "Jonnel Soriano",
    description: "Create styled text using Mark API",
    category: "fun",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args || args.length === 0) {
      return api.sendMessage(
        "⚠️ Usage: mark <text>\nExample: mark pogi mo bossing",
        threadID,
        messageID
      );
    }

    const text = args.join(" ");

    // Add a loading reaction/message
    try { await api.setMessageReaction("🖋️", messageID, () => {}, true); } catch {}

    const loadingMsg = await api.sendMessage(`🖋️ Generating styled text for: "${text}"...`, threadID);

    try {
      const res = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/mark?text=${encodeURIComponent(text)}`);

      if (res.data && res.data.result) {
        await api.sendMessage(`🖋️ 𝗦𝘁𝘆𝗹𝗲𝗱 𝗧𝗲𝘅𝘁:\n\n${res.data.result}`, threadID);
      } else {
        await api.sendMessage("⚠️ Failed to create styled text.", threadID);
      }
    } catch (err) {
      console.error("❌ Mark API Error:", err.message);
      await api.sendMessage("❌ Error creating styled text. Try again later.", threadID);
    } finally {
      // Remove loading message
      try { if (loadingMsg?.messageID) await api.unsendMessage(loadingMsg.messageID); } catch {}
    }
  }
};