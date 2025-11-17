// cmds/imgur.js
const axios = require("axios");

module.exports = {
  config: {
    name: "imgur",
    version: "1.1",
    author: "Jonnel",
    description: "Upload image to Imgur and reply with link",
    usePrefix: false,
    role: 0,
    category: "utility",
  },

  async execute({ api, event }) {
    const { messageReply, threadID, messageID } = event;

    // Check if user replied to an image
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("❌ Please reply to an image to upload it to Imgur.", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];

    // Validate if it's a photo
    if (attachment.type !== "photo") {
      return api.sendMessage("❌ Only photo attachments are supported.", threadID, messageID);
    }

    try {
      const imageUrl = encodeURIComponent(attachment.url);
      const apiUrl = `https://rapido.zetsu.xyz/api/imgur?image=${imageUrl}`;

      const res = await axios.get(apiUrl);

      if (res.data && res.data.success && res.data.direct_link) {
        return api.sendMessage(`✅ Imgur Link:\n${res.data.direct_link}`, threadID, messageID);
      } else {
        return api.sendMessage("⚠️ Failed to upload image to Imgur. Response error.", threadID, messageID);
      }
    } catch (err) {
      console.error("Imgur Upload Error:", err.message);
      return api.sendMessage("⚠️ Failed to upload image to Imgur.", threadID, messageID);
    }
  }
};
