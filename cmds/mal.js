const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mal",
    version: "2.2",
    author: "Jonnel x Kaizenji",
    countDown: 5,
    role: 0,
    shortDescription: "Search anime from MyAnimeList (Haji API)",
    longDescription: "Hanapin ang anime details gamit ang Haji API.",
    category: "anime",
    guide: {
      en: "{pn} <anime title>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage(
        "⚠️ Pakilagay ang anime title.\nHalimbawa: mal Naruto",
        event.threadID,
        event.messageID
      );
    }

    // Loading message
    const waitMsg = await api.sendMessage(`🟢⚪🔴  🔍 𝐇𝐢𝐧𝐚𝐡𝐚𝐧𝐚𝐩 𝐚𝐧𝐠 𝐚𝐧𝐢𝐦𝐞 "${query}"...`, event.threadID);

    try {
      const { data } = await axios.get("https://haji-mix-api.gleeze.com/api/anime/search", {
        params: {
          query: query,
          page: 1,
          api_key: "b4d62c41ceb8af172f8f592bea566cb441c4e541c37915d04169cca7c5ee675f"
        }
      });

      if (!data || !data.results || data.results.length === 0) {
        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
        return api.sendMessage("❌ Walang nahanap na anime na tugma sa iyong hinanap.", event.threadID);
      }

      const anime = data.results[0]; // Kunin ang unang result
      const {
        title,
        english,
        japanese,
        type,
        status,
        aired,
        episodes,
        duration,
        genres,
        score,
        popularity,
        ranked,
        rating,
        studios,
        description,
        url,
        image
      } = anime;

      const info = `
🟢⚪🔴  🎬 𝐇𝐀𝐉𝐈 𝐀𝐍𝐈𝐌𝐄 𝐒𝐄𝐀𝐑𝐂𝐇 𝐑𝐄𝐒𝐔𝐋𝐓𝐒  🟢⚪🔴

📖 𝐓𝐢𝐭𝐥𝐞: ${title}
🆎 𝐄𝐧𝐠𝐥𝐢𝐬𝐡: ${english || "N/A"}
🈶 𝐉𝐚𝐩𝐚𝐧𝐞𝐬𝐞: ${japanese || "N/A"}
🎞️ 𝐓𝐲𝐩𝐞: ${type}
📺 𝐒𝐭𝐚𝐭𝐮𝐬: ${status}
📆 𝐀𝐢𝐫𝐞𝐝: ${aired || "N/A"}
📚 𝐄𝐩𝐢𝐬𝐨𝐝𝐞𝐬: ${episodes || "N/A"}
🕒 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧: ${duration || "N/A"}
🎭 𝐆𝐞𝐧𝐫𝐞𝐬: ${genres?.join(", ") || "N/A"}
🏢 𝐒𝐭𝐮𝐝𝐢𝐨𝐬: ${studios?.join(", ") || "N/A"}
⭐ 𝐒𝐜𝐨𝐫𝐞: ${score || "N/A"} (${ranked || "N/A"})
🔥 𝐏𝐨𝐩𝐮𝐥𝐚𝐫𝐢𝐭𝐲: ${popularity || "N/A"}
🔞 𝐑𝐚𝐭𝐢𝐧𝐠: ${rating || "N/A"}

📝 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧:
${description?.length > 600 ? description.slice(0, 600) + "..." : description || "N/A"}

🔗 𝐌𝐨𝐫𝐞 𝐈𝐧𝐟𝐨: ${url || "N/A"}

👑 𝐀𝐏𝐈 𝐁𝐲 𝐇𝐚𝐣𝐢 | 𝐁𝐨𝐭 𝐁𝐲 𝐉𝐨𝐧𝐧𝐞𝐥
`;

      // 🖼️ Download poster image
      const imagePath = path.join(__dirname, "../temp", `${Date.now()}_anime.jpg`);
      const imgRes = await axios.get(image, { responseType: "arraybuffer" });
      fs.outputFileSync(imagePath, Buffer.from(imgRes.data, "binary"));

      await api.sendMessage(
        { body: info, attachment: fs.createReadStream(imagePath) },
        event.threadID
      );

      fs.unlinkSync(imagePath);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
    } catch (err) {
      console.error("❌ MAL (Haji) command error:", err);
      if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
      api.sendMessage("⚠️ May nangyaring error habang kumukuha ng data.", event.threadID);
    }
  }
};