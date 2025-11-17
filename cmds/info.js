const os = require("os");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "info",
  version: "1.1",
  description: "Show bot and admin info with real uptime and GIF",
  usage: "[info]",
  cooldown: 5,
  hasPermission: 0,
  credits: "Jonnel",

  async execute({ api, event }) {
    const adminUID = "100082770721408";
    const adminName = "Jonnel files";
    const botName = "Nobita 🌿";
    const botPrefix = "help";

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB");
    const timeStr = now.toLocaleTimeString("en-GB");

    // ✅ Accurate uptime
    const uptimeSec = process.uptime();
    const days = Math.floor(uptimeSec / (60 * 60 * 24));
    const hours = Math.floor((uptimeSec / (60 * 60)) % 24);
    const minutes = Math.floor((uptimeSec / 60) % 60);
    const seconds = Math.floor(uptimeSec % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // 🧠 RAM usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedMB = (usedMem / 1024 / 1024).toFixed(1);
    const totalMB = (totalMem / 1024 / 1024).toFixed(1);
    const percent = ((usedMem / totalMem) * 100).toFixed(1);

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

    // 📝 Construct Unicode-bold message body
    const msgBody = `
🟢⚪🔴  ${unicodeBold("NOBITA")} 🔴⚪🟢
━━━━━━━━━━━━━━━━━━
✯ ${unicodeBold("Bot Name")}: ${unicodeBold(botName)}
✯ ${unicodeBold("Bot Admin")}: ${unicodeBold(adminUID)}
♛ ${unicodeBold("Admin Link")}: https://www.facebook.com/${adminUID}
✪ ${unicodeBold("Bot Prefix")}: ${unicodeBold(botPrefix)}
✯ ${unicodeBold("Files Owner")}: ${unicodeBold(adminName)}

🕒 ${unicodeBold("UPTIME")}: ${unicodeBold(uptimeStr)}
📆 ${unicodeBold("Today")}: 『${unicodeBold(dateStr)}』【${unicodeBold(timeStr)}】

📦 ${unicodeBold("RAM Usage")}: ${unicodeBold(usedMB+"MB")} / ${unicodeBold(totalMB+"MB")} (${unicodeBold(percent+"%")})
━━━━━━━━━━━━━━━━━━
☕ ${unicodeBold("Developer by")}: ${unicodeBold("Jonnel S.")}
`;

    // Attach GIF if exists
    const gifPath = path.join(__dirname, "..", "assets", "gif", "info.gif");
    const attachment = fs.existsSync(gifPath) ? fs.createReadStream(gifPath) : undefined;

    return api.sendMessage({ body: msgBody, attachment }, event.threadID, event.messageID);
  }
};