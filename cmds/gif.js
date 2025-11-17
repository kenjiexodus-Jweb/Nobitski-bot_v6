const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "gif",
  version: "2.0",
  description: "Search and send a random GIF using Rapido API",
  credits: "Jonnel",
  usage: "gif <search>",
  cooldown: 3,
  hasPrefix: false,

  async execute({ api, event, args }) {
    const query = args.join(" ");
    if (!query) return api.sendMessage("❌ Maling format!\n📌 Gamitin: gif <search term>\n🧪 Halimbawa: gif dog", event.threadID);

    try {
      const res = await axios.get(`https://rapido.zetsu.xyz/api/gif?q=${encodeURIComponent(query)}`);
      const gifs = res.data.result;
      if (!gifs || gifs.length === 0) return api.sendMessage("😿 Walang nahanap na GIF para sa: " + query, event.threadID);

      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
      const tempPath = path.join(__dirname, "temp", `${Date.now()}.gif`);

      const response = await axios.get(randomGif, { responseType: "arraybuffer" });
      await fs.ensureDir(path.dirname(tempPath));
      await fs.writeFile(tempPath, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `📤 GIF para sa: ${query}`,
        attachment: fs.createReadStream(tempPath)
      }, event.threadID, () => fs.unlinkSync(tempPath));

    } catch (e) {
      console.error("❌ Error:", e);
      api.sendMessage("⚠️ May error habang kumukuha ng GIF.", event.threadID);
    }
  }
};
