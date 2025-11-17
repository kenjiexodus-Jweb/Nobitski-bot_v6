module.exports = {
  config: {
    name: "emojiheartanim",
    version: "1.0",
    author: "Jonnel Soriano",
    description: "Animated heart emoji scroll effect",
    category: "fun",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID } = event;

    if (!args || args.length === 0) {
      return api.sendMessage("⚠️ Usage: emojiheartanim <TEXT>\nExample: emojiheartanim I LOVE YOU", threadID);
    }

    const text = args.join(" ").toUpperCase();
    const emoji = "❤️";

    // Prepare frames (shift pattern to simulate rotation/scroll)
    const frames = [];
    const size = Math.min(8, text.length + 2);
    for (let shift = 0; shift < size; shift++) {
      let art = "";
      for (let y = size / 2; y > -size; y -= 1) {
        let line = "";
        for (let x = -size; x < size + 1; x += 1) {
          const formula = Math.pow((x+shift) / 2, 2) + Math.pow(y, 2) - size;
          if (formula <= 0) line += emoji;
          else line += "  ";
        }
        art += line + "\n";
      }
      // add text in center for first frame only
      if (shift === 0) {
        const artLines = art.split("\n");
        const centerLine = Math.floor(artLines.length / 2);
        const mid = Math.floor(artLines[centerLine].length / 2);
        const msgStart = Math.max(0, mid - Math.floor(text.length / 2));
        artLines[centerLine] = artLines[centerLine].slice(0, msgStart) + text + artLines[centerLine].slice(msgStart + text.length);
        art = artLines.join("\n");
      }
      frames.push(art);
    }

    // Send initial message
    let animMsg = await api.sendMessage(frames[0], threadID);

    // Animation loop
    let frameIndex = 0;
    const interval = setInterval(async () => {
      frameIndex = (frameIndex + 1) % frames.length;
      try {
        await api.setMessageBody(animMsg.messageID, frames[frameIndex]);
      } catch(e) {}
    }, 600); // adjust speed here

    // Stop animation after ~10s
    setTimeout(() => clearInterval(interval), 10000);
  }
};