const axios = require("axios");
const fs = require("fs");
const path = require("path");

const activeThreads = new Set();

exports.config = {
  name: "music",
  version: "4.1",
  countDown: 3,
  role: 0,
  author: "Jonnel",
  description: "Play music preview via BetaDash API",
  guide: {
    en: "music [song title]"
  }
};

exports.execute = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const botID = api.getCurrentUserID?.() || api.getCurrentUserID();
  if (senderID === botID) return;

  if (!args.length) {
    return api.sendMessage("❗ Usage: music [song title]", threadID, messageID);
  }

  if (activeThreads.has(threadID)) {
    return api.sendMessage("⚠️ Please wait, still processing the current song...", threadID, messageID);
  }

  activeThreads.add(threadID);

  const title = args.join(" ");
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/spt?title=${encodeURIComponent(title)}`;

  try {
    api.setMessageReaction("🎧", messageID, () => {}, true);

    const res = await axios.get(apiUrl);
    const results = res.data;

    if (!results || !results.preview) {
      activeThreads.delete(threadID);
      return api.sendMessage("❌ No results found.", threadID, messageID);
    }

    const filePath = path.join(__dirname, "music_preview.mp3");

    const writer = fs.createWriteStream(filePath);
    const audioStream = await axios({
      url: results.preview,
      method: "GET",
      responseType: "stream"
    });

    audioStream.data.pipe(writer);

    writer.on("finish", () => {
      const caption = `🎶 ${results.title || "Unknown Title"}\n🎤 Artist: ${results.artist || "Unknown"}\n💿 Album: ${results.album || "Unknown"}\n📅 Released: ${results.releaseDate || "Unknown"}\n⏱ Duration: ${results.duration || "N/A"}\n🔗 Listen here: ${results.url || "N/A"}`;

      api.sendMessage(
        {
          body: caption,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => {
          fs.unlinkSync(filePath);
          api.setMessageReaction("✅", messageID, () => {}, true);
          activeThreads.delete(threadID);
        }
      );
    });

    writer.on("error", (err) => {
      console.error("❌ File write error:", err);
      api.sendMessage("❌ Failed to save audio file.", threadID, messageID);
      activeThreads.delete(threadID);
    });

  } catch (err) {
    console.error("❌ API Error:", err.message);
    api.sendMessage("❌ Error: " + err.message, threadID, messageID);
    api.setMessageReaction("❌", messageID, () => {}, true);
    activeThreads.delete(threadID);
  }
};