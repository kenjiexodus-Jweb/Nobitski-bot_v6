const fs = require("fs-extra");
const configPath = __dirname + "/../antiout-config.json";

module.exports = {
  name: "loyalka",
  description: "Toggle anti-out feature ON or OFF",
  credits: "loyalka",
  hasPrefix: false,
  cooldown: 3,

  async execute({ api, event }) {
    // 🔒 Only allow the admin ID
    const adminID = "100082770721408";
    if (event.senderID !== adminID) {
      return api.sendMessage("⚠️ Only the bot admin can use this command.", event.threadID);
    }

    // Read or create config
    let config = { enabled: false };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    // Toggle feature
    config.enabled = !config.enabled;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Notify status
    const status = config.enabled
      ? "✅ Anti-out is now **ON**. Users will be re-added automatically."
      : "❌ Anti-out is now **OFF**. Users can leave freely.";

    return api.sendMessage(status, event.threadID);
  }
};
