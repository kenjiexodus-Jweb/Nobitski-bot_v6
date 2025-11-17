const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "trigger",
    version: "1.2",
    author: "Jonnel 👑",
    description: "Mag-send ng triggered GIF kapag may nagagalit 😡",
    category: "fun",
    role: 0,
    usePrefix: false,
  },

  onStart: async () => {},

  execute: async ({ api, event }) => {
    const triggerWords = ["trigger", "galit", "bwisit", "asaran"];
    const message = event.body?.toLowerCase();
    if (!message) return;

    // check kung may trigger word
    const isTriggered = triggerWords.some(word => message.includes(word));
    if (!isTriggered) return;

    // file path: assets/triggered.gif
    const filePath = path.join(__dirname, "..", "assets", "gif", "triggered.gif");

    // check kung existing ang file
    if (!fs.existsSync(filePath)) {
      return api.sendMessage(
        "⚠️ Wala ang file ➜ /assets/gif/triggered.gif\n\n❗ Pakilagay muna ang GIF sa tamang folder.",
        event.threadID,
        event.messageID
      );
    }

    const stream = fs.createReadStream(filePath);

    // Random reaction lines 😎
    const lines = [
      "🔥 𝗧𝗿𝗶𝗴𝗴𝗲𝗿𝗲𝗱 𝗺𝗼𝗱𝗲 𝗮𝗰𝘁𝗶𝘃𝗮𝘁𝗲𝗱!",
      "💢 𝗛𝘂𝘆, 𝗵𝘂𝘄𝗮𝗴 𝗸𝗮 𝗻𝗮𝗺𝗮𝗻𝗴 𝗺𝗮𝗴𝗮𝗹𝗶𝘁!",
      "😤 𝗚𝗮𝗹𝗶𝘁 𝗻𝗮 𝘀𝗶 𝗯𝗼𝘀𝘀!",
      "😠 𝗧𝗿𝗶𝗴𝗴𝗲𝗿𝗲𝗱 𝗸𝗮 𝗻𝗮 𝗻𝗮𝗺𝗮𝗻!"
    ];

    const randomLine = lines[Math.floor(Math.random() * lines.length)];

    return api.sendMessage(
      {
        body: randomLine,
        attachment: stream
      },
      event.threadID,
      event.messageID
    );
  }
};