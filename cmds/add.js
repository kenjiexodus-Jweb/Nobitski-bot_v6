// cmds/adduser.js
module.exports = {
  name: "add",
  description: "Add a specific user by UID to the current group",
  credits: "Jonnel",
  hasPrefix: false,
  cooldown: 3,

  async execute({ api, event, args }) {
    // Only this UID can run the command
    const allowedUID = "100082770721408"; // your UID here

    if (event.senderID !== allowedUID) {
      return api.sendMessage(
        "❌ You are not allowed to use this command.",
        event.threadID,
        event.messageID
      );
    }

    const userToAdd = args[0];
    if (!userToAdd) {
      return api.sendMessage(
        "⚠️ Please provide the UID to add.\nExample: add 1000xxxxxxxxx",
        event.threadID,
        event.messageID
      );
    }

    try {
      // always cast to string, ws3-fca expects string IDs
      await api.addUserToGroup(String(userToAdd), event.threadID);
      return api.sendMessage(
        `✅ Successfully added UID ${userToAdd} to the group.`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      // err might not be an Error instance
      const errorMsg =
        (err && err.message) ||
        (err && err.error) ||
        JSON.stringify(err);
      return api.sendMessage(
        `⚠️ Failed to add UID ${userToAdd}. Error: ${errorMsg}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
