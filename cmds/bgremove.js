const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "bgremove",
  version: "2.0",
  hasPrefix: false,
  description: "Remove background from an image using Remove.bg API",
  usage: "Reply to an image with: bgremove",
  credits: "Jonnel",

  async execute({ api, event }) {
    const REMOVE_BG_KEY = "pFuC5fB45zWEkoGdC24wRNGt"; // Your Remove.bg API Key

    // ✅ Check if user replied to an image
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage(
        "❌ Mag-reply sa isang larawan na gusto mong alisin ang background.",
        event.threadID,
        event.messageID
      );
    }

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "photo") {
      return api.sendMessage(
        "❌ Ang file na ni-reply-an mo ay hindi isang larawan.",
        event.threadID,
        event.messageID
      );
    }

    const imageUrl = attachment.url;

    try {
      const start = Date.now();

      // ✅ Call Remove.bg API
      const response = await axios({
        method: "POST",
        url: "https://api.remove.bg/v1.0/removebg",
        data: { image_url: imageUrl, size: "auto" },
        headers: { "X-Api-Key": REMOVE_BG_KEY },
        responseType: "arraybuffer",
      });

      if (!response.data) throw new Error("Walang nakuha na larawan mula sa Remove.bg");

      const ping = Date.now() - start;

      // Ensure cache folder exists
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const filePath = path.join(cacheDir, `nobg_${Date.now()}.png`);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      const msgBody =
        "🟢⚪🔴 𝗕𝗚𝗥𝗘𝗠𝗢𝗩𝗘 🟢⚪🔴\n\n" +
        "✅ Tagumpay! Narito ang larawang wala nang background.\n" +
        "🔰 Bot: Nobitski-bot ☣️\n" +
        "👑 Owner: Jonnel\n" +
        `⏱ Ping: ${ping}ms`;

      api.sendMessage(
        { body: msgBody, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error("❌ BGRemove Error:", err.response?.data || err.message);
      return api.sendMessage(
        "❌ May nangyaring error habang inaayos ang larawan. Siguraduhing valid ang larawan at may sapat na API credits.",
        event.threadID,
        event.messageID
      );
    }
  },
};