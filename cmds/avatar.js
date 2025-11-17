const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
    name: "changeavatar",
    usage: "changeavatar <image_url> OR reply to an image with 'changeavatar'",
    description: "Preview and change the bot's profile picture using an image URL or a replied image.",
    usePrefix: true,
    cooldown: 5,
    admin: true,	
    
    execute: async ({ api, event, args }) => {
        let imageUrl;

        // Determine image source
        if (event.messageReply && event.messageReply.attachments.length > 0) {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type !== "photo") {
                return api.sendMessage("⚠️ Please reply to an image, not another type of file.", event.threadID, event.messageID);
            }
            imageUrl = attachment.url;
        } else {
            if (args.length === 0) {
                return api.sendMessage("⚠️ Please provide an image URL or reply to an image.\n📌 Usage: changeavatar <image_url>", event.threadID, event.messageID);
            }
            imageUrl = args[0];
        }

        const date = new Date();
        const timeString = date.toLocaleTimeString();
        const dateString = date.toLocaleDateString();

        try {
            // Download the image
            const response = await axios.get(imageUrl, { responseType: "stream" });
            const imagePath = path.join(__dirname, "avatar_preview.jpg");

            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);

            writer.on("finish", async () => {
                const imageStream = fs.createReadStream(imagePath);

                // Preview message with colored circles
                const previewMsg = `🟢⚪🔴 𝗔𝗩𝗔𝗧𝗔𝗥 𝗣𝗥𝗘𝗩𝗜𝗘𝗪 🟢⚪🔴\n\n` +
                                   `👨‍💻 Creator: Jonnel Soriano\n` +
                                   `🕒 Time: ${timeString}\n` +
                                   `📅 Date: ${dateString}\n` +
                                   `📌 Thread ID: ${event.threadID}\n\n` +
                                   `⚠️ If you confirm, the bot will change its avatar to this image.\n` +
                                   `✅ Reply 'yes' to confirm or 'no' to cancel.`;

                api.sendMessage({ body: previewMsg, attachment: imageStream }, event.threadID, (err, info) => {
                    if (err) {
                        fs.unlinkSync(imagePath);
                        return console.error("❌ Preview error:", err);
                    }

                    // Listen for confirmation reply
                    const listener = async (confirmEvent) => {
                        if (confirmEvent.threadID !== event.threadID || confirmEvent.senderID !== event.senderID) return;
                        const reply = confirmEvent.body.toLowerCase().trim();
                        if (reply === "yes") {
                            // Change avatar
                            api.changeAvatar(fs.createReadStream(imagePath), "", null, (err) => {
                                fs.unlinkSync(imagePath);
                                if (err) {
                                    console.error("❌ Error changing avatar:", err);
                                    return api.sendMessage("❌ Failed to change the avatar. Ensure the image is valid.", event.threadID);
                                }
                                api.sendMessage("✅ Avatar changed successfully!", event.threadID);
                            });
                        } else if (reply === "no") {
                            fs.unlinkSync(imagePath);
                            api.sendMessage("❌ Avatar change cancelled.", event.threadID);
                        }

                        // Remove listener after first reply
                        api.removeListener("message", listener);
                    };

                    api.on("message", listener);
                });
            });

            writer.on("error", (error) => {
                console.error("❌ Error writing image file:", error);
                api.sendMessage("❌ Failed to process the image.", event.threadID, event.messageID);
            });
        } catch (error) {
            console.error("❌ Error downloading image:", error);
            api.sendMessage("❌ Failed to download the image. Ensure the URL is correct or reply to a valid image.", event.threadID, event.messageID);
        }
    },
};