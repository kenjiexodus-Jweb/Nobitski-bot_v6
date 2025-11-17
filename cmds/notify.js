const fs = require("fs");

module.exports = {
  config: {
    name: "notify",
    version: "1.5",
    author: "Jonnel 👑",
    description: "Magpadala ng announcement sa lahat ng GC",
    category: "admin",
    role: 2,
    cooldown: 5,
    usePrefix: false,
  },

  execute: async ({ api, event, args }) => {
    const ADMIN_IDS = ["100082770721408"]; // 🔐 Only this ID can use

    // Permission check
    if (!ADMIN_IDS.includes(event.senderID)) {
      return api.sendMessage(
        "⛔ Wala kang permiso gamitin ang utos na ito, Boss lang pwede dito.",
        event.threadID,
        event.messageID
      );
    }

    // Check message
    const message = args.join(" ").trim();
    if (!message) {
      return api.sendMessage(
        "⚠️ Pakilagay ang mensahe para sa announcement.\n\nHalimbawa:\nnotify Maintenance ngayong gabi, wag muna gumamit ng bot.",
        event.threadID,
        event.messageID
      );
    }

    // Header design
    const header = " 📣  𝗝𝗢𝗡𝗡𝗘𝗟 𝗕𝗢𝗧 𝗔𝗡𝗡𝗢𝗨𝗡𝗖𝗘𝗠𝗘𝗡𝗧  📣";

    // Notify start
    await api.sendMessage("⏳ Sending announcement to all groups...", event.threadID);

    try {
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = allThreads.filter(t => t.isGroup && !t.isArchived);

      let sent = 0;
      const senderInfo = await api.getUserInfo(event.senderID);
      const senderName = senderInfo[event.senderID]?.name || "Admin";

      for (const thread of groupThreads) {
        try {
          await api.sendMessage(
            `${header}\n\n📢 Announcement from 👑 ${senderName}:\n\n${message}\n\n━━━━━━━━━━━━━━━\n🤖 Sent via Nobitski-bot`,
            thread.threadID
          );
          sent++;
        } catch (err) {
          console.error(`❌ Failed to send to ${thread.threadID}: ${err.message}`);
        }
      }

      return api.sendMessage(
        `✅ Successfully sent announcement to ${sent} group(s)!`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("❌ Notify command error:", err);
      return api.sendMessage(
        "⚠️ Nagka-error habang pinapadala ang announcement.",
        event.threadID,
        event.messageID
      );
    }
  },
};