const fs = require("fs-extra");
const path = require("path");

const configPath = path.join(__dirname, "..", "antiout-config.json");
const gifPath = path.join(__dirname, "../assets/gif/loyalka.gif");
const logPath = path.join(__dirname, "..", "antiout.log");
const failCountPath = path.join(__dirname, "..", "antiout-fails.json");

module.exports = {
  name: "event",

  async execute({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    // 🔒 Load config safely
    let config = { enabled: false };
    try {
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      }
    } catch {
      console.warn("⚠️ Could not read antiout-config.json, defaulting to OFF");
    }

    if (!config.enabled) return;

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const groupName = threadInfo.threadName || "this group";
      const leftUserID = event.logMessageData.leftParticipantFbId;
      const botID = api.getCurrentUserID();

      if (leftUserID === botID) return;

      // 🔍 Get user info
      const userInfo = await api.getUserInfo(leftUserID);
      const userName = userInfo[leftUserID]?.name || "Kaibigan";

      // ✨ Unicode bold helper
      const bold = (text) =>
        text.replace(/[A-Za-z0-9]/g, (c) => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D3BF);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D3B9);
          return c;
        });

      // 💬 Random witty effects
      const effects = [
        "🌀 Warp field engaged — pulling them back!",
        "💫 They tried to leave, but loyalty is forever.",
        "🔥 Once in, forever in. That's the Loyalka rule!",
        "🧲 Magnetic pull activated. You can’t escape that easy!",
        "⚙️ System override: Nobody escapes Dito kalang!", 
        "‼️ Gusto mo umalis ? D pwede akin kalang!"
      ];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];

      // 🧮 Load fail counter
      let failCount = {};
      if (fs.existsSync(failCountPath)) {
        failCount = JSON.parse(fs.readFileSync(failCountPath, "utf8"));
      }
      failCount[event.threadID] = failCount[event.threadID] || 0;

      // 🌀 Try to re-add user with retry logic
      const tryAddBack = async (retry = 0) => {
        try {
          await api.addUserToGroup(leftUserID, event.threadID);

          // Success — reset fail count
          failCount[event.threadID] = 0;
          fs.writeFileSync(failCountPath, JSON.stringify(failCount, null, 2));

          const msg = {
            body: `🚨 ${bold("ANTI-OUT ALERT")} 🚨

${bold(userName)} tried to leave ${bold(groupName)} 💢  
${randomEffect}

🕒 Time: ${new Date().toLocaleTimeString()}
🤖 Loyalka Anti-Out: ${bold("ACTIVE")}

☕ Stay loyal, stay classic. Nescafe style.`,
            mentions: [{ tag: userName, id: leftUserID }],
            attachment: fs.existsSync(gifPath) ? fs.createReadStream(gifPath) : null
          };

          await api.sendMessage(msg, event.threadID);

        } catch (err) {
          if (retry < 2) {
            console.warn(`⚠️ Retry #${retry + 1} to re-add ${userName}`);
            setTimeout(() => tryAddBack(retry + 1), 2000);
          } else {
            failCount[event.threadID] += 1;
            fs.writeFileSync(failCountPath, JSON.stringify(failCount, null, 2));

            console.error("❌ Failed to re-add user:", err.message);

            // Send error message
            await api.sendMessage(
              `❌ ${bold(userName)} couldn't be re-added (privacy or left manually).`,
              event.threadID
            );

            // 🧠 Auto-disable after 3 consecutive fails
            if (failCount[event.threadID] >= 3) {
              config.enabled = false;
              fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

              await api.sendMessage(
                `⚠️ ${bold("Loyalka Anti-Out temporarily disabled")}  
❌ Too many failed re-add attempts (3 consecutive).  
🕒 Please re-enable manually when ready.`,
                event.threadID
              );

              console.log(`🚫 Auto-disabled anti-out for ${groupName}`);
            }
          }
        }
      };

      await tryAddBack();

      // 🗂️ Log to file
      const logLine = `[${new Date().toLocaleString()}] ${userName} left ${groupName}\n`;
      fs.appendFileSync(logPath, logLine);

    } catch (err) {
      console.error("❌ Anti-out error:", err);
    }
  }
};