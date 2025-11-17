const math = require("mathjs");

module.exports = {
  config: {
    name: "calc",
    aliases: [],
    role: 0,
    guide: { en: "Usage: Calc 5+5 or Calc 2*(7-3)" }
  },

  execute: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const expression = args.join(" ").trim();

    if (!expression) {
      return api.sendMessage("⚠️ Please provide an expression to calculate.", threadID);
    }

    try {
      // Evaluate expression
      const result = math.evaluate(expression);

      // Unicode bold helper
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

      const message = `
🧮 𝗡𝗢𝗕𝗜 𝗖𝗔𝗟𝗖𝗨𝗟𝗔𝗧𝗢𝗥 RESULT
────────────────────────
📥 Expression: ${unicodeBold(expression)}
💡 Result: ${unicodeBold(result.toString())}
────────────────────────
⚡ Powered by: 𝐉𝐨𝐧𝐧𝐞𝐥 𝐒𝐨𝐫𝐢𝐚𝐧𝐨
`;

      return api.sendMessage(message, threadID);

    } catch (err) {
      return api.sendMessage(`❌ Invalid expression: ${expression}`, threadID);
    }
  }
};