// index.js — NESCAFE CLASSIC Bot ☕ by Jonnel Soriano

const fs = require("fs");
const path = require("path");
const express = require("express");
const login = require("ws3-fca");
const os = require("os");
const { execSync, spawn } = require("child_process");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

global.botStartTime = Date.now();
global.events = new Map();
global.commands = new Map();
global.cooldowns = new Map();
global.detectedURLs = new Set();
global.client = { handleReply: [] };

// 🧠 System Info
const getSystemStats = () => {
  const cpus = os.cpus() || [];
  const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
  const coreCount = cpus.length || 1;
  const load = os.loadavg()[0] || 0;
  const cpuUsage = ((load / coreCount) * 100).toFixed(2);
  const totalMem = os.totalmem() || 1;
  const freeMem = os.freemem() || 0;
  const usedMem = totalMem - freeMem;

  let diskUsed = "N/A", diskTotal = "N/A", diskPercent = "N/A";
  try {
    const df = execSync("df -h /").toString().split("\n")[1].split(/\s+/);
    diskUsed = df[2] || "N/A";
    diskTotal = df[1] || "N/A";
    diskPercent = df[4] || "N/A";
  } catch {}

  return {
    cpuModel,
    cpuUsage,
    ram: {
      usedMB: (usedMem / 1024 / 1024).toFixed(1),
      totalMB: (totalMem / 1024 / 1024).toFixed(1),
      percent: ((usedMem / totalMem) * 100).toFixed(2)
    },
    disk: { used: diskUsed, total: diskTotal, percent: diskPercent }
  };
};
global.getSystemStats = getSystemStats;

// ================= LOAD CONFIG =================
const loadConfig = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing ${filePath}`);
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(filePath));
  } catch (err) {
    console.error(`❌ Error loading ${filePath}:`, err);
    process.exit(1);
  }
};

const config = loadConfig("./config.json");
const appState = loadConfig("./appState.json");
const botPrefix = config.prefix || "";

// ================= LOAD EVENTS =================
const loadEvents = () => {
  try {
    const files = fs.readdirSync("./events").filter(f => f.endsWith(".js"));
    for (const file of files) {
      const event = require(`./events/${file}`);
      if (event?.config?.eventType && typeof event.run === "function") {
        for (const type of event.config.eventType) {
          if (!global.events.has(type)) global.events.set(type, []);
          global.events.get(type).push(event.run);
          console.log(`✅ Loaded event type: ${type}`);
        }
      }
      if (event?.name && typeof event.execute === "function") {
        const type = event.name;
        if (!global.events.has(type)) global.events.set(type, []);
        global.events.get(type).push(event.execute);
        console.log(`✅ Loaded legacy event: ${type}`);
      }
    }
  } catch (err) {
    console.error("❌ Error loading events:", err);
  }
};

// ================= LOAD COMMANDS =================
const getAllCommandFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllCommandFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".js")) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
};

const loadCommands = () => {
  const commandFiles = getAllCommandFiles("./cmds");
  let loadedCount = 0, failedCount = 0;

  for (const file of commandFiles) {
    try {
      const cmd = require(path.resolve(file));
      const name = (cmd.config?.name || cmd.name)?.toLowerCase();
      const execute = cmd.execute || cmd.onStart;
      if (name && typeof execute === "function") {
        global.commands.set(name, {
          name,
          execute,
          cooldown: cmd.config?.countDown || 5,
          admin: cmd.config?.role === 1,
          usage: cmd.config?.guide?.en || '',
          version: cmd.config?.version || "1.0",
          handleReply: cmd.handleReply || undefined
        });
        console.log(`✅ Loaded command: ${name}`);
        loadedCount++;
      }
    } catch (err) {
      console.error(`❌ Failed to load ${file}: ${err.message}`);
      failedCount++;
    }
  }

  console.log(`📦 Commands loaded: ${loadedCount} | ❌ Failed: ${failedCount}`);
};

// 🔐 Reset admin-only
try {
  fs.writeFileSync(path.join(__dirname, "adminMode.json"), JSON.stringify({ enabled: false }, null, 2));
  console.log("🔓 Admin-only mode reset to OFF on startup.");
} catch (err) {
  console.error("❌ Failed to write adminMode.json:", err);
}

// ================= EXPRESS & SELF-PING =================
app.get("/", (_, res) => res.send("🤖NOBITSKI BOT is Running"));
app.get("/ping", (_, res) => res.send("pong"));
app.listen(PORT, () => console.log(`🚀 Express server running on port ${PORT}`));
setInterval(() => axios.get(`http://localhost:${PORT}/ping`).catch(() => {}), 4 * 60 * 1000);

// ================= START BOT =================
const startBot = () => {
  if (global.botRunning) return console.log("⚠️ Bot already running, skipping login...");
  global.botRunning = true;

  login({ appState }, async (err, api) => {
    if (err) return console.error("❌ Login failed:", err);

    try {
      api.setOptions({ ...config.option, listenEvents: true });
      console.clear();

      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━
🤖 NOBITSKI-BOT 🤖
━━━━━━━━━━━━━━━━━━━━━━━
🤖 Status: RUNNING
👨‍💻 Developer: JONNEL SORIANO
💬 Prefix: ${botPrefix || "(none)"}
🚀 System Active & Listening...
━━━━━━━━━━━━━━━━━━━━━━━
`);

      const startMsg = `
 🤖 𝗡𝗢𝗕𝗜𝗧𝗦𝗞𝗜-𝗕𝗢𝗧 🤖
━━━━━━━━━━━━━━━━━━━━━━━
✅ Bot is now 𝗥𝗨𝗡𝗡𝗜𝗡𝗚
📡 System Online and Listening
👨‍💻 Developer: 𝗝𝗢𝗡𝗡𝗘𝗟 𝗦𝗢𝗥𝗜𝗔𝗡𝗢
━━━━━━━━━━━━━━━━━━━━━━━
Enjoy your chat while sipping NESCAFE! ☕✨
`;

      const gifPath = path.join(__dirname, "assets", "gif", "indexprefix.gif");
      await api.sendMessage(
        { body: startMsg, attachment: fs.existsSync(gifPath) ? fs.createReadStream(gifPath) : undefined },
        config.ownerID
      );

      const botUID = api.getCurrentUserID();
      if (global.listenActive) return;
      global.listenActive = true;
      global.processedMessages = new Set();

      api.listenMqtt(async (err, event) => {
        try {
          if (err) return console.error("❌ Listener error:", err);
          if (!event || event.senderID === botUID) return;

          if (event.type !== "message_unsend") {
            const mid = event.messageID || `${event.timestamp}-${event.threadID}`;
            if (global.processedMessages.has(mid)) return;
            global.processedMessages.add(mid);
            setTimeout(() => global.processedMessages.delete(mid), 30000);
          }

          // HANDLE REPLY
          if (global.client.handleReply.length) {
            const hrIndex = global.client.handleReply.findIndex(h => h.threadID === event.threadID);
            if (hrIndex !== -1) {
              const hr = global.client.handleReply[hrIndex];
              const cmd = global.commands.get(hr.name?.toLowerCase());
              if (cmd?.handleReply) {
                try { await cmd.handleReply({ api, event, handleReply: hr }); }
                catch (err) { console.error(`❌ handleReply error for ${hr.name}:`, err); }
              }
            }
          }

// COMMAND HANDLER
if (event.body) {
  let args = event.body.trim().split(/ +/);
  let commandName = args.shift().toLowerCase();

  // Check for prefix only if defined
  if (botPrefix && event.body.startsWith(botPrefix)) {
    commandName = event.body.slice(botPrefix.length).split(/ +/).shift().toLowerCase();
    args = event.body.slice(botPrefix.length).trim().split(/ +/).slice(1);
  }

  // Always try without prefix too
  if (!global.commands.has(commandName)) {
    commandName = event.body.trim().split(/ +/).shift().toLowerCase();
    args = event.body.trim().split(/ +/).slice(1);
  }

  const command = global.commands.get(commandName);
  if (command) {
    const userCooldowns = global.cooldowns.get(command.name) || new Map();
    const now = Date.now();
    const cdTime = command.cooldown * 1000;

    if (userCooldowns.has(event.senderID)) {
      const expiration = userCooldowns.get(event.senderID) + cdTime;
      if (now < expiration) {
        const remaining = ((expiration - now) / 1000).toFixed(1);
        return api.sendMessage(`⏳ Please wait ${remaining}s before using '${command.name}' again.`, event.threadID);
      }
    }

    userCooldowns.set(event.senderID, now);
    global.cooldowns.set(command.name, userCooldowns);

    try {
      const execResult = command.execute({ api, event, args, message: api.sendMessage });

      if (execResult instanceof Promise) {
        execResult.catch(err => {
          console.error(`❌ Async error in '${command.name}':`, err);
          api.sendMessage(`⚠️ Error running '${command.name}', but bot will continue.`, event.threadID);
        });
      }
    } catch (err) {
      console.error(`💥 Sync error in '${command.name}':`, err);
      api.sendMessage(`⚠️ '${command.name}' crashed, but bot recovered.`, event.threadID);
    }
  }
}

          // AUTO REACT
          const reactConfigPath = path.join(__dirname, "database", "autoreact.json");
          if (event.body && fs.existsSync(reactConfigPath)) {
            const reactConfig = JSON.parse(fs.readFileSync(reactConfigPath, "utf8"));
            if (reactConfig[event.threadID]) {
              try {
                const reactions = ["❤️", "😆", "😯", "😢", "😡", "👍", "👎"];
                const chosen = reactions[Math.floor(Math.random() * reactions.length)];
                await api.setMessageReaction(chosen, event.messageID, () => {}, true);
              } catch (err) {
                console.error("AutoReact Event Error:", err);
              }
            }
          }

          // EVENT HANDLERS
          const handlers = global.events.get(event.type);
          if (Array.isArray(handlers)) {
            for (const handler of handlers) {
              try { await handler({ api, event, config }); } catch (e) { console.error(e); }
            }
          }
        } catch (err) {
          console.error("🔥 Listener internal error:", err);
        }
      });
    } catch (err) {
      console.error("❌ Critical bot error:", err);
      restartBot();
    }
  });
};

// 🔁 AUTO RESTART SYSTEM
function restartBot() {
  console.log("🔁 Restarting Nobitski-bot in 3 seconds...");
  setTimeout(() => {
    spawn(process.argv[0], process.argv.slice(1), {
      stdio: "inherit"
    });
    process.exit(1);
  }, 3000);
}

// 🧼 ERROR HANDLERS
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  restartBot();
});

// 🚀 Launch
loadEvents();
loadCommands();
startBot();