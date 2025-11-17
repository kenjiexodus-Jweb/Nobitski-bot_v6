// cmds/echo.js
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "..", "echo-config.json");

module.exports = {
  name: "echo",
  version: "1.3",
  description: "Toggle echo on/off for this thread",
  usage: "/echo",
  cooldown: 2,
  credits: "Jonnel",

  execute: async ({ api, event }) => {
    const threadID = event.threadID;
    let config = {};

    // Load existing config
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch {
        return api.sendMessage("❌ Failed to read echo config.", threadID);
      }
    }

    // Default structure if missing
    if (!config[threadID]) {
      config[threadID] = { enabled: false };
    }

    // Toggle
    config[threadID].enabled = !config[threadID].enabled;

    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
      return api.sendMessage(
        config[threadID].enabled
          ? "🟢 Echo ENABLED for this thread."
          : "🔴 Echo DISABLED for this thread.",
        threadID
      );
    } catch {
      return api.sendMessage("❌ Failed to save echo state.", threadID);
    }
  }
};
