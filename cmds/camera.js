const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "camera",
    version: "1.6",
    author: "Jonnel Soriano",
    description: "Send Futuristic AI Camera title with image, then link (admin-only)",
    role: 1, // admin only
    hasPrefix: false
  },

  async execute({ api, event }) {
    try {
      const adminId = "100082770721408";

      // 🔒 Admin verification
      if (event.senderID !== adminId) {
        return api.sendMessage("❌ This command is for admin only!", event.threadID);
      }

      // 📸 Camera details
      const cameraTitle = "📸 𝐅𝐔𝐓𝐔𝐑𝐈𝐒𝐓𝐈𝐂 𝐀𝐈 𝐂𝐀𝐌𝐄𝐑𝐀";
      const cameraLink = "https://futuristic-ai-camera-v2.onrender.com";
      const imgPath = path.join(__dirname, "../assets/picture/banner.jpg");

      // 🖼️ Send title + image first
      await api.sendMessage(
        {
          body: cameraTitle,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID
      );

      // ⏳ Send link after 1 second
      setTimeout(async () => {
        await api.sendMessage(cameraLink, event.threadID);
      }, 1000);

    } catch (err) {
      console.error("⚠️ Camera command error:", err);
      await api.sendMessage("⚠️ Error sending camera link, please try again later.", event.threadID);
    }
  }
};