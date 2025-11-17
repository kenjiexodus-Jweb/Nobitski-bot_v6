const fs = require("fs");
const path = require("path");

module.exports = {
  name: "lolo",
  version: "1.1",
  usage: "!lolo",
  description: "Send a video file only.",
  cooldown: 3, // seconds

  execute: async ({ api, event }) => {
    const videoPath = path.join(__dirname, "..", "assets", "video", "lolo.mp4");

    // Send video
    await api.sendMessage({ attachment: fs.createReadStream(videoPath) }, event.threadID);

    // Send bold message
    const boldText = "𝐍𝐀𝐆𝐀 𝐋𝐔𝐋𝐔 😏"; // Unicode bold
    await api.sendMessage(boldText, event.threadID);
  }
};