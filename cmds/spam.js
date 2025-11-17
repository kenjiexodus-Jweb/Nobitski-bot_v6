let spamIntervals = {};

module.exports = {
  name: "spam",
  version: "1.5",
  usePrefix: false,
  description: "Spam a message to a UID repeatedly with custom interval and auto-stop after X messages",
  usage: "spam <UID> <seconds> <count> <message> / spam stop <UID>",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) return api.sendMessage("❗ Usage: spam <UID> <seconds> <count> <message> / spam stop <UID>", threadID, messageID);

    const action = args[0].toLowerCase();

    // Stop spam
    if (action === "stop") {
      const targetUID = args[1];
      if (!targetUID) return api.sendMessage("❗ Please provide a UID to stop.", threadID, messageID);
      if (spamIntervals[targetUID]) {
        clearInterval(spamIntervals[targetUID].interval);
        delete spamIntervals[targetUID];
        return api.sendMessage(`🛑 Spam to UID ${targetUID} stopped.`, threadID, messageID);
      } else {
        return api.sendMessage(`⚠️ No active spam for UID ${targetUID}.`, threadID, messageID);
      }
    }

    // Start spam
    const targetUID = args[0];
    const intervalSec = parseFloat(args[1]);
    const count = parseInt(args[2]);
    const message = args.slice(3).join(" ");

    if (!targetUID || isNaN(intervalSec) || isNaN(count) || !message) {
      return api.sendMessage("❗ Usage: spam <UID> <seconds> <count> <message>", threadID, messageID);
    }

    if (spamIntervals[targetUID]) return api.sendMessage(`⚠️ Spam already running for UID ${targetUID}.`, threadID, messageID);

    let sentCount = 0;
    const interval = setInterval(() => {
      if (sentCount >= count) {
        clearInterval(interval);
        delete spamIntervals[targetUID];
        return api.sendMessage(`✅ Spam to UID ${targetUID} completed (${count} messages sent).`, threadID);
      }
      api.sendMessage(message, targetUID);
      sentCount++;
    }, intervalSec * 1000);

    spamIntervals[targetUID] = { interval, targetUID };
    return api.sendMessage(`✅ Spam started for UID ${targetUID} every ${intervalSec} second(s), total ${count} messages. Use 'spam stop ${targetUID}' to stop early.`, threadID, messageID);
  }
};