const { exec } = require("child_process");
const axios = require("axios");

module.exports = {
  config: {
    name: "uuidv4",
    version: "3.0",
    author: "Jonnel",
    countDown: 5,
    role: 0,
    shortDescription: "Generate UUIDv4 codes locally or via API",
    longDescription: "Gumagawa ng random UUIDv4 codes at pwedeng global via API",
    category: "tools",
    guide: {
      en: "{pn} [bilang ng UUIDs] [--api <apikey>] (max 100)"
    }
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    let limit = Math.min(Math.max(parseInt(args[0]) || 10, 1), 100);

    // Check for --api param
    let apiKeyIndex = args.indexOf("--api");
    let apiKey = null;
    if (apiKeyIndex !== -1 && args[apiKeyIndex + 1]) {
      apiKey = args[apiKeyIndex + 1];
    }

    const waitMsg = await api.sendMessage(
      `🟢⚪🔴  🔄 Generating ${limit} UUIDv4 codes...`,
      threadID
    );

    try {
      let uuids = [];

      if (apiKey) {
        // Global API generation
        const response = await axios.get("https://your-global-uuid-api.example.com/generate", {
          params: { limit, apikey: apiKey }
        });

        if (response.data && response.data.uuids) {
          uuids = response.data.uuids;
        } else {
          throw new Error("API did not return UUIDs.");
        }
      } else {
        // Local generation
        const generateUUIDv4 = () =>
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

        uuids = Array.from({ length: limit }, () => generateUUIDv4());
      }

      const uuidList = uuids.map((uuid, i) => `${i + 1}. ${uuid}`).join("\n");

      // Copy to clipboard if local
      if (!apiKey) {
        const clipboardText = uuids.join("\n");
        if (process.platform === "win32") exec(`echo ${clipboardText} | clip`);
        else if (process.platform === "darwin") exec(`echo "${clipboardText}" | pbcopy`);
        else exec(`echo "${clipboardText}" | xclip -selection clipboard`);
      }

      const output = `
🟢⚪🔴  𝐔𝐔𝐈𝐃𝐯𝟒 𝐆𝐄𝐍𝐄𝐑𝐀𝐓𝐎𝐑  🟢⚪🔴

📦 Bilang: ${uuids.length}
━━━━━━━━━━━━━━━━━━━━━━━
${uuidList}
━━━━━━━━━━━━━━━━━━━━━━━

${apiKey ? "🌐 Global UUIDs via API" : "✅ UUIDs are copied to your clipboard!"}
👑 Bot by 𝐉𝐨𝐧𝐧𝐞𝐥
`;

      await api.sendMessage(output, threadID);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

    } catch (error) {
      console.error("UUIDv4 error:", error);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
      api.sendMessage("⚠️ May error habang kumukuha ng UUIDs.", threadID);
    }
  }
};