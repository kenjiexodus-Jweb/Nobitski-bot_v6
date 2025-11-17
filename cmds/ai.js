// cmds/ai.js — Unified AI Command
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const configPath = "./data/ai-config.json";
const ownerID = "100082770721408";

const aiAPIs = {
  gpt: "https://betadash-api-swordslush-production.up.railway.app/gpt-5?ask=",
  llama: "https://betadash-api-swordslush-production.up.railway.app/Llama90b?ask=",
  gemini: "https://betadash-api-swordslush-production.up.railway.app/gemini?ask=",
  deepseek: "https://betadash-api-swordslush-production.up.railway.app/Deepseek-V3?ask=",
  brave: "https://betadash-api-swordslush-production.up.railway.app/brave?search="
};

module.exports = {
  name: "ai",
  run: async ({ api, event, args }) => {
    const { threadID, senderID } = event;

    // Load AI config
    let aiConfig = { on: false, GPT: false, GEMINI: false, LLAMA: false, DEEPSEEK: false, BRAVE: false };
    if (fs.existsSync(configPath)) {
      try { aiConfig = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch {}
    }

    // ✅ Admin-only AI toggle
    const models = ["gpt","llama","gemini","deepseek","brave"];
    const firstArg = args[0]?.toLowerCase();

    if (["on","off"].includes(firstArg) && args[1] && models.includes(args[1].toLowerCase()) && senderID === ownerID) {
      const model = args[1].toLowerCase();
      const turnOn = firstArg === "on";

      // Exclusive mode: turn off others
      for (const m of models) aiConfig[m.toUpperCase()] = (m === model) ? turnOn : false;
      aiConfig.on = turnOn;

      fs.writeFileSync(configPath, JSON.stringify(aiConfig,null,2));
      return api.sendMessage(`🤖 ${model.toUpperCase()} is now ${turnOn?"ON 🔥":"OFF 💤"}`, threadID);
    }

    // ❗ AI status
    if(firstArg==="status" && senderID===ownerID){
      const statusLines=["🧠 AI STATUS:"];
      for(const model of models){
        statusLines.push(`${model.toUpperCase()}: ${aiConfig[model.toUpperCase()]?"ON 🔥":"OFF 💤"}`);
      }
      statusLines.push(`Global AI: ${aiConfig.on?"ON 🔥":"OFF 💤"}`);
      return api.sendMessage(statusLines.join("\n"), threadID);
    }

    // 🚫 Check if AI system is ON
    if(!aiConfig.on) return;
    const activeAI = models.find(m => aiConfig[m.toUpperCase()]);
    if(!activeAI) return;

    // ❓ Ask AI
    const question = args.join(" ").trim();
    if(!question) return api.sendMessage(`❗ Usage: ai [your message]\nExample: ai Hello, how are you?`, threadID);

    try{
      const res = await axios.get(aiAPIs[activeAI]+encodeURIComponent(question),{timeout:20000});
      const reply = res.data?.response || res.data?.content || res.data?.answer || res.data?.result || "⚠️ Walang sagot si AI ngayon.";
      const message = `🧠 AI (${activeAI.toUpperCase()})
━━━━━━━━━━━━━━━━━━
${reply}
━━━━━━━━━━━━━━━━━━
👨‍💻 Developer: Jonnel Soriano
⚙️ Model: ${activeAI.toUpperCase()}`;
      api.sendMessage(message, threadID);
    }catch(err){
      console.error("AI Error:",err.message);
      api.sendMessage("😔 AI temporarily unavailable. Try again later.", threadID);
    }
  }
};