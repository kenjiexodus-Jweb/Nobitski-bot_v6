const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "qrcode",
    version: "1.1",
    author: "Jonnel x Kaizenji",
    countDown: 5,
    role: 0,
    shortDescription: "Generate QR code from text/link",
    longDescription: "Gumawa ng QR code image mula sa text o link gamit ang QRServer API",
    category: "tools",
    guide: {
      en: "{pn} <text or link>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const text = args.join(" ").trim();

    if (!text) {
      return api.sendMessage(
        "⚠️ Pakilagay ang text o link para gawing QR code.\nHalimbawa: qrcode https://example.com",
        threadID,
        messageID
      );
    }

    const encoded = encodeURIComponent(text);
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;

    const header = " 📷 𝐐𝐑 𝐂𝐎𝐃𝐄 𝐆𝐄𝐍𝐄𝐑𝐀𝐓𝐎𝐑  📷 ";
    const waitMsg = await api.sendMessage(`${header}\n⏳ Ginagawa ang QR code...`, threadID);

    try {
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const imageData = response.data;

      const imagePath = path.join(__dirname, "../temp", `${Date.now()}_qrcode.png`);
      await fs.outputFile(imagePath, imageData);

      if (waitMsg?.messageID) await api.unsendMessage(waitMsg.messageID);

      const output = `${header}\n✅ QR code generated for:\n${text}`;
      await api.sendMessage(
        {
          body: output,
          attachment: fs.createReadStream(imagePath)
        },
        threadID
      );

      await fs.remove(imagePath);
    } catch (err) {
      console.error("QR Code generator error:", err);
      if (waitMsg?.messageID) await api.unsendMessage(waitMsg.messageID);
      return api.sendMessage(`${header}\n⚠️ May error habang ginagawa ang QR code.`, threadID);
    }
  }
};