const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: "google",
  version: "1.2",
  hasPrefix: false,
  usage: "google <query>",
  description: "Google search with clickable links and image previews",
  credits: "Jonnel + ChatGPT",

  async execute({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage(
        "❌ Maglagay ng gusto mong hanapin.\n\n📌 Halimbawa: google cute cats",
        event.threadID,
        event.messageID
      );
    }

    try {
      const res = await axios.get(`https://rapido.zetsu.xyz/api/google?q=${encodeURIComponent(query)}`);
      const results = res.data.results?.slice(0, 5);

      if (!results || results.length === 0) {
        return api.sendMessage("❌ Walang resultang nahanap.", event.threadID, event.messageID);
      }

      let msg = `🔎 Google Search Results for: “${query}”\n\n`;
      const attachments = [];

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const title = r.title || "No title";
        const snippet = r.snippet || "No description.";
        const safeLink = r.link.startsWith("http") ? r.link : `https://${r.link}`;
        msg += `📌 ${i + 1}. ${title}\n${snippet}\n🔗 ${safeLink}\n\n`;

        if (r.image && r.image.startsWith("http")) {
          try {
            const imgPath = path.join(__dirname, `../cache/gresult_${i}.jpg`);
            const imgData = await axios.get(r.image, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, Buffer.from(imgData.data, "binary"));
            attachments.push(fs.createReadStream(imgPath));
          } catch (e) {
            console.warn(`⚠️ Couldn't download image for result ${i + 1}`);
          }
        }
      }

      api.sendMessage(
        { body: msg.trim(), attachment: attachments },
        event.threadID,
        () => {
          // Delete downloaded files after sending
          for (const file of attachments) {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          }
        },
        event.messageID
      );

    } catch (err) {
      console.error("❌ Error:", err.message || err);
      api.sendMessage("⚠️ May error habang nagse-search. Subukan ulit mamaya.", event.threadID, event.messageID);
    }
  }
};
