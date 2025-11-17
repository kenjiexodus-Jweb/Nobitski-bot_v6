const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mlbbhero",
    version: "2.1",
    author: "Jonnel x Haji Mix",
    countDown: 5,
    role: 0,
    shortDescription: "Mobile Legends hero info via Haji Mix",
    longDescription: "Tingnan ang detalye ng MLBB hero gaya ng role, specialty, lane, at iba pa gamit ang Haji Mix API.",
    category: "games",
    guide: {
      en: "{pn} <hero name>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const name = args.join(" ");
    if (!name) {
      return api.sendMessage(
        "⚠️ Pakilagay ang hero name.\nHalimbawa: mlbbhero Zilong",
        event.threadID,
        event.messageID
      );
    }

    const waitMsg = await api.sendMessage(`🟢⚪🔴  🔍 𝐇𝐢𝐧𝐚𝐡𝐚𝐧𝐚𝐩 𝐚𝐧𝐠 𝐡𝐞𝐫𝐨 "${name}"...`, event.threadID);

    try {
      const { data } = await axios.get("https://haji-mix-api.gleeze.com/api/mlbb-hero", {
        params: {
          name: name,
          api_key: "b4d62c41ceb8af172f8f592bea566cb441c4e541c37915d04169cca7c5ee675f"
        }
      });

      if (!data || !data.heroName) {
        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
        return api.sendMessage("❌ Walang nahanap na hero na tugma sa iyong hinanap.", event.threadID);
      }

      const h = data;

      const info = `
🟢⚪🔴  ⚔️ 𝐌𝐎𝐁𝐈𝐋𝐄 𝐋𝐄𝐆𝐄𝐍𝐃𝐒 𝐇𝐄𝐑𝐎 𝐈𝐍𝐅𝐎 ⚔️  🟢⚪🔴

🧿 𝐍𝐚𝐦𝐞: ${h.heroName}
🏷️ 𝐀𝐥𝐢𝐚𝐬: ${h.alias || "N/A"}
🎂 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ${h.birthday || "N/A"}
🚹 𝐆𝐞𝐧𝐝𝐞𝐫: ${h.gender || "N/A"}
⚔️ 𝐑𝐨𝐥𝐞: ${h.role}
🎯 𝐒𝐩𝐞𝐜𝐢𝐚𝐥𝐭𝐲: ${h.specialty}
🛣️ 𝐋𝐚𝐧𝐞 𝐑𝐞𝐜𝐨𝐦𝐦𝐞𝐧𝐝: ${h.laneRecommend || "N/A"}
💰 𝐏𝐫𝐢𝐜𝐞: ${h.price || "N/A"}
🔋 𝐒𝐤𝐢𝐥𝐥 𝐑𝐞𝐬𝐨𝐮𝐫𝐜𝐞: ${h.skillResource || "N/A"}
💥 𝐃𝐚𝐦𝐚𝐠𝐞 𝐓𝐲𝐩𝐞: ${h.damageType || "N/A"}

📊 𝐒𝐓𝐀𝐓𝐒:
🛡️ Durability: ${h.stats?.durability || "N/A"}/10
⚔️ Offense: ${h.stats?.offense || "N/A"}/10
🎯 Control Effects: ${h.stats?.controlEffects || "N/A"}/10
🧠 Difficulty: ${h.stats?.difficulty || "N/A"}/10

📅 𝐑𝐞𝐥𝐞𝐚𝐬𝐞 𝐃𝐚𝐭𝐞: ${h.releaseDate || "N/A"}
🪶 𝐀𝐟𝐟𝐢𝐥𝐢𝐚𝐭𝐢𝐨𝐧: ${h.affiliation || "N/A"}
🔱 𝐖𝐞𝐚𝐩𝐨𝐧𝐬: ${h.weapons || "N/A"}
⚡ 𝐀𝐛𝐢𝐥𝐢𝐭𝐢𝐞𝐬: ${h.abilities || "N/A"}

👑 𝐀𝐏𝐈 𝐛𝐲 𝐇𝐚𝐣𝐢 𝐌𝐢𝐱 | 𝐁𝐨𝐭 𝐛𝐲 𝐉𝐨𝐧𝐧𝐞𝐥
`;

      // 🖼️ Download hero image
      const imagePath = path.join(__dirname, "../temp", `${Date.now()}_hero.png`);
      const img = await axios.get(h.thumbnail, { responseType: "arraybuffer" });
      fs.outputFileSync(imagePath, Buffer.from(img.data, "binary"));

      await api.sendMessage(
        {
          body: info,
          attachment: fs.createReadStream(imagePath)
        },
        event.threadID
      );

      fs.unlinkSync(imagePath);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
    } catch (err) {
      console.error("❌ MLBB Hero command error:", err);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
      api.sendMessage("⚠️ May nangyaring error habang kumukuha ng data.", event.threadID);
    }
  }
};