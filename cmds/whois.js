const moment = require("moment-timezone");

module.exports = {
  name: "whois",
  version: "1.0.0",
  description: "Get full Facebook user info by UID.",
  usage: "!whois <uid>",
  cooldown: 5,

  async execute({ api, event, args }) {
    const uid = args[0];

    if (!uid || isNaN(uid)) {
      return api.sendMessage("❌ Usage: !whois <facebook_uid>", event.threadID);
    }

    try {
      const userInfo = await api.getUserInfo(uid);
      const info = userInfo[uid];

      if (!info) {
        return api.sendMessage("❌ Failed to fetch user info.", event.threadID);
      }

      const name = info.name || "Unknown";
      const gender = info.gender || "Unknown";
      const isMessengerUser = info.isMessengerUser ? "✅ Yes" : "❌ No";
      const isVerified = info.isVerified ? "✅ Yes" : "❌ No";
      const isFriend = info.isFriend ? "✅ Yes" : "❌ No";
      const tokens = info.searchTokens?.join(", ") || "Unavailable";
      const profileUrl = `https://facebook.com/${uid}`;
      const timestamp = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

      const message = `
🧠 USER INTEL REPORT

📛 Name: ${name}
🆔 UID: \`\`\`${uid}\`\`\`
🌐 Profile: ${profileUrl}

🧠 Gender: ${gender}
✅ Verified: ${isVerified}
💬 Messenger User: ${isMessengerUser}
🤝 Friend with Bot: ${isFriend}
🔍 Search Tokens: ${tokens}

🕒 Timestamp: ${timestamp}

🕵️ Komander requested full info on this soul.
`;

      await api.sendMessage(message, event.threadID);
    } catch (err) {
      console.error("❌ Error in whois:", err);
      api.sendMessage("❌ Failed to retrieve user data. Check UID.", event.threadID);
    }
  }
};
