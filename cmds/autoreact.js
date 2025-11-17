const fs = require("fs-extra");
const path = require("path");
const configPath = path.join(__dirname, "..", "database", "autoreact.json");

module.exports = {
  name: "autoreact",
  aliases: ["ar"],
  description: "Toggle automatic reaction for this thread",
  usage: "autoreact",
  credits: "Jonnel Soriano",
  cooldown: 3,

  async execute({ api, event }) {
    try {
      if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, "{}");
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      const threadID = event.threadID;
      const current = data[threadID] || false;
      data[threadID] = !current;

      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

      const status = data[threadID] ? "🟢 ENABLED" : "🔴 DISABLED";

      const msg = `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🗣️ 𝗔𝘂𝘁𝗼𝗥𝗲𝗮𝗰𝘁 𝗧𝗵𝗿𝗲𝗮𝗱\n` +
                  `👨‍💻 Bot Developer: Jonnel Soriano\n` +
                  `📌 Thread ID: ${threadID}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `Status: ${status}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━`;

      return api.sendMessage(msg, threadID);
    } catch (err) {
      console.error("AutoReact CMD Error:", err);
      return api.sendMessage("⚠️ Error toggling AutoReact.", event.threadID);
    }
  }
};