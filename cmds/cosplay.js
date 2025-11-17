const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "cosplay",
  description: "Send random cosplay video from Haji-Mix API (multi-stream)",
  countDown: 5,
  role: 0
};

module.exports.execute = async function ({ api, event }) {
  const apiUrl = "https://haji-mix-api.gleeze.com/api/cosplay?limit=10&page=1&stream=true&api_key=8672951c715e5945e70b9da2663e3bbc2a3e7c678738a094057e3117c3a699ea";

  try {
    const res = await axios.get(apiUrl);
    const results = res.data.result;

    if (!results || results.length === 0) {
      return api.sendMessage(
        "❌ Wala pong cosplay videos na nahanap mula sa API.",
        event.threadID,
        event.messageID
      );
    }

    // Pick random video
    const randomVideo = results[Math.floor(Math.random() * results.length)];
    const videoUrl = randomVideo.url;

    const fileName = `cosplay_${Date.now()}.mp4`;
    const filePath = path.join(__dirname, "cache", fileName);

    // Download video
    const videoStream = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, Buffer.from(videoStream.data));

    // Send with fancy design
    const caption = `
🟢⚪🔴 𝗖𝗢𝗦𝗣𝗟𝗔𝗬 𝗩𝗜𝗗𝗘𝗢 🟢⚪🔴
🎭 Title: ${randomVideo.title || "Unknown"}
📌 Source: Jonnel API
👑 Owner: Jonnel
🎬 Enjoy your cosplay video!`;

    api.sendMessage(
      {
        body: caption,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );

  } catch (err) {
    console.error("❌ Cosplay CMD Error:", err);
    api.sendMessage(
      "❌ May error po habang kinukuha o pinapadala ang cosplay video.",
      event.threadID,
      event.messageID
    );
  }
};