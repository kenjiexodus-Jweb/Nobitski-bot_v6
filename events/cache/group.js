const fs = require("fs");
const path = require("path");

module.exports = {
  name: "event",

  async execute({ api, event }) {
    if (event.logMessageType === "log:subscribe") {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const totalMembers = threadInfo.participantIDs.length;
        const threadName = threadInfo.threadName?.toUpperCase() || "GROUP";
        const botID = api.getCurrentUserID();

        const newUsers = event.logMessageData.addedParticipants;
        for (const user of newUsers) {
          const userID = user.userFbId;
          const userName = user.fullName || "New Member";

          const mentions = [
            {
              tag: `@${userName}`,
              id: userID
            },
            {
              tag: "@Jonne Soriano",
              id: "100082770721408" // Replace with correct Facebook UID of the admin
            }
          ];

          // Optional media
          const mediaFolder = path.join(__dirname, "../media");
          const videoFiles = fs.existsSync(mediaFolder)
            ? fs.readdirSync(mediaFolder).filter(f => /\.(mp4|mov|webm)$/i.test(f))
            : [];

          const randomVideo = videoFiles.length
            ? fs.createReadStream(path.join(mediaFolder, videoFiles[Math.floor(Math.random() * videoFiles.length)]))
            : null;

          const welcomeMessage = {
            body:
`🎉 WELCOME TO ${threadName}, @${userName}!

👋 WE'RE GLAD TO HAVE YOU HERE.
🫂 CURRENT FAMILY COUNT: ${totalMembers} MEMBERS

🤖 BOT: NIKOXBOT V2
👑 ADMIN: @Jonnel Soriano

💬 FEEL FREE TO CHAT, SHARE, AND ENJOY YOUR STAY!`,
            mentions,
            attachment: randomVideo || undefined
          };

          await api.sendMessage(welcomeMessage, event.threadID);

          if (userID === botID) {
            await api.changeNickname("NIKOXBOT V2", event.threadID);
          }
        }
      } catch (err) {
        console.error("❌ ERROR IN WELCOME EVENT:", err);
      }
    }
  }
};
