const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
  name: "music",
  usePrefix: true,
  usage: "/music <song name or youtube link>",
  description: "Search and download music from YouTube",
  cooldown: 10,
  credits: "Jonnel + GPT",

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage("❌ Usage: /music <title or YouTube URL>", threadID, messageID);
    }

    let videoUrl = args[0];
    if (!videoUrl.startsWith("http")) {
      const searchQuery = args.join(" ");
      const result = await ytSearch(searchQuery);
      if (!result.videos.length) {
        return api.sendMessage("❌ No results found on YouTube.", threadID, messageID);
      }
      videoUrl = result.videos[0].url;
    }

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[\\/:*?"<>|]/g, "");
    const audioPath = path.join(__dirname, "..", "temp", `${title}.mp3`);

    // Ensure temp folder exists
    if (!fs.existsSync(path.dirname(audioPath))) {
      fs.mkdirSync(path.dirname(audioPath), { recursive: true });
    }

    api.sendMessage(`🎵 Downloading **${title}**... Please wait.`, threadID);

    const stream = ytdl(videoUrl, { filter: "audioonly" });

    ffmpeg(stream)
      .audioBitrate(128)
      .save(audioPath)
      .on("end", () => {
        api.sendMessage({
          body: `✅ Here's your song: ${title}`,
          attachment: fs.createReadStream(audioPath)
        }, threadID, () => fs.unlinkSync(audioPath));
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg error:", err);
        api.sendMessage("❌ Failed to process audio.", threadID);
      });
  }
};
