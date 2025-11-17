const fs = require("fs");
const path = require("path");

module.exports = {
  name: "babae",
  version: "1.1",
  usage: "!babae",
  description: "Send a babae video.",
  cooldown: 3,

  execute: async ({ api, event }) => {
    const videoPath = path.join(__dirname, "..", "assets", "video", "babae.mp4");

    // Send video
    await api.sendMessage({ attachment: fs.createReadStream(videoPath) }, event.threadID);

    // Send bold follow-up message using Unicode
    const boldText = "𝐖𝐎𝐌𝐄𝐍 ☕"; // Unicode bold
    await api.sendMessage(boldText, event.threadID);
  }
};