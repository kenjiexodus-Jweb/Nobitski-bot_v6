const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.3",
    author: "Jonnel",
    countDown: 5,
    role: 0,
    shortDescription: "About bot & owner",
    longDescription: "Displays information about JonnelBot and its developer",
    category: "info",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const gifPath = path.join(__dirname, "../assets/gif/owner.gif");

    // Unicode-bold labels for visual emphasis in Messenger (clients don't support Markdown)
    const B = {
      HEADER_LEFT: "🟢⚪🔴",
      TITLE: "👑 𝗡𝗼𝗯𝗶𝘁𝘀𝗸𝗶 𝗕𝗼𝘁 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁",
      ABOUT: "📝 𝗔𝗯𝗼𝘂𝘁",
      TECH: "⚙️ 𝗧𝗲𝗰𝗵",
      CONTACT: "📬 𝗖𝗼𝗻𝘁𝗮𝗰𝘁"
    };

    // Stylized visible owner name + a plain mention (for clickability)
    const visibleOwner = "𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼 👑";
    const mentionTag = "@Jonnel Soriano";

    const messageBody =
      `${B.HEADER_LEFT}  ${B.TITLE}  ${B.HEADER_LEFT}\n` +
      `────────────────────────────\n` +
      `${B.ABOUT}: Hi! I'm Nobita Bot, Call me Nobi for short, your AI assistant.\n\n` +
      `${B.TECH}: Powered by Node.js and WS3-FCA (Facebook Chat API).\n\n` +
      `${B.CONTACT}: If you encounter a bug or need help, contact the owner:\n` +
      `${visibleOwner} (${mentionTag})\n\n` +
      `🖤 Made with care — All rights reserved © ${new Date().getFullYear()}\n` +
      `${B.HEADER_LEFT}`;

    // Prepare mention so the plain tag becomes clickable in Messenger
    const mentions = [{ tag: mentionTag, id: "100082770721408" }];

    try {
      if (fs.existsSync(gifPath)) {
        await api.sendMessage({ body: messageBody, mentions, attachment: fs.createReadStream(gifPath) }, threadID);
      } else {
        await api.sendMessage({ body: messageBody, mentions }, threadID);
      }
    } catch (err) {
      console.error("❌ Failed to send owner info:", err);
      // fallback: send plain text without mentions if something fails
      try {
        await api.sendMessage(messageBody, threadID);
      } catch (e) {
        console.error("❌ Fallback send failed:", e);
      }
    }
  }
};