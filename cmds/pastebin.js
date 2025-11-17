const axios = require("axios");

module.exports = {
  name: "pastebin",
  version: "1.0",
  hasPrefix: false,
  description: "Paste any text or code and return a Pastebin link",
  usage: "pastebin <text> or reply to message",
  credits: "Jonnel",

  async execute({ api, event, args }) {
    let content = args.join(" ");

    // If no args, check if the message is a reply
    if (!content && event.type === "message_reply") {
      content = event.messageReply.body || "";
    }

    if (!content) {
      return api.sendMessage("📝 Please provide text to paste.\nExample: pastebin Hello World!", event.threadID, event.messageID);
    }

    try {
      const res = await axios.get(`https://rapido.zetsu.xyz/api/pastebin?c=${encodeURIComponent(content)}`);
      if (!res.data || !res.data.url) {
        return api.sendMessage("❌ Failed to get paste URL from API.", event.threadID, event.messageID);
      }

      const pasteUrl = res.data.url;

      api.sendMessage(`✅ Paste created:\n👉 ${pasteUrl}`, event.threadID, event.messageID);
    } catch (err) {
      console.error("Pastebin API Error:", err.message);
      api.sendMessage("⚠️ Error: Unable to contact Pastebin API.", event.threadID, event.messageID);
    }
  }
};
