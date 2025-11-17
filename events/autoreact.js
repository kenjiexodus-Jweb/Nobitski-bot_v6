const fs = require("fs-extra");
const path = require("path");
const configPath = path.join(__dirname, "..", "database", "autoreact.json");

module.exports = {
  name: "message",
  async execute({ api, event, config }) {
    try {
      // Ignore bot's own messages
      if (event.senderID == api.getCurrentUserID()) return Promise.resolve();

      // Skip commands (starts with prefix)
      const prefix = config.PREFIX || ".";
      if (event.body && event.body.startsWith(prefix)) return Promise.resolve();

      // Check config file
      if (!fs.existsSync(configPath)) return Promise.resolve();
      const reactConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

      // Check if autoreact enabled for this thread
      if (!reactConfig[event.threadID]) return Promise.resolve();

      // Choose random reaction
      const reactions = ["❤️", "😆", "😯", "😢", "😡", "👍", "👎"];
      const chosen = reactions[Math.floor(Math.random() * reactions.length)];

      await api.setMessageReaction(chosen, event.messageID, () => {}, true);
      return Promise.resolve();
    } catch (err) {
      console.error("AutoReact Event Error:", err);
      return Promise.resolve();
    }
  }
};