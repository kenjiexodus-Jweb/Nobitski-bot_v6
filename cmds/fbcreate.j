const axios = require("axios");

module.exports = {
  config: {
    name: "fbcreate",
    aliases: ["createfb"],
    version: "1.4",
    author: "Arnel",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Create fake Facebook account"
    },
    longDescription: {
      en: "Generate a Facebook account using Haji Mix API"
    },
    category: "utility",
    guide: {
      en: "{pn}"
    }
  },

  execute: async function ({ api, event }) {
    try {
      const url = "https://haji-mix-api.gleeze.com/api/fbcreate?amount=1&email=angelnicoigdalino23%40gmail.com&api_key=8672951c715e5945e70b9da2663e3bbc2a3e7c678738a094057e3117c3a699ea";
      const res = await axios.get(url);

      const account = res.data?.data?.[0]?.account;

      if (!account) {
        console.log("❌ API returned:", res.data);
        return api.sendMessage("❌ Failed to create Facebook account. Check API or response format.", event.threadID);
      }

      const msg =
`✅ Facebook Account Created

👤 Name: ${account.name}
📧 Email: ${account.email}
🔐 Password:
--- ${account.password} ---
🎂 Birthday: ${account.birthday}
🚻 Gender: ${account.gender}
📩 Note: ${account.message}`;

      return api.sendMessage(msg, event.threadID);
    } catch (error) {
      console.error("[fbcreate.js] Error:", error.message);
      return api.sendMessage("❌ Error creating Facebook account. Try again later.", event.threadID);
    }
  }
}
