const fs = require("fs");
const path = require("path");

module.exports = {
  name: "rule",
  description: "Shows white hat hacker rules with GIF",
  version: "2.0",
  cooldown: 10,
  usePrefix: true,

  async execute({ api, event }) {
    const { threadID, messageID } = event;

    const rulesText = `
💠 𝗪𝗛𝗜𝗧𝗘 𝗛𝗔𝗧 𝗛𝗔𝗖𝗞𝗘𝗥 𝗥𝗨𝗟𝗘𝗦 💠
────────────────────
1. ✅ Always follow the law – Sumunod sa mga batas at regulasyon.
2. 🕵️ Respect privacy – Igalang ang privacy ng lahat.
3. 📝 Get permission – Kumuha ng permiso bago magsagawa ng testing.
4. 🔍 Be transparent – Maging bukas at tapat sa kliyente.
5. 🔒 Keep it confidential – Panatilihin ang sensitive info.
6. 🤝 Use skills for good – Para sa legitimate at ethical purposes.
7. 🧠 Stay updated – Laging alamin ang latest hacking techniques.
8. 👥 Collaborate responsibly – Makipagtulungan ng maayos.
9. 📂 Document everything – I-dokumento lahat ng findings.
10. 📚 Continuously learn – Patuloy na pagbutihin ang skills.
────────────────────
👨‍💻 Developer: Jonnel Soriano`;

    const gifPath = path.join(__dirname, "../assets/gif/rules.gif");
    if (!fs.existsSync(gifPath)) {
      return api.sendMessage("⚠️ GIF not found: assets/gif/rules.gif", threadID, messageID);
    }

    const message = {
      body: rulesText,
      attachment: fs.createReadStream(gifPath),
      mentions: [{ tag: "Jonnel Soriano", id: "100082770721408" }]
    };

    try {
      await api.sendMessage(message, threadID, messageID);
    } catch (err) {
      console.error("❌ Failed to send rules message:", err);
      api.sendMessage("⚠️ Failed to send message.", threadID, messageID);
    }
  }
};