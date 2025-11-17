const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "pinterest",
  version: "2.1",
  hasPrefix: false,
  description: "Search and send Pinterest images",
  usage: "pinterest <search term>",
  credits: "Jonnel Soriano",

  async execute({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("📌 Usage: pinterest <search term>\nExample: pinterest cute anime girl", event.threadID, event.messageID);
    }

    try {
      // ✅ Correct API URL
      const res = await axios.get(`https://rapido.zetsu.xyz/api/pin?search=${encodeURIComponent(query)}&count=5`);
      const images = res.data.data; // ✅ use .data from response

      if (!images || images.length === 0) {
        return api.sendMessage("❌ No images found.", event.threadID, event.messageID);
      }

      const attachments = [];

      for (let i = 0; i < images.length; i++) {
        const url = images[i];
        const filePath = path.join(__dirname, `pin_${i}.jpg`);
        const img = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, img.data);
        attachments.push(fs.createReadStream(filePath));
      }

      api.sendMessage({
        body: `📍 Pinterest results for: ${query}`,
        attachment: attachments
      }, event.threadID, () => {
        // ✅ Cleanup downloaded images
        attachments.forEach((_, i) => {
          const filePath = path.join(__dirname, `pin_${i}.jpg`);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }, event.messageID);

    } catch (err) {
      console.error("Pinterest Error:", err.message);
      return api.sendMessage("❌ Failed to get Pinterest images.", event.threadID, event.messageID);
    }
  },
};
