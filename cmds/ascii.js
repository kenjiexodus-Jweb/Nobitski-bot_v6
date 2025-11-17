const axios = require("axios");

module.exports = {
  config: {
    name: "ascii",
    version: "1.0",
    author: "Jonnel Soriano",
    description: "Generate ASCII art from text",
    category: "fun",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID } = event;

    if (!args || args.length === 0) {
      return api.sendMessage("⚠️ Usage: ascii <TEXT>\nExample: ascii JONNEL", threadID);
    }

    const text = args.join(" ");
    const waitMsg = await api.sendMessage("🖋️ Generating ASCII art...", threadID);

    try {
      const res = await axios.get(`https://artii.herokuapp.com/make?text=${encodeURIComponent(text)}`);
      const asciiArt = res.data;

      if (waitMsg?.messageID) await api.unsendMessage(waitMsg.messageID);

      // Send ASCII art (code block for formatting)
      await api.sendMessage(`\`\`\`\n${asciiArt}\n\`\`\``, threadID);
    } catch (err) {
      if (waitMsg?.messageID) await api.unsendMessage(waitMsg.messageID);
      console.error("❌ ASCII API Error:", err.message);
      return api.sendMessage("❌ Failed to generate ASCII art.", threadID);
    }
  }
};