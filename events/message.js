const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 🧠 Paths
const brainPath = path.join(__dirname, "../data/brain.json");
const learnPath = path.join(__dirname, "../data/learn.json");
const configPath = path.join(__dirname, "../data/ai-config.json");
const nescafePath = path.join(__dirname, "../data/nescafe-config.json");
const gifFolder = path.join(__dirname, "../assets/messageGIF");

// ☕ Owner ID
const ownerID = "100082770721408";

// 🎞️ Greeting GIFs
const greetingGIFs = {
  hi: path.join(gifFolder, "hi.gif"),
  hello: path.join(gifFolder, "hello.gif"),
  yow: path.join(gifFolder, "yow.gif"),
};

let lastHiTime = 0, lastHelloTime = 0, lastYoTime = 0;

// 🧾 Header/Footer
function getHeader() {
  return `𝗡𝗢𝗕𝗜𝗧𝗦𝗞𝗜-𝗕𝗢𝗧\n━━━━━━━━━━━━━━━━━━\n`;
}
function getFooter() {
  return `\n━━━━━━━━━━━━━━━━━━\n👨‍💻 Developer: 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼`;
}

// 🌐 AI API URLs
const aiAPIs = {
  GPT: "https://betadash-api-swordslush-production.up.railway.app/gpt-5?ask=",
  GEMINI: "https://betadash-api-swordslush-production.up.railway.app/gemini?ask=",
  LLAMA: "https://betadash-api-swordslush-production.up.railway.app/Llama90b?ask=",
  DEEPSEEK: "https://betadash-api-swordslush-production.up.railway.app/Deepseek-V3?ask=",
  BRAVE: "https://betadash-api-swordslush-production.up.railway.app/brave?search="
};

module.exports = {
  name: "message",

  async execute({ api, event }) {
    const { threadID, senderID, body } = event;
    if (!body || typeof body !== "string") return;
    const text = body.toLowerCase().trim();
    const now = Date.now();

    // ⚙️ Load configs
    let nescafeConfig = { on: true, prefix: "!" };
    let aiConfig = { on: false, GPT: false, GEMINI: false, LLAMA: false, DEEPSEEK: false, BRAVE: false };

    if (fs.existsSync(nescafePath)) {
      try { nescafeConfig = JSON.parse(fs.readFileSync(nescafePath, "utf8")); } catch {}
    }
    if (fs.existsSync(configPath)) {
      try { aiConfig = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch {}
    }

    const botActive = nescafeConfig.on;
    if (!botActive) return;

    // 🧠 Owner toggles
    const toggles = ["nobita","ai","gpt","gemini","llama","deepseek","brave"];
    for (const key of toggles) {
      if ((text === `${key} on` || text === `${key} off`) && senderID === ownerID) {
        const turnOn = text.endsWith("on");

        if (key === "nobita") {
          nescafeConfig.on = turnOn;
          fs.writeFileSync(nescafePath, JSON.stringify(nescafeConfig, null, 2));
          return api.sendMessage(`Nobitski is now ${turnOn?"ON 🔥":"OFF 💤"}`, threadID);
        }

        if (key === "ai") {
          aiConfig.on = turnOn;
          if(!turnOn){
            for(const model of ["GPT","GEMINI","LLAMA","DEEPSEEK","BRAVE"]) aiConfig[model]=false;
          }
        } else if (["gpt","gemini","llama","deepseek","brave"].includes(key)) {
          for (const model of ["GPT","GEMINI","LLAMA","DEEPSEEK","BRAVE"]) {
            aiConfig[model] = (model === key.toUpperCase()) ? turnOn : false;
          }
          aiConfig.on = turnOn;
        }

        fs.writeFileSync(configPath, JSON.stringify(aiConfig,null,2));
        return api.sendMessage(`🤖 ${key.toUpperCase()} is now ${turnOn?"ON 🔥":"OFF 💤"}`, threadID);
      }
    }

    // 🧾 AI Status
    if(text==="ai status" && senderID===ownerID){
      const statusLines=["🧠 AI STATUS:"];
      for(const model of ["GPT","GEMINI","LLAMA","DEEPSEEK","BRAVE"]){
        statusLines.push(`${model}: ${aiConfig[model]?"ON 🔥":"OFF 💤"}`);
      }
      statusLines.push(`Global AI: ${aiConfig.on?"ON 🔥":"OFF 💤"}`);
      return api.sendMessage(statusLines.join("\n"), threadID);
    }

    // 📘 Learn command
    if (text.startsWith("learn ") && senderID === ownerID) {
      const learnData = body.slice(6).trim();
      const learnFile = fs.existsSync(learnPath) ? JSON.parse(fs.readFileSync(learnPath, "utf8")) : {};
      const match = learnData.match(/["'](.+?)["']\s*["'](.+?)["']/);
      let question, answer;
      if(match){question=match[1].toLowerCase();answer=match[2];}
      else{const parts=learnData.split(" ");question=parts.shift()?.toLowerCase();answer=parts.join(" ");}
      if(!question||!answer)return api.sendMessage(`❌ Format: Learn "tanong" "sagot"`, threadID);
      learnFile[question]=answer;
      fs.writeFileSync(learnPath,JSON.stringify(learnFile,null,2));
      return api.sendMessage(`${getHeader()}✅ Natutunan ko na boss!\n${question} ➜ ${answer}${getFooter()}`, threadID);
    }

    // 🤝 Greetings
    const greetings={
      hi:{msg:"Hi there! Hope you’re having an awesome day today, Stay Beautiful/Handsome",gif:greetingGIFs.hi,last:()=>lastHiTime,set:t=>lastHiTime=t},
      hello:{msg:"Hello! my friend. I trust you’re doing well today. It’s truly a pleasure to meet you. 😎",gif:greetingGIFs.hello,last:()=>lastHelloTime,set:t=>lastHelloTime=t},
      yow:{msg:"Yow! How’s everything going? Hope life’s treating you well.",gif:greetingGIFs.yow,last:()=>lastYoTime,set:t=>lastYoTime=t}
    };
    for(const [key,data] of Object.entries(greetings)){
      if(text===key && now-data.last()>10000){
        const attachment=fs.existsSync(data.gif)?fs.createReadStream(data.gif):undefined;
        api.sendMessage({body:getHeader()+data.msg+getFooter(),attachment},threadID);
        data.set(now);return;
      }
    }

    // 💬 Brain or learned responses
    const brain=fs.existsSync(brainPath)?JSON.parse(fs.readFileSync(brainPath,"utf8")):{};
    const learn=fs.existsSync(learnPath)?JSON.parse(fs.readFileSync(learnPath,"utf8")):{};
    if(learn[text]||brain[text]) return api.sendMessage(getHeader()+(learn[text]||brain[text])+getFooter(),threadID);

    // 🚀 AI System
    if(!aiConfig.on) return;

    const activeAIKey = Object.keys(aiAPIs).find(ai => aiConfig[ai.toUpperCase()]);
    if(!activeAIKey) return;

    try{
      const url = aiAPIs[activeAIKey] + encodeURIComponent(body);
      const res = await axios.get(url, { timeout: 30000 });

      const reply = res.data?.response || res.data?.content || res.data?.answer || res.data?.result;
      if (!reply) return api.sendMessage("⚠️ Walang sagot si AI ngayon.", threadID);

      const message = `🧠 𝐍𝐎𝐁𝐈𝐓𝐀 𝐀𝐈 (${activeAIKey})
━━━━━━━━━━━━━━━━━━
${reply}
━━━━━━━━━━━━━━━━━━
👨‍💻 Developer: Jonnel Soriano
⚙️ Model: ${activeAIKey}`;

      api.sendMessage(message, threadID);
    } catch(err){
      console.error("❌ AI Error:", err.message, err.response?.data || "");
      api.sendMessage("😔 AI temporarily unavailable. Try again later.", threadID);
    }
  }
};