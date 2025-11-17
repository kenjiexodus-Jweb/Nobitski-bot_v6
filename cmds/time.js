const moment = require("moment-timezone");

module.exports = {
    name: "time",
    usePrefix: false,
    usage: "time",
    version: "1.1",
    cooldown: 3,
    admin: false,

    execute: async ({ api, event }) => {
        try {
            const { threadID, messageID } = event;

            // 📍 Current time in Manila
            const currentTime = moment().tz("Asia/Manila");
            const timeString = currentTime.format("🕒 HH:mm:ss A");
            const dateString = currentTime.format("📅 MMMM D, YYYY");

            const msg = 
`🟢⚪🔴 𝗖𝗨𝗥𝗥𝗘𝗡𝗧 𝗗𝗔𝗧𝗘 & 𝗧𝗜𝗠𝗘 🟢⚪🔴
━━━━━━━━━━━━━━━━━━━━━━
${dateString}
${timeString}
━━━━━━━━━━━━━━━━━━━━━━
🤖 Bot Developer : 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼
🤖 Bot Name : 𝗡𝗼𝗯𝗶𝘁𝘀𝗸𝗶-𝗯𝗼𝘁 🤖
━━━━━━━━━━━━━━━━━━━━━━`;

            api.sendMessage(msg, threadID, messageID);
        } catch (err) {
            console.error("❌ Error in time command:", err);
            api.sendMessage("⚠️ Failed to fetch time.", event.threadID, event.messageID);
        }
    }
};