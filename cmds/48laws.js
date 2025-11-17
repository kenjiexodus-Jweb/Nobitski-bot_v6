const axios = require("axios");

module.exports = {
  config: {
    name: "48laws",
    version: "1.2",
    author: "Jonnel Soriano",
    description: "Fetch a random '48 Laws of Power' by number",
    category: "fun",
    role: 0,
    hasPrefix: false // ✅ walang ! prefix
  },

  async execute({ api, event }) {
    const { threadID, body } = event;

    // Extract number from message (e.g., "48laws 5")
    const args = body.split(" ").slice(1);
    let number = parseInt(args[0]) || 1; // default sa 1 kung walang ibinigay
    if (number < 1) number = 1;
    if (number > 48) number = 48; // limit sa 48 laws

    api.sendMessage("💭 Fetching a Law of Power...", threadID);

    try {
      const res = await axios.get(
        `https://haji-mix-api.gleeze.com/api/law?number=${number}&api_key=b4d62c41ceb8af172f8f592bea566cb441c4e541c37915d04169cca7c5ee675f`,
        { timeout: 10000 }
      );

      // ✅ Flexible data extraction
      let lawText = null;
      if (typeof res.data === "string") {
        lawText = res.data;
      } else if (res.data.law) {
        lawText = res.data.law;
      } else if (res.data.text) {
        lawText = res.data.text;
      } else if (res.data.message) {
        lawText = res.data.message;
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        lawText = res.data[0].law || res.data[0].text || JSON.stringify(res.data[0]);
      } else if (res.data.data) {
        lawText = res.data.data.law || res.data.data.text || JSON.stringify(res.data.data);
      }

      if (lawText) {
        // --- Unicode Bold helper ---
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

        const msg = `💼 ${unicodeBold("48 Laws of Power")} — Law #${number}\n\n${unicodeBold(lawText)}\n\n— Source: Haji Mix API`;
        return api.sendMessage(msg, threadID);
      } else {
        return api.sendMessage("⚠️ No law found in API response. Please try again later.", threadID);
      }

    } catch (err) {
      console.error("❌ 48Laws API Error:", err.message);
      return api.sendMessage(
        `❌ Error fetching law:\n${err.message}\n\nPlease try again later.`,
        threadID
      );
    }
  }
};