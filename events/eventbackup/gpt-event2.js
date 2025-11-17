const axios = require("axios");

const cooldown = new Map(); // userID => timestamp

module.exports = {
  name: "gpt-event",

  async execute({ api, event }) {
    const { senderID, threadID, body } = event;

    if (!body || senderID === api.getCurrentUserID()) return;

    const message = body.trim();
    const messageLower = message.toLowerCase();

    // === Trigger Conditions ===
    const isQuestionMark = message.includes("?");

    const englishTriggers = [
      "how", "what", "why", "who", "when", "where", "which", "can you",
      "should", "explain", "help", "is it", "does", "tell me", "i need",
      "do you", "gpt", "ai", "meaning of", "how to"
    ];

    const tagalogTriggers = [
      "paano", "ano", "bakit", "sino", "kailan", "saan", "alin",
      "pwede ba", "tulungan", "anong", "pwedeng", "ibig sabihin ng",
      "gamit ng", "paano ko", "kelan"
    ];

    const startsWithTrigger = [...englishTriggers, ...tagalogTriggers].some(trigger =>
      messageLower.startsWith(trigger)
    );

    if (!isQuestionMark && !startsWithTrigger) return;

    // === Cooldown Check (30s) ===
    const now = Date.now();
    const last = cooldown.get(senderID);
    if (last && now - last < 30000) return;
    cooldown.set(senderID, now);

    const query = encodeURIComponent(message);
    const apiUrl = `https://api.nekorinn.my.id/ai/gpt-4o?text=${query}`;

    try {
      const res = await axios.get(apiUrl);
      const response = res.data?.result || "❌ No response from GPT API.";
      await api.sendMessage(response, threadID);
    } catch (err) {
      console.error("❌ GPT Error:", err.message);
      await api.sendMessage("⚠️ Error talking to GPT. Try again later.", threadID);
    }
  }
};
