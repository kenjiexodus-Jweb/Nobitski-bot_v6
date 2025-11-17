const fs = require("fs");
const path = require("path");

module.exports = {
  name: "event",

  async execute({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const totalMembers = threadInfo.participantIDs.length;
      const botID = api.getCurrentUserID();
      const groupName = threadInfo.threadName || "this group";
      const newUsers = event.logMessageData.addedParticipants;
      const gifPath = path.join(__dirname, "../assets/gif/welcome.gif");

      // Helper: Bold text using Unicode
      const bold = (text) => text.replace(/[A-Za-z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D3BF);
        if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D3B9);
        return c;
      });

      for (const user of newUsers) {
        const userID = user.userFbId;
        const userName = user.fullName || "there";

        const mentions = [
          { tag: `@${userName}`, id: userID },
          { tag: "@Jonnel", id: "100082770721408" }
        ];

        // 🎨 Random color headline emojis for style
        const colorSet = [
          "🟢⚪🔴", "🟡⚫🟣", "🔵⚪🟢", "🟠🟣⚪", "❤️💛💙"
        ];
        const header = colorSet[Math.floor(Math.random() * colorSet.length)];

        const messageBody = `
${header}  ${bold("WELCOME")}  ${header}

👋 𝐇𝐞𝐥𝐥𝐨 ${bold(`@${userName}`)}! 🎉  
Welcome to ${bold(groupName)} 🌟

👥 𝗧𝗼𝘁𝗮𝗹 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${totalMembers}
We’re so happy to have you here! 💬✨

👨‍💻 𝗔𝗱𝗺𝗶𝗻: ${bold("Jonnel Soriano")}
🤖 𝗕𝗼𝘁 𝗖𝗿𝗲𝗮𝘁𝗼𝗿: ${bold("Jonnel Soriano")} 🖤

Enjoy your stay and have fun! 🎊`;

        // Check if GIF exists, fallback to text-only message
        const message = fs.existsSync(gifPath)
          ? { body: messageBody, mentions, attachment: fs.createReadStream(gifPath) }
          : { body: messageBody, mentions };

        await api.sendMessage(message, event.threadID);

        // Rename bot if it’s newly added
        if (userID === botID) {
          await api.changeNickname("Nobitski-bot assistant", event.threadID, botID);
        }
      }

    } catch (err) {
      console.error("❌ Error in group event:", err);
    }
  }
};