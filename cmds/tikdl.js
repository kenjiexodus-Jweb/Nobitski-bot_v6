const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

module.exports = {
  name: "tikdl",
  description: "Download TikTok video and send it to Messenger",
  usage: "tikdl <TikTok URL>",
  cooldown: 10,
  hasPermission: 0,
  usePrefix: true,
  credits: "Jonnel",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0] || !args[0].startsWith("http")) {
      return api.sendMessage("❌ Please provide a valid TikTok video link.", threadID, messageID);
    }

    const tiktokUrl = args[0];
    const apiUrl = `https://api.nekorinn.my.id/downloader/tikwm?url=${encodeURIComponent(tiktokUrl)}`;
    const filePath = path.join(__dirname, "temp_tiktok.mp4");

    try {
      const res = await axios.get(apiUrl);
      const videoUrl = res.data?.result?.videoUrl;

      if (!videoUrl) {
        console.log("⚠️ API response:", res.data);
        return api.sendMessage("❌ Video URL not found in API response.", threadID, messageID);
      }

      const { author, music_info, stats } = res.data.result;

      // Guess video quality
      const quality = videoUrl.includes("1080") ? "1080P HD" :
                      videoUrl.includes("720") ? "720P" :
                      videoUrl.includes("hd") ? "HD" : "STANDARD QUALITY";

      // Format views: 🔥 VIEWS: 1.1M
      const rawViews = stats?.play?.replace(/,/g, "") || "0";
      const viewsNum = parseInt(rawViews, 10);
      const shortViews = viewsNum >= 1_000_000
        ? (viewsNum / 1_000_000).toFixed(1) + "M"
        : viewsNum >= 1_000
        ? (viewsNum / 1_000).toFixed(1) + "K"
        : viewsNum.toString();

      const file = fs.createWriteStream(filePath);

      https.get(videoUrl, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            api.sendMessage({
              body: `👤 CREATOR: ${author?.name || "UNKNOWN"}\n` +
                    `🎵 SOUND: ${music_info?.title || "NO MUSIC INFO"}\n` +
                    `📽️ QUALITY: ${quality}\n` +
                    `🔥 VIEWS: ${shortViews}`,
              attachment: fs.createReadStream(filePath)
            }, threadID, () => {
              fs.unlinkSync(filePath); // cleanup temp
            });
          });
        });
      }).on("error", (err) => {
        console.error("❌ Download error:", err.message);
        api.sendMessage("⚠️ Failed to download the video.", threadID, messageID);
      });

    } catch (err) {
      console.error("❌ TikDL error:", err);
      api.sendMessage("⚠️ Something went wrong while fetching the video.", threadID, messageID);
    }
  }
};
