const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "faceswap2",
    version: "1.0",
    author: "Jonnel Soriano",
    description: "Swap faces between two images using Pixlr API",
    category: "fun",
    role: 0,
    hasPrefix: false,
    aliases: ["swap2"]
  },

  async execute({ api, event }) {
    const header = "🤖 𝗙𝗔𝗖𝗘 𝗦𝗪𝗔𝗣 𝗕𝗬 𝗣𝗜𝗫𝗟𝗥 🤖";

    try {
      const reply = event.messageReply;
      if (!reply || reply.attachments.length !== 2)
        return api.sendMessage(`${header}\n❗ Reply to a message with **exactly two images**.`, event.threadID);

      const [img1, img2] = reply.attachments;
      if (img1.type !== "photo" || img2.type !== "photo")
        return api.sendMessage(`${header}\n❗ Both attachments must be **images**.`, event.threadID);

      // Step 1: Animated loading message
      const frames = ["⏳ Processing.", "⏳ Processing..", "⏳ Processing..."];
      const loadingMsg = await api.sendMessage(frames[0], event.threadID);
      let frameIndex = 0;
      const interval = setInterval(async () => {
        frameIndex = (frameIndex + 1) % frames.length;
        try { await api.editMessage(frames[frameIndex], loadingMsg.messageID); } catch {}
      }, 700);

      // Step 2: Download both images
      const tempDir = path.join(__dirname, "..", "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const download = async (url, name) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const p = path.join(tempDir, name);
        fs.writeFileSync(p, res.data);
        return p;
      };

      const imgPath1 = await download(img1.url, "face1.jpg");
      const imgPath2 = await download(img2.url, "face2.jpg");

      // Step 3: Prepare FormData for Pixlr API
      const formData = new FormData();
      formData.append("image1", fs.createReadStream(imgPath1));
      formData.append("image2", fs.createReadStream(imgPath2));
      formData.append("client_key", "6911a53b8bb99d6583b37390");
      formData.append("client_secret", "71f82ccb4dd14b4a86729db93c49cd38");

      // Step 4: Send request to Pixlr FaceSwap endpoint
      const response = await axios.post(
        "https://api.pixlr.com/v1/faceswap",
        formData,
        { headers: { ...formData.getHeaders() }, timeout: 60000, validateStatus: null }
      );

      // Step 5: Stop animation
      clearInterval(interval);

      // Step 6: Handle response
      if (response.status !== 200 || !response.data?.output_url)
        return api.sendMessage(`${header}\n❌ Failed to swap faces.\n📄 Error: ${response.status} ${response.statusText}`, event.threadID);

      const resultUrl = response.data.output_url;
      const resultImg = await axios.get(resultUrl, { responseType: "arraybuffer" });

      await api.editMessage(`${header}\n✅ Face swap successful!`, loadingMsg.messageID);
      await api.sendMessage({ attachment: Buffer.from(resultImg.data) }, event.threadID);

      // Step 7: Cleanup
      fs.unlinkSync(imgPath1);
      fs.unlinkSync(imgPath2);

    } catch (err) {
      console.error("❌ FaceSwap2 Error:", err.message);
      return api.sendMessage(`${header}\n❌ Failed to swap faces.\n📄 Error: ${err.message}`, event.threadID);
    }
  }
};