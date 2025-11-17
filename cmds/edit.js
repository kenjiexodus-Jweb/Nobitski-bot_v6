const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "2.0",
    author: "Jonnel Soriano",
    role: 0,
    shortDescription: "Apply effects to an image via Haji-Mix API",
    longDescription:
      "Maglagay ng effects tulad ng grayscale, brightness, crop, at iba pa gamit ang Haji-Mix API. Puwede ring i-reply sa image.",
    category: "tools",
    guide: {
      en: "{pn} <effect>\n\nO kaya i-reply sa image at itype ang command:\nedit <effect>\n\nHalimbawa:\nedit grayscale"
    },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const apiKey = "b4d62d3..."; // Boss, palitan ng tamang key mo

    let imageUrl;

    // Mode 1: reply to an image
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];
      if (attachment.type !== "photo") {
        return api.sendMessage("⚠️ The replied message must be a photo!", threadID, messageID);
      }
      imageUrl = attachment.url;
    } 
    // Mode 2: args[0] ay URL
    else if (args[0] && /^https?:\/\//.test(args[0])) {
      imageUrl = args[0];
    } 
    else {
      return api.sendMessage(
        "⚠️ Pakilagay ang image URL o i-reply sa image.\nHalimbawa:\nedit grayscale",
        threadID,
        messageID
      );
    }

    // Check effect
    const effect = args[0] && !/^https?:\/\//.test(args[0]) ? args[0].toLowerCase() : args[1]?.toLowerCase();
    if (!effect) {
      return api.sendMessage("⚠️ Pakilagay ang effect na gusto mo. Halimbawa: grayscale, invert, blur.", threadID, messageID);
    }

    const apiUrl = `https://haji-mix-api.gleeze.com/api/editimg?url=${encodeURIComponent(
      imageUrl
    )}&effect=${effect}&brightness=1.0&crop_x=0&crop_y=0&crop_width=0&crop_height=0&api_key=${apiKey}`;

    // Send loading message
    const loadingMsg = await api.sendMessage(`🛠 Applying *${effect}* effect...`, threadID);
    try {
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
      if (!res.data || res.data.length === 0) throw new Error("Empty response from API");

      const imgBuffer = res.data;
      const imgPath = path.join(__dirname, `../temp/edit_${Date.now()}.jpg`);
      fs.writeFileSync(imgPath, imgBuffer);

      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);

      await api.sendMessage(
        {
          body: `✅ Effect applied: ${effect}\n👑 OWNER: JONNEL SORIANO`,
          attachment: fs.createReadStream(imgPath),
        },
        threadID
      );

      fs.unlinkSync(imgPath);
      api.setMessageReaction("✅", messageID, () => {}, true);
      setTimeout(() => api.setMessageReaction("", messageID, () => {}, true), 4000);

    } catch (err) {
      console.error("❌ Edit Image Error:", err.message);
      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
      await api.sendMessage(`⚠️ Failed to apply effect: ${effect}. Error: ${err.message}`, threadID, messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  },
};