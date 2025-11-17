const axios = require("axios");

// Cooldown map: userID => timestamp
const cooldown = new Map();

module.exports = {
  config: {
    name: "gpt-event",
    version: "2.4",
    author: "Jonnel",
    description: "Auto-reply with Gemini Vision using Kaiz API",
    eventType: ["message", "message_reply"]
  },

  async run({ api, event }) {
    const { senderID, threadID, body, messageID } = event;

    if (!body || senderID === api.getCurrentUserID()) return;

    const now = Date.now();
    const lastUsed = cooldown.get(senderID);
    if (lastUsed && now - lastUsed < 60000) return; // 1-minute cooldown

    cooldown.set(senderID, now);

    const query = encodeURIComponent(body.trim());
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-vision?q=${query}&uid=1&imageUrl=&apikey=4c92e1a3-4b13-4890-bff2-c494425a1d1d`;

    try {
      const res = await axios.get(apiUrl);
      console.log("🔍 Gemini API Raw Response:", res.data);

      const reply = res.data?.response || "❌ Walang sagot mula sa Gemini.";
      await api.sendMessage(reply, threadID, messageID);
    } catch (err) {
      console.error("❌ Gemini API Error:", err.message);
      await api.sendMessage("⚠️ Error: Hindi makausap si Gemini ngayon.", threadID, messageID);
    }
  }
};
