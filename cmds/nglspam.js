const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  name: "nglspam",
  version: "1.3",
  hasPrefix: false,
  description: "📩 Magpadala ng spam message sa NGL gamit ang API.",
  usage: "nglspam <username> <message> <amount>",
  credits: "🤖 Jonnel Soriano",

  async execute({ api, event, args }) {
    if (args.length < 3) {
      return api.sendMessage(
        "❌ 𝗠𝗮𝗹𝗶𝗻𝗴 𝗙𝗼𝗿𝗺𝗮𝘁!\n\n📌 𝗧𝗮𝗺𝗮𝗻𝗴 𝗚𝗮𝗺𝗶𝘁:\nnglspam <username> <message> <amount>\n\n🧪 Halimbawa:\nnglspam nikox24 kamusta ka 10",
        event.threadID,
        event.messageID
      );
    }

    const username = args[0];
    const amount = parseInt(args[args.length - 1]);
    const question = args.slice(1, -1).join(" ");

    if (!username || !question || isNaN(amount)) {
      return api.sendMessage(
        "⚠️ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗶𝗻𝗽𝘂𝘁!\n📍 Siguraduhing may tamang username, message, at bilang.",
        event.threadID,
        event.messageID
      );
    }

    try {
      const res = await axios.post(
        "https://ngl-api-rdei.onrender.com/spam-ngl",
        { username, question, amount },
        { headers: { "Content-Type": "application/json" } }
      );

      const now = moment().tz("Asia/Manila").format("YYYY-MM-DD hh:mm A");

      let reply = `✅ 𝗡𝗚𝗟 𝗦𝗽𝗮𝗺 𝗦𝗲𝗻𝘁 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆!\n\n👤 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: @${username}\n💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲: ${question}\n🔁 𝗥𝗲𝗽𝗲𝗮𝘁𝘀: ${amount}\n📅 𝗧𝗶𝗺𝗲: ${now}\n\n🛠️ 𝗔𝗣𝗜: RONALDRICH DUTERTE\n🤖 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿: Jonnel Soriano`;

      if (res.data && typeof res.data === "string") {
        reply += `\n\n📩 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲: ${res.data}`;
      }

      return api.sendMessage(reply, event.threadID, event.messageID);
    } catch (error) {
      console.error("❌ NGL Spam Error:", error.message || error);
      return api.sendMessage(
        "🚫 𝗘𝗿𝗿𝗼𝗿 𝘀𝗲𝗻𝗱𝗶𝗻𝗴 𝘀𝗽𝗮𝗺!\n❗ Subukan ulit mamaya o i-check ang username mo.",
        event.threadID,
        event.messageID
      );
    }
  }
};