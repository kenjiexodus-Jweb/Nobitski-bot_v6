const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "portfolio",
    version: "1.2",
    author: "Jonnel Soriano",
    description: "Send portfolio title with image, then link after delay",
    role: 1, // 1 = admin only
    hasPrefix: false
  },

  async execute({ api, event }) {
    try {
      const adminId = "100082770721408";

      // 🔒 Admin verification
      if (event.senderID !== adminId) {
        return api.sendMessage("❌ This command is for admin only!", event.threadID);
      }

      // 📸 Portfolio details
      const title = "🚀 𝐉𝐎𝐍𝐍𝐄𝐋 𝐒𝐎𝐑𝐈𝐀𝐍𝐎 𝐏𝐎𝐑𝐓𝐅𝐎𝐋𝐈𝐎";
      const link = "https://jonnelsoriano-portfolio.netlify.app/";
      const imgPath = path.join(__dirname, "../assets/picture/banner.webp");

      // 🖼️ Send title + image first
      await api.sendMessage(
        {
          body: title,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID
      );

      // ⏳ Send the link after 1 second
      setTimeout(async () => {
        await api.sendMessage(link, event.threadID);
      }, 1000);

    } catch (err) {
      console.error("⚠️ Portfolio command error:", err);
      await api.sendMessage("⚠️ Error sending portfolio link, please try again later.", event.threadID);
    }
  }
};