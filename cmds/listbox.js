module.exports = {
  name: "listbox",
  version: "2.0.0",
  description: "List all group chats with their admins and member count",
  usage: "[list all groups with admin(s)]",
  cooldown: 10,
  hasPermission: 2,
  credits: "Jonnel Soriano 👑",

  async execute({ api, event }) {
    try {
      // 📦 Fetch all group chats
      const threadList = await api.getThreadList(100, null, ["INBOX"]);
      const groupList = threadList.filter(thread => thread.isGroup && thread.name);

      if (groupList.length === 0)
        return api.sendMessage("❌ Walang nakitang group chats.", event.threadID, event.messageID);

      // 🟢⚪🔴 Header Section
      let msg = `🟢⚪🔴  𝗚𝗥𝗢𝗨𝗣 𝗖𝗛𝗔𝗧𝗦 𝗟𝗜𝗦𝗧  🔴⚪🟢\n`;
      msg += `──────────────────────────────────\n`;
      msg += `📦 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝘀: *${groupList.length}*\n\n`;

      let count = 1;

      // 🔍 Loop all groups and gather info
      for (const thread of groupList) {
        const info = await api.getThreadInfo(thread.threadID);

        const adminIDs = info.adminIDs?.map(a => a.id) || [];
        const adminNames =
          info.userInfo
            ?.filter(u => adminIDs.includes(u.id))
            ?.map(u => u.name)
            ?.join(", ") || "Unknown";

        const memberCount = info.participantIDs?.length || 0;

        msg += `📂 *${count}. 𝗚𝗿𝗼𝘂𝗽:* ${thread.name}\n`;
        msg += `🆔 𝗜𝗗: ${thread.threadID}\n`;
        msg += `👑 𝗔𝗱𝗺𝗶𝗻(𝘀): ${adminNames}\n`;
        msg += `👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${memberCount}\n`;
        msg += `──────────────────────────────────\n\n`;
        count++;
      }

      // 🖋️ Footer Section
      msg += `👑 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: *Jonnel Soriano*\n`;
      msg += `🖤 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗡𝗼𝗯𝗶𝘁𝗮-𝗕𝗼𝘁 𝗔𝗜 © ${new Date().getFullYear()}`;

      return api.sendMessage(msg.trim(), event.threadID, event.messageID);
    } catch (err) {
      console.error("❌ Error in listbox command:", err);
      return api.sendMessage("⚠️ May error habang kinukuha ang mga group chats.", event.threadID, event.messageID);
    }
  }
};