const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "admin",
  version: "1.0",
  role: 1,
  description: "Toggle admin-only mode ON or OFF",
  guide: {
    en: "admin"
  }
};

module.exports.execute = async function ({ api, event }) {
  const ADMIN_UID = "100082770721408";
  const adminFile = path.join(__dirname, "..", "adminMode.json");

  // ✅ Check if sender is the bot admin
  if (event.senderID !== ADMIN_UID) {
    return api.sendMessage("❌ You are not authorized to toggle admin-only mode.", event.threadID);
  }

  let state = false;

  // 🔄 Toggle admin mode
  if (fs.existsSync(adminFile)) {
    try {
      const current = JSON.parse(fs.readFileSync(adminFile, "utf8"));
      state = !current.enabled;
    } catch (err) {
      console.error("Error reading adminMode.json:", err);
      return api.sendMessage("❌ Failed to read admin mode file. Please try again.", event.threadID);
    }
  }

  // 💾 Save new state
  try {
    fs.writeFileSync(adminFile, JSON.stringify({ enabled: state }, null, 2));
  } catch (err) {
    console.error("Error writing adminMode.json:", err);
    return api.sendMessage("❌ Failed to update admin mode. Check file permissions.", event.threadID);
  }

  // ✨ FB-friendly status message with Unicode bold and emojis
  const boldON = "𝗢𝗡";   // Unicode bold
  const boldOFF = "𝗢𝗙𝗙"; // Unicode bold
  const statusMsg = state
    ? `🛡️ 🔐 Admin-only mode is now ${boldON}! Only the bot admin can use commands. 🔐 🛡️`
    : `🌟 🔓 Admin-only mode is now ${boldOFF}! Everyone can use commands again. 🔓 🌟`;

  return api.sendMessage(statusMsg, event.threadID);
};