const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "profile",
    version: "2.1",
    author: "Jonnel Soriano",
    description: "Get user profile by UID with image and FB link",
    category: "info",
    role: 0,
    hasPrefix: false,
    guide: { en: "Usage: profile <UID> OR reply to message: profile" }
  },

  async execute({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    let uid = "";

    // React to show bot is working
    try {
      await api.setMessageReaction("🔍", messageID, () => {}, true);
    } catch (e) {}

    // Parse UID from reply or args
    if (messageReply) uid = messageReply.senderID || "";
    else if (args && args.length > 0) uid = args[0].trim();

    if (!uid || !/^\d+$/.test(uid)) {
      return api.sendMessage(
        `❌ Invalid or missing UID.\nUsage:\n• profile <UID>\n• Reply to message: profile`,
        threadID,
        messageID
      );
    }

    const fbLink = `https://facebook.com/${uid}`;
    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `profile_${uid}_${Date.now()}.png`);

    // Loading message
    let loadingMsgID = null;
    try {
      const loadingMsg = await new Promise((resolve, reject) => {
        api.sendMessage(`🔎 Fetching profile for UID: ${uid}...\n⏳ Please wait...`, threadID, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      loadingMsgID = loadingMsg?.messageID;
    } catch {}

    try {
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/profile?uid=${encodeURIComponent(uid)}`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 25000 });

      const contentType = response.headers["content-type"] || "";

      if (contentType.includes("image/")) {
        await fs.writeFile(filePath, Buffer.from(response.data));

        let userName = "User";
        try {
          const userInfo = await api.getUserInfo(uid);
          userName = userInfo[uid]?.name || userName;
        } catch {}

        if (loadingMsgID) await api.unsendMessage(loadingMsgID);

        await api.sendMessage(
          {
            body: `📋 PROFILE INFORMATION\n\n👤 Name: ${userName}\n🆔 UID: ${uid}\n🔗 Facebook: ${fbLink}\n💡 Click the link to view full profile!`,
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          messageID
        );

        await api.setMessageReaction("✅", messageID, () => {}, true);
        await fs.remove(filePath);
      } else {
        // Handle JSON or text
        let profileData = null;
        try {
          profileData = JSON.parse(Buffer.from(response.data).toString("utf8"));
        } catch {}
        if (loadingMsgID) await api.unsendMessage(loadingMsgID);

        if (profileData && Object.keys(profileData).length > 0) {
          let message = `📋 PROFILE INFORMATION\n\n`;
          if (profileData.name) message += `👤 Name: ${profileData.name}\n`;
          if (profileData.username) message += `📛 Username: ${profileData.username}\n`;
          if (profileData.id || profileData.uid) message += `🆔 UID: ${profileData.id || profileData.uid}\n`;
          if (profileData.followers) message += `👥 Followers: ${profileData.followers}\n`;
          if (profileData.friends) message += `👫 Friends: ${profileData.friends}\n`;
          for (const [key, value] of Object.entries(profileData)) {
            if (!['name','username','id','uid','followers','friends'].includes(key)) message += `• ${key}: ${value}\n`;
          }
          message += `\n🔗 Facebook: ${fbLink}\n💡 Click the link to view full profile!`;
          await api.sendMessage(message, threadID, messageID);
        } else {
          const textResponse = Buffer.from(response.data).toString("utf8");
          await api.sendMessage(`📋 Profile Info:\n\n${textResponse.slice(0,3000)}\n\n🔗 ${fbLink}`, threadID, messageID);
        }
        await api.setMessageReaction("✅", messageID, () => {}, true);
      }
    } catch (error) {
      if (loadingMsgID) await api.unsendMessage(loadingMsgID);
      await api.sendMessage(`❌ Error fetching profile for UID: ${uid}\n🔗 ${fbLink}\nTry again later.`, threadID, messageID);
      await api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};