// events/leave.js
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "event",

  async execute({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const gcName = threadInfo.threadName || "this group";
      const totalMembers = threadInfo.participantIDs.length;

      const leftUserID = event.logMessageData.leftParticipantFbId;
      const userInfo = await api.getUserInfo(leftUserID);
      const userName = userInfo[leftUserID]?.name || "Kaibigan";

      const dateTime = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const causes = [
        "Nainip sa mga walang reply 🕳️",
        "Naghanap ng kape pero di bumalik ☕",
        "Nadapa sa feelings 😢",
        "Naging multo sa GC 👻",
        "Naunfriend ni crush 💔",
        "Tinawag ng admin sa kabilang GC 🌌",
        "Naging alamat... at nawala 💀",
        "Nadulas sa emoji flood 💦",
        "Na-freeze dahil sa cold treatment 🥶",
        "Sumama kay Dora mag-explore 🌍",
      ];
      const randomCause = causes[Math.floor(Math.random() * causes.length)];

      const quotes = [
        "“Some goodbyes are just temporary… until next chat.” 💬",
        "“They left the group, but never our memories.” 🌹",
        "“Offline today, but always online in our hearts.” ❤️",
        "“Goodbyes are not forever — it’s just coffee break.” ☕",
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      console.log(
        `[🤖 Nobita & Jonnel] ${userName} left ${gcName} | Cause: ${randomCause}`
      );

      const mentions = [{ tag: `@${userName}`, id: leftUserID }];

      const messageBody = `
━━━━━━━━━━━━━━━━━━━━━━━
🕯️ FINAL FAREWELL NOTICE 🕯️
━━━━━━━━━━━━━━━━━━━━━━━
👤 𝗡𝗮𝗴𝗽𝗮𝗵𝗶𝗻𝗴𝗮 𝘀𝗶: ${userName}
💬 𝗙𝗿𝗼𝗺 𝗚𝗿𝗼𝘂𝗽: ${gcName}
📅 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${dateTime}
👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀 𝗟𝗲𝗳𝘁: ${totalMembers}
⚰️ 𝗖𝗮𝘂𝘀𝗲 𝗼𝗳 𝗟𝗲𝗮𝘃𝗲: ${randomCause}

🪶 ${randomQuote}

━━━━━━━━━━━━━━━━━━━━━━━
☕ Brewed by: 𝗡𝗲𝘀𝗰𝗮𝗳𝗲 𝗖𝗹𝗮𝘀𝘀𝗶𝗰   
👑 Owner: 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼  
🕊️ Sponsored by: 𝗢𝘂𝗿 𝗟𝗮𝗱𝘆 𝗼𝗳 𝗣𝗲𝗮𝗰𝗲 𝗠𝗲𝗺𝗼𝗿𝗶𝗮𝗹 𝗦𝗲𝗿𝘃𝗶𝗰𝗲𝘀  
━━━━━━━━━━━━━━━━━━━━━━━`;

      // 🔥 UPDATED PATHS
      const goodbyeSound = path.join(__dirname, "..", "assets", "music", "goodbye.mp3");
      const gifPath = path.join(__dirname, "..", "assets", "gif", "goodbye.gif");

      // 🪄 Step 1: Send message + GIF together
      if (fs.existsSync(gifPath)) {
        await api.sendMessage(
          {
            body: messageBody,
            mentions,
            attachment: fs.createReadStream(gifPath),
          },
          event.threadID
        );
        console.log("🎞️ Sent farewell message with GIF.");
      } else {
        await api.sendMessage({ body: messageBody, mentions }, event.threadID);
        console.log("⚠️ No goodbye.gif found, sent text only.");
      }

      // 🪄 Step 2: Send MP3 separately if it exists
      if (fs.existsSync(goodbyeSound)) {
        setTimeout(async () => {
          await api.sendMessage(
            { attachment: fs.createReadStream(goodbyeSound) },
            event.threadID
          );
          console.log("🎵 Played goodbye.mp3");
        }, 3000);
      } else {
        console.log("⚠️ No goodbye.mp3 found.");
      }

      // 🕊️ Step 3: Final message after few seconds
      setTimeout(() => {
        api.sendMessage(
          "🕊️ May they rest in peace... and find stronger Wi-Fi signal up there 📶",
          event.threadID
        );
      }, 7000);
    } catch (err) {
      console.error("❌ Error in Nescafe Classic farewell event:", err);
    }
  },
};