module.exports = {
  name: "senduid",
  version: "1.2",
  description: "Send a styled message to a specific Facebook UID",
  usage: "senduid <UID> <message>",
  cooldown: 3,
  role: 1, // admin only
  credits: "Jonnel",

  async execute({ api, event, args, senderID }) {
    const threadID = event.threadID;

    // Check if admin
    if (args.length < 2) {
      return api.sendMessage(
        "❌ Usage: senduid <UID> <message>\nExample: senduid 100082770721408 Kamusta",
        threadID
      );
    }

    const targetUID = String(args[0]).trim();
    const msg = args.slice(1).join(" ").trim();

    if (!msg) {
      return api.sendMessage("❌ Message cannot be empty.", threadID);
    }

    const styledMessage =
`🟢⚪🔴 ── 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱 𝗯𝘆 𝗚𝗲𝗺𝗶𝗻𝗶 2.0 ── 🟢⚪🔴
💬 Message for UID: ${targetUID}

📌 Content:
"${msg}"

──────────────
🔹 Powered by Jonnel`;

    try {
      await api.sendMessage(styledMessage, targetUID); // send to UID
      return api.sendMessage(`✅ Successfully sent message to UID: ${targetUID}`, threadID);
    } catch (err) {
      console.error("❌ senduid error:", err);
      return api.sendMessage(
        `❌ Failed to send message to UID: ${targetUID}\nError: ${err.message}`,
        threadID
      );
    }
  }
};