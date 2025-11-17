// cmds/book.js
const axios = require("axios");

module.exports = {
  config: {
    name: "book",
    version: "1.1",
    role: 0, // 0 = everyone can use
    countDown: 5, // Cooldown in seconds
    guide: {
      en: "book [number] - Fetch a law by number (1-48)"
    },
    credits: "Jonnel"
  },

  async execute({ api, event, args }) {
    const number = args[0];

    if (!number || isNaN(number) || number < 1 || number > 48) {
      return api.sendMessage(
        "📘 Usage: book [1-48]\nExample: book 3",
        event.threadID,
        event.messageID
      );
    }

    try {
      const res = await axios.get("https://haji-mix-api.gleeze.com/api/law", {
        params: {
          number,
          api_key: "8672951c715e5945e70b9da2663e3bbc2a3e7c678738a094057e3117c3a699ea"
        }
      });

      const { code, title, law } = res.data;

      const header = "🟢⚪🔴 𝗕𝗢𝗢𝗞 𝗜𝗡𝗙𝗢 🟢⚪🔴\n\n";
      const reply = `${header}📜 Law ${code}: ${title}\n\n"${law}"\n\n🔹 Provided by: Jonnel`;

      return api.sendMessage(reply, event.threadID, event.messageID);
    } catch (err) {
      console.error("❌ API Error in book.js:", err.message);
      return api.sendMessage(
        "❌ Failed to fetch law. Please try again later.",
        event.threadID,
        event.messageID
      );
    }
  }
};