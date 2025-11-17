const axios = require("axios");

// Unicode Bold Mapping (A-Z, a-z)
const toBold = (str) => {
  const offsetUpper = 0x1D400 - 65;
  const offsetLower = 0x1D41A - 97;
  return str.split("").map(c => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(code + offsetUpper);
    if (code >= 97 && code <= 122) return String.fromCodePoint(code + offsetLower);
    return c;
  }).join("");
};

// Language mapping
const langMap = {
  English: "English",
  Tagalog: "Tagalog",
  Spanish: "Spanish",
  French: "French",
  German: "German",
  Japanese: "Japanese",
  Korean: "Korean",
  Chinese: "Chinese"
};

module.exports = {
  config: {
    name: "translate",
    version: "2.1",
    author: "Jonnel Soriano",
    description: "Nobitski Translator using Betadash API with solid line design",
    category: "fun",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args || args.length < 1) {
      return api.sendMessage(
        "⚠️ Usage: translate <TEXT> [TARGET_LANGUAGE]\nExample: translate Hello world English\nExample: translate Kumusta Tagalog",
        threadID
      );
    }

    let text = args.join(" ");
    let targetLang = "English";

    const lastArg = args[args.length - 1];
    if (langMap[lastArg]) {
      targetLang = lastArg;
      text = args.slice(0, -1).join(" ");
    }

    // Reaction while translating
    try { await api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

    // Call Betadash API
    try {
      const res = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/translate?text=${encodeURIComponent(text)}&lang=${targetLang}`);
      const translatedText = res.data?.translation || "⚠️ Translation failed";

      try { await api.setMessageReaction("✅", messageID, () => {}, true); } catch(e){}

      const message = `
${toBold("📝 Nobitski Translator")}
────────────────────────────
${toBold("Original:")}
${text}

${toBold("Translated (" + targetLang + "):")}
${translatedText}
────────────────────────────
${toBold("Bot Owner: Jonnel Soriano")}
      `;

      return api.sendMessage(message.trim(), threadID);

    } catch(err){
      try { await api.setMessageReaction("", messageID, () => {}, true); } catch(e){}
      console.error("❌ Betadash Translate Error:", err.message);
      return api.sendMessage("❌ Translation failed. Try again later.", threadID);
    }
  }
};