const axios = require("axios");

function stylizeToRoman(text) {
  return text
    .toUpperCase()
    .replace(/C/g, "K")
    .replace(/U/g, "V")
    .replace(/W/g, "VV")
    .replace(/Y/g, "I")
    .replace(/J/g, "I");
}

module.exports.config = {
  name: "dictionary",
  version: "3.9",
  role: 0,
  description: "Definition with usage, Tagalog translation, and stylized Roman word",
  guide: {
    en: "dictionary <word>"
  }
};

module.exports.execute = async function ({ api, event, args }) {
  const word = args.join(" ");
  const threadID = event.threadID;

  if (!word)
    return api.sendMessage("📚 Provide a word.\nExample: dictionary run", threadID);

  const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  try {
    const { data } = await axios.get(dictUrl);
    const entry = data[0];

    const wordText = entry.word;
    const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || "N/A";
    const stylized = stylizeToRoman(wordText);

    const verbs = [];
    const nouns = [];

    for (let meaning of entry.meanings) {
      const pos = meaning.partOfSpeech;
      for (let def of meaning.definitions) {
        const defText = def.definition;
        const example = def.example ? `→ ${def.example}` : "→ No example available.";
        const formatted = `• (${pos}) ${defText}\n  ${example}`;
        if (pos === "verb" && verbs.length < 2) verbs.push(formatted);
        if (pos === "noun" && nouns.length < 2) nouns.push(formatted);
        if (verbs.length >= 2 && nouns.length >= 2) break;
      }
      if (verbs.length >= 2 && nouns.length >= 2) break;
    }

    const meaningText = [...verbs, ...nouns].join("\n\n") || "No definitions found.";

    const firstDef = verbs[0] || nouns[0] || wordText;
    const cleanDef = firstDef.replace(/• \([^)]+\) /, "").split("\n")[0];

    const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tl&dt=t&q=${encodeURIComponent(cleanDef)}`;
    const transRes = await axios.get(transUrl);
    const tagalog = transRes.data?.[0]?.[0]?.[0] || "N/A";

    const header = `
🟢⚪🔴  📖 𝗗𝗜𝗖𝗧𝗜𝗢𝗡𝗔𝗥𝗬 𝗕𝗬 𝗝𝗢𝗡𝗡𝗘𝗟 📖  🟢⚪🔴
`;

    const messageText = `
${header}
🔹 Word: ${wordText}
🔹 Phonetic: ${phonetic}
🔹 Stylized (Roman): ${stylized}
🔹 Tagalog: ${tagalog}

📌 Definitions:
${meaningText}
`;

    return api.sendMessage(messageText, threadID);

  } catch (err) {
    console.error("❌ Dictionary error:", err.message);
    return api.sendMessage(`❌ No definition found for "${word}".`, threadID, (e, info) => {
      if (!e && info?.messageID) {
        setTimeout(() => api.unsendMessage(info.messageID), 10000);
      }
    });
  }
};