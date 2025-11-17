const fs = require("fs");
const path = require("path");

const cooldowns = new Map();

module.exports = {
    name: "pok",
    version: "1.0.4",
    description: "Pokes with a funny GIF",
    usage: "pok",
    usePrefix: false,

    async execute({ api, event }) {
        const { senderID, threadID } = event;

        // ✅ Anti-spam cooldown
        const key = `pok-${senderID}`;
        const now = Date.now();
        const cooldown = 10 * 1000; // 10 seconds
        if (cooldowns.has(key) && now - cooldowns.get(key) < cooldown) return;
        cooldowns.set(key, now);

        // ✅ Load and send GIF
        const gifPath = path.join(__dirname, "../assets/gif/monkey.gif");
        if (!fs.existsSync(gifPath)) {
            return api.sendMessage("pok🔨😆", threadID);
        }

        const stream = fs.createReadStream(gifPath);

        // ✅ ONE message only
        api.sendMessage({
            body: "pok 🔨😆😆\nHAHAHAHA -Jonnel",
            attachment: stream
        }, threadID, (err, info) => {
            if (!err) {
                api.setMessageReaction("😂", info.messageID, () => {}, true);
            }
        });
    }
};