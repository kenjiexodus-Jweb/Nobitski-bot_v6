module.exports = {
  config: {
    name: "out",
    version: "1.1",
    author: "Jonnel",
    countDown: 3,
    role: 0,
    shortDescription: "Make bot leave the group",
    longDescription: "Only group admins can command the bot to leave the group.",
    category: "system",
    guide: "{pn}"
  },

  async execute({ api, event }) {
    const { threadID, senderID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);

      if (!isAdmin) {
        return api.sendMessage("❌ Only group admins can use this command.", threadID);
      }

      await api.sendMessage("👋 Bot is leaving the group...", threadID);
      await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    } catch (err) {
      return api.sendMessage(`❌ Failed to leave group:\n${err.message}`, threadID);
    }
  }
};
