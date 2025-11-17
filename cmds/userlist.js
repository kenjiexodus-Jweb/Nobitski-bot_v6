const fs = require("fs-extra");

module.exports = {
  name: "userlist",
  description: "Show all users in the group (name + UID)",
  credits: "Jonnel Soriano 👑",
  hasPrefix: false,
  cooldown: 3,

  async execute({ api, event }) {
    try {
      // 🧠 Get group information
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs || [];
      const groupName = threadInfo.threadName || "this group";

      // 🧾 Header info with Unicode styling
      let msg = `🟢⚪🔴  𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗠𝗕𝗘𝗥𝗦 𝗟𝗜𝗦𝗧  🔴⚪🟢\n`;
      msg += `───────────────────────────────\n`;
      msg += `🏡 𝗚𝗿𝗼𝘂𝗽: *${groupName}*\n👥 𝗧𝗼𝘁𝗮𝗹 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: *${members.length}*\n`;
      msg += `───────────────────────────────\n\n`;

      // 🔍 Loop through all participants and get names
      let count = 1;
      for (const id of members) {
        let name = "Unknown";
        try {
          const userInfo = await api.getUserInfo(id);
          name = userInfo[id]?.name || "Unknown";
        } catch {
          name = "Unknown";
        }
        msg += `✨ ${count}. 𝗡𝗮𝗺𝗲: ${name}\n🆔 UID: ${id}\n\n`;
        count++;
      }

      // 🖋️ Footer with developer credit
      msg += `───────────────────────────────\n`;
      msg += `👑 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼\n🖤 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗡𝗼𝗯𝗶𝘁𝘀𝗸𝗶-𝗯𝗼𝘁- 𝗔𝗜 © ${new Date().getFullYear()}`;

      // ✅ Send message
      await api.sendMessage(msg, event.threadID, event.messageID);
    } catch (err) {
      console.error("❌ Error in userlist command:", err);
      await api.sendMessage("⚠️ Unable to fetch user list.", event.threadID, event.messageID);
    }
  }
};