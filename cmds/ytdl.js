const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = {
  name: "ytdl",
  description: "Search YouTube and send video",
  usage: "ytdl <keywords>",
  cooldown: 10,
  hasPermission: 0,
  usePrefix: true,
  credits: "Jonnel",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) {
      return api.sendMessage("❌ Please enter a YouTube search query.\nUsage: ytdl <keywords>", threadID, messageID);
    }

    const query = args.join(" ");
    const searchUrl = `https://haji-mix-api.gleeze.com/api/youtube?search=${encodeURIComponent(query)}&stream=false&limit=1&api_key=8672951c715e5945e70b9da2663e3bbc2a3e7c678738a094057e3117c3a699ea`;

    try {
      // Send "fetching" message
      const fetchMsg = await api.sendMessage("⏳ Fetching video...", threadID);

      const res = await axios.get(searchUrl);
      const result = res.data?.[0];

      if (!result || !result.play) {
        await api.unsendMessage(fetchMsg.messageID);
        return api.sendMessage("❌ No downloadable video found.", threadID, messageID);
      }

      const videoUrl = result.play;
      const filePath = path.join(__dirname, "temp_ytdl.mp4");

      const title = result.title || "YouTube Video";
      const duration = result.duration?.timestamp || "??";
      const views = result.views?.toLocaleString() || "Unknown";
      const author = result.author?.name || "Unknown";

      const file = fs.createWriteStream(filePath);
      https.get(videoUrl, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(async () => {
            await api.unsendMessage(fetchMsg.messageID);

            api.sendMessage({
              body: `🎬 ${title}\n⏱ Duration: ${duration}\n🔥 Views: ${views}\n👤 Author: ${author}`,
              attachment: fs.createReadStream(filePath)
            }, threadID, () => {
              fs.unlinkSync(filePath); // delete temp file
            });
          });
        });
      }).on("error", async (err) => {
        console.error("❌ Download error:", err.message);
        await api.unsendMessage(fetchMsg.messageID);
        api.sendMessage("⚠️ Failed to download the video.", threadID, messageID);
      });

    } catch (err) {
      console.error("❌ YTDL error:", err.message);
      api.sendMessage("⚠️ Something went wrong while fetching video.", threadID, messageID);
    }
  }
};
