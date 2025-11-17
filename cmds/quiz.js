const axios = require("axios");
const he = require("he"); // para i-decode HTML entities from API

module.exports = {
  name: "quiz",
  description: "Random trivia quiz (multiple choice)",
  author: "Jonnel Soriano",
  hasPrefix: false,
  cooldown: 3,

  async execute({ api, event }) {
    const { threadID, senderID } = event;

    // Start message
    await api.sendMessage("💭 AI QUIZ STARTING...\n📘 Fetching a trivia question...", threadID);

    let questionData;
    try {
      const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple", { timeout: 10000 });
      if (res.data.response_code !== 0 || !res.data.results || !res.data.results.length) {
        return api.sendMessage("⚠️ Failed to fetch a quiz question. Try again later.", threadID);
      }

      const q = res.data.results[0];
      const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);

      questionData = {
        question: he.decode(q.question),
        correct_answer: he.decode(q.correct_answer),
        options: options.map(opt => he.decode(opt))
      };
    } catch (err) {
      console.error("❌ Quiz API Error:", err.message);
      return api.sendMessage("⚠️ Failed to fetch a quiz question. Try again later.", threadID);
    }

    // Send question
    const letters = questionData.options.map((_, i) => String.fromCharCode(65 + i));
    const msg = `💭 AI QUIZ GAME\n\n❓ ${questionData.question}\n\n${questionData.options
      .map((o, i) => `${letters[i]}. ${o}`)
      .join("\n")}\n\n💬 Reply with the letter of your answer`;

    api.sendMessage(msg, threadID, (err, info) => {
      if (err) return console.error(err);

      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: "quiz",
        messageID: info.messageID,
        threadID,
        author: senderID,
        questionData
      });
    });
  },

  async handleReply({ api, event, handleReply }) {
    const { body, threadID } = event;
    const hr = handleReply;
    const answer = body.trim().toUpperCase();

    const letters = hr.questionData.options.map((_, i) => String.fromCharCode(65 + i));

    if (!letters.includes(answer)) {
      return api.sendMessage(`⚠️ Please reply with ${letters.join(", ")}`, threadID);
    }

    const correctLetter = String.fromCharCode(65 + hr.questionData.options.indexOf(hr.questionData.correct_answer));

    const resultMsg =
      answer === correctLetter
        ? "✅ Correct! Well done."
        : `❌ Wrong! The correct answer is: ${correctLetter}. ${hr.questionData.correct_answer}`;

    api.sendMessage(resultMsg, threadID);

    // Remove from handleReply
    global.client.handleReply = global.client.handleReply.filter(h => h !== hr);
  }
};