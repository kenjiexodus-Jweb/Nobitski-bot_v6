// cmds/call.js
const axios = require("axios");
const qs = require("querystring");

module.exports = {
  config: {
    name: "call",
    version: "1.1",
    author: "Jonnel",
    description: "Make an outbound phone call using Twilio (owner-only)",
    category: "utility",
    role: 0,
    hasPrefix: false,
    guide: { en: "Usage: call <toNumber>\nExample: call +639123456789" }
  },

  async execute({ api, event, args }) {
    try {
      const { threadID, messageID, senderID } = event;

      // ======= HARDCODED CONFIG =======
      const OWNER_ID = "100082770721408"; // only owner can use
      const TWILIO_ACCOUNT_SID = "AC230adc92e3d3349f0cf31c793d5a0f0b";
      const TWILIO_AUTH_TOKEN = "82ff204e63b6a3bc1a023be9cea0f11a";
      const TWILIO_FROM_NUMBER = "+19209902693"; // your Twilio number
      // ================================

      // owner-only check
      if (senderID !== OWNER_ID) {
        return api.sendMessage("⛔ Access Denied.", threadID, messageID);
      }

      if (!args || args.length === 0) {
        return api.sendMessage("❌ Usage: call <toNumber>", threadID, messageID);
      }

      let toNumber = args[0].trim();

      // Convert local number format (09123456789) to +63
      if (!toNumber.startsWith("+")) {
        toNumber = "+63" + toNumber.replace(/^0+/, "");
      }

      // simple number validation
      if (!/^\+?\d{9,15}$/.test(toNumber)) {
        return api.sendMessage("❌ Invalid phone number format.", threadID, messageID);
      }

      // Prepare TwiML directly
      const twiml = `<Response><Say voice="alice" language="en-US">Hello! This is Nobita Bot calling you. Have a great day!</Say></Response>`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

      const body = {
        To: toNumber,
        From: TWILIO_FROM_NUMBER,
        Twiml: twiml
      };

      const res = await axios.post(twilioUrl, qs.stringify(body), {
        auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000
      });

      const sid = res.data?.sid || "unknown";
      return api.sendMessage(`📞 Calling ${toNumber}... Call SID: ${sid}`, threadID, messageID);

    } catch (err) {
      // ERROR HANDLER para hindi mamamatay ang bot
      console.error("❌ Twilio call error (handled):", err.response?.data || err.message || err);
      try {
        await api.sendMessage(`⚠️ Call failed or an error occurred, but bot continues running.`, event.threadID);
      } catch (_) {}
    }
  }
};