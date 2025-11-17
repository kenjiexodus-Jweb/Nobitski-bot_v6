// commands/videogpt.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function txt2video(prompt) {
  try {
    const deviceID =
      Math.random().toString(16).slice(2, 10) +
      Math.random().toString(16).slice(2, 10);

    // Step 1: Generate key
    const { data: keyData } = await axios.post(
      "https://soli.aritek.app/txt2videov3",
      {
        deviceID,
        prompt,
        used: [],
        versionCode: 51,
      },
      {
        headers: {
          authorization:
            "eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT",
          "content-type": "application/json; charset=utf-8",
          "accept-encoding": "gzip",
          "user-agent": "okhttp/4.11.0",
        },
      }
    );

    if (!keyData?.key) throw new Error("No key returned from Soli API.");

    // Step 2: Get video URL
    const { data: videoData } = await axios.post(
      "https://soli.aritek.app/video",
      {
        keys: [keyData.key],
      },
      {
        headers: {
          authorization:
            "eyJzdWIiwsdeOiIyMzQyZmczNHJ0MzR0weMzQiLCJuYW1lIjorwiSm9objMdf0NTM0NT",
          "content-type": "application/json; charset=utf-8",
          "accept-encoding": "gzip",
          "user-agent": "okhttp/4.11.0",
        },
      }
    );

    const videoUrl = videoData?.datas?.[0]?.url;
    if (!videoUrl) throw new Error("Failed to get video URL.");

    return videoUrl;
  } catch (error) {
    throw new Error(error.response?.data || error.message);
  }
}

module.exports = {
  name: "videogpt",
  description: "🎬 Generate an AI video from text using Soli API",
  usage: "videogpt <prompt>",
  cooldown: 8,
  hasPermission: 0,
  usePrefix: true,
  credits: "Nikox & Jonnel Mod",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage(
        "❌ Please provide a text prompt.\n\nExample:\n`videogpt a samurai walking in the rain`",
        threadID,
        messageID
      );
    }

    const tempPath = path.join(__dirname, "temp_videogpt.mp4");

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);
      api.sendMessage(`🎥 Generating video for:\n"${prompt}"\nPlease wait...`, threadID);

      const videoUrl = await txt2video(prompt);
      const response = await axios.get(videoUrl, { responseType: "stream" });

      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        await api.sendMessage(
          {
            body: `✅ Video generated for: "${prompt}"`,
            attachment: fs.createReadStream(tempPath),
          },
          threadID
        );

        api.setMessageReaction("✅", messageID, () => {}, true);
        fs.unlinkSync(tempPath);
      });

      writer.on("error", (err) => {
        console.error("❌ Stream error:", err);
        api.sendMessage("⚠️ Error saving video file.", threadID);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
      });
    } catch (err) {
      console.error("❌ VideoGPT error:", err.message);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      api.sendMessage(
        `⚠️ Video generation failed.\nReason: ${err.message || "Unknown error"}`,
        threadID,
        messageID
      );
    }
  },
};