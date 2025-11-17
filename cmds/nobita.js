const fs = require("fs-extra");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const brainPath = path.join(dataDir, "brain.json");
const learnPath = path.join(dataDir, "learn.json");
const insultsPath = path.join(dataDir, "insults.json");
const lastReplyPath = path.join(dataDir, "nescafe-last-reply.json");
const configPath = path.join(dataDir, "nobita-config.json");

module.exports = {
  config: {
    name: "nobita",
    version: "1.0",
    description: "Auto chat & learn phrases directly through chat",
    category: "chat",
    role: 0, // public
    usePrefix: false,
  },

  execute: async ({ api, event }) => {
    const text = event.body?.toLowerCase().trim();
    if (!text || text.length < 2) return;

    // Ensure data files exist
    if (!fs.existsSync(brainPath)) fs.writeJsonSync(brainPath, {});
    if (!fs.existsSync(learnPath)) fs.writeJsonSync(learnPath, {});
    if (!fs.existsSync(insultsPath)) fs.writeJsonSync(insultsPath, [
      "Ikaw nga eh, kulang sa pansin tapos nagtataka ka.",
      "Tinitira mo sarili mo? Kasi ikaw target ng sagot ko. 😂",
      "Oo ikaw 'yan. Huwag ka na magtago.",
      "Wala kang ambag pero ang lakas mong magsalita.",
      "Hindi ka pa nagsisimula, pero sawang-sawa na ako sayo.",
      "Bakit parang ikaw ang problema sa tanong mo?",
      "Ang confident mo ha, sa mukha mong 'yan?",
      "Ang lakas ng loob mo ah, kahit obvious na wala ka roon.",
      "Ikaw yung tipo ng tanong na wala namang sagot.",
      "Parang ikaw lang 'to eh, pasok na pasok sa description."
    ]);
    if (!fs.existsSync(lastReplyPath)) fs.writeJsonSync(lastReplyPath, {});
    if (!fs.existsSync(configPath)) fs.writeJsonSync(configPath, { on: true, name: "Nobita", prefix: "!" });

    const brain = fs.readJsonSync(brainPath);
    const learn = fs.readJsonSync(learnPath);
    const insults = fs.readJsonSync(insultsPath);
    const lastReply = fs.readJsonSync(lastReplyPath);
    const botConfig = fs.readJsonSync(configPath);

    // Stop if bot is OFF
    if (!botConfig.on) return;

    const botName = botConfig.name || "Nobita";

    // 🧠 Teach new phrase
    if (text.startsWith("nobita teach ")) {
      const parts = text.replace("nobita teach ", "").split("/");
      if (parts.length !== 2) {
        return api.sendMessage(
          `❌ Invalid format. Use:\nnobita teach <question>/<reply>`,
          event.threadID,
          event.messageID
        );
      }
      const [question, answer] = parts.map(x => x.trim());
      if (!question || !answer) {
        return api.sendMessage(
          "⚠️ Both question and reply must be non-empty.",
          event.threadID,
          event.messageID
        );
      }
      brain[question.toLowerCase()] = answer;
      fs.writeJsonSync(brainPath, brain, { spaces: 2 });
      return api.sendMessage(`✅ Saved:\n"${question}" → "${answer}"`, event.threadID, event.messageID);
    }

    // 🧠 Check brain for match
    const replies = new Set();
    for (const key in brain) if (text.includes(key.toLowerCase())) replies.add(brain[key]);
    for (const key in learn) if (text.includes(key.toLowerCase())) replies.add(learn[key]);

    // Word match fallback
    const words = text.split(/\s+/);
    for (const word of words) {
      if (brain[word]) replies.add(brain[word]);
      if (learn[word]) replies.add(learn[word]);
    }

    // Send matched reply
    if (replies.size > 0) {
      const replyArray = [...replies];
      const chosen = replyArray[Math.floor(Math.random() * replyArray.length)];
      lastReply[event.threadID] = chosen;
      fs.writeJsonSync(lastReplyPath, lastReply, { spaces: 2 });
      return api.sendMessage(chosen, event.threadID, event.messageID);
    }

    // No match → send random insult
    const insult = insults[Math.floor(Math.random() * insults.length)];
    lastReply[event.threadID] = insult;
    fs.writeJsonSync(lastReplyPath, lastReply, { spaces: 2 });
    return api.sendMessage(insult, event.threadID, event.messageID);
  }
};