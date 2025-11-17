const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath));
config.prefix = config.prefix || "help";

// Helper: safe disk info
function getDiskInfo() {
  try {
    const out = execSync("df -h /", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
    const lines = out.trim().split("\n");
    if (lines.length >= 2) {
      const parts = lines[1].split(/\s+/);
      return { used: parts[2] || "N/A", total: parts[1] || "N/A", percent: parts[4] || "N/A" };
    }
  } catch (e) {
    try {
      const out2 = execSync("df -h", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
      const lines = out2.trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        return { used: parts[2] || "N/A", total: parts[1] || "N/A", percent: parts[4] || "N/A" };
      }
    } catch (e2) {
      return { used: "N/A", total: "N/A", percent: "N/A" };
    }
  }
  return { used: "N/A", total: "N/A", percent: "N/A" };
}

// Helper: convert bytes -> MB with 1 decimal
function toMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

module.exports = {
  name: "prefix",
  usePrefix: false,
  usage: "prefix",
  version: "2.6",
  description: "Displays the bot's prefix with a fixed GIF and system stats.",
  cooldown: 5,
  admin: false,

  execute: async ({ api, event }) => {
    const { threadID, messageID } = event;
    const botPrefix = config.prefix;
    const botName = config.botName || "Nobita - Nobitski-bot";

    // --- Unicode bold helper ---
    const unicodeBold = (text) => {
      const boldMap = {
        A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠',
        N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
        a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵', i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺',
        n: '𝗻', o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
        0: '𝟬', 1: '𝟭', 2: '𝟮', 3: '𝟯', 4: '𝟰', 5: '𝟱', 6: '𝟲', 7: '𝟳', 8: '𝟴', 9: '𝟵',
        '!': '!', '?': '?', '.': '.', '-': '-', '_': '_', ' ': ' '
      };
      return text.split('').map(c => boldMap[c] || c).join('');
    };

    // --- System stats ---
    const cpus = os.cpus() || [];
    const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
    const coreCount = cpus.length || 1;
    const load = os.loadavg ? os.loadavg()[0] : 0;
    const cpuUsagePercent = ((load / coreCount) * 100).toFixed(2);

    const totalMem = os.totalmem() || 0;
    const freeMem = os.freemem() || 0;
    const usedMem = totalMem - freeMem;
    const ramPercent = totalMem ? ((usedMem / totalMem) * 100).toFixed(2) : "N/A";

    const disk = getDiskInfo();

    // Unicode-bold labels
    const B = {
      HEADER: "💠 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 💠",
      BOT_NAME: "🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲",
      PREFIX: "📌 𝗣𝗿𝗲𝗳𝗶𝘅",
      VERSION: "🆔 𝗩𝗲𝗿𝘀𝗶𝗼𝗻",
      CPU: "🧠 𝗖𝗣𝗨",
      RAM: "💾 𝗥𝗔𝗠",
      DISK: "🗄️ 𝗗𝗶𝘀𝗸",
      DEVELOPER: "👨‍💻 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿"
    };

    // Fixed GIF path
    const gifPath = path.join(__dirname, "../assets/gif/prefix.gif");
    if (!fs.existsSync(gifPath)) {
      return api.sendMessage("⚠️ GIF not found: assets/gif/prefix.gif", threadID, messageID);
    }

    // Build message
    const messageBody = `
${B.HEADER}
────────────────────
${B.BOT_NAME}:  ${unicodeBold(botName)}
${B.PREFIX}:  ${unicodeBold(botPrefix)}
${B.VERSION}:  ${unicodeBold(module.exports.version)}
────────────────────
${B.CPU}: ${cpuModel} (${coreCount} cores) — ${cpuUsagePercent}% load
${B.RAM}: ${toMB(usedMem)}MB / ${toMB(totalMem)}MB (${ramPercent}% used)
${B.DISK}: ${disk.used} / ${disk.total} (${disk.percent})
────────────────────
${B.DEVELOPER}:  ${unicodeBold("Jonnel Soriano")} 👑  ( @Jonnel Soriano )
🖤 Made with love | All rights reserved © 2025
────────────────────
✨ Enjoy chatting!`;

    const mentions = [{ tag: "@Jonnel Soriano", id: "100082770721408" }];

    const message = {
      body: messageBody,
      mentions,
      attachment: fs.createReadStream(gifPath)
    };

    try {
      await api.sendMessage(message, threadID);
    } catch (err) {
      console.error("❌ Failed to send prefix message:", err);
      api.sendMessage("⚠️ Failed to send message.", threadID, messageID);
    }
  },
};