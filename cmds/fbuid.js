// cmds/fbuid.js
const axios = require("axios");

module.exports = {
  config: {
    name: "fbuid",
    version: "3.3",
    author: "Jonnel Soriano 👑",
    role: 0,
    shortDescription: "Kumuha ng Facebook UID gamit ang kahit anong link 🆔",
    longDescription: "Gamitin para makuha ang UID ng isang Facebook link gamit ang Haji API.",
    category: "tools",
    guide: { en: "fbuid <facebook link> OR reply to a message with: fbuid" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const header = "🤖 𝗙𝗕 𝗨𝗜𝗗 𝗕𝗬 𝗝𝗢𝗡𝗡𝗘𝗟 🤖";

    // Kunin ang link: from args o reply
    let link = args.join(" ").trim();
    if (!link && messageReply && messageReply.body) {
      link = messageReply.body.trim();
    }

    if (!link) {
      return api.sendMessage(
        `${header}\n⚠️ Pakilagay ang Facebook link o i-reply ang message.\nHalimbawa:\nfbuid https://facebook.com/zuck`,
        threadID,
        messageID
      );
    }

    const apiKey = "b4d62c41ceb8af172f8f592bea566cb44169c5ee675f";
    const apiUrl = `https://haji-mix-api.gleeze.com/api/fbuid?url=${encodeURIComponent(link)}&api_key=${apiKey}`;

    // Send loading message
    let loadingMsg = null;
    try {
      loadingMsg = await new Promise((resolve) => {
        api.sendMessage(`${header}\n⏳ Kinukuha ang UID...`, threadID, (err, info) => resolve(info));
      });
    } catch {}

    try {
      const res = await axios.get(apiUrl, { headers: { Accept: "application/json" }, timeout: 20000 });
      const data = res.data;

      if (!data || !data.uid) {
        if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
        return api.sendMessage(`${header}\n❌ Hindi makita ang UID. Siguraduhing public o valid ang link.`, threadID);
      }

      const uid = data.uid;
      const name = data.name || "Unknown User";
      const type = data.type || "Unknown";
      const timePH = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);

      const output = `${header}

✅ 𝗨𝗜𝗗 𝗡𝗔𝗞𝗨𝗛𝗔!

🔹 𝗣𝗮𝗻𝗴𝗮𝗹𝗮𝗻: ${name}
🔹 𝗟𝗶𝗻𝗸: ${link}
🆔 𝗨𝗜𝗗: ${uid}
📦 𝗧𝘆𝗽𝗲: ${type}

👑 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼
🕒 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${timePH}`;

      return api.sendMessage(output, threadID);

    } catch (err) {
      console.error("❌ FBUID Error:", err.response?.data || err.message);
      if (loadingMsg?.messageID) api.unsendMessage(loadingMsg.messageID);
      return api.sendMessage(`${header}\n⚠️ Nagka-error habang kinukuha ang UID.\nSubukan ulit mamaya.`, threadID);
    }
  }
};