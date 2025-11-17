const fs = require("fs");
const axios = require("axios");
const path = require("path");

const TOGGLE_FILE = path.join(__dirname, "../cmds/resendToggle.json");
const cache = new Map();

module.exports = {
  config: { eventType: ["message", "message_unsend"], name: "resend" },

  run: async function ({ api, event }) {
    const { threadID, messageID, type, senderID, body } = event;
    const botID = api.getCurrentUserID();
    const ownerID = "100082770721408"; // 🔑 Palitan mo kung iba FB ID mo

    // ===== Read latest toggle settings =====
    let toggle = {};
    try {
      toggle = JSON.parse(fs.readFileSync(TOGGLE_FILE));
    } catch {
      toggle = {};
    }

    // ===== Handle command "resend on/off" (no prefix needed) =====
    if (type === "message" && body?.toLowerCase().startsWith("resend ")) {
      const action = body.toLowerCase().split(" ")[1];

      // Only allow owner to toggle
      if (senderID !== ownerID) {
        return api.sendMessage("❌ Only the owner can change resend settings.", threadID);
      }

      if (["on", "off"].includes(action)) {
        toggle[threadID] = action === "on";
        fs.writeFileSync(TOGGLE_FILE, JSON.stringify(toggle, null, 2));
        return api.sendMessage(
          `🔁 Auto-resend is now ${action.toUpperCase()} ✅`,
          threadID
        );
      }
    }

    // ===== Store message if not from bot =====
    if (type === "message" && senderID !== botID && (body || event.attachments?.length)) {
      if (!cache.has(threadID)) cache.set(threadID, new Map());
      cache.get(threadID).set(messageID, {
        senderID,
        body: body || "",
        attachments: event.attachments || []
      });
    }

    // ===== Handle unsend event =====
    if (type === "message_unsend") {
      const isEnabled = toggle[threadID] ?? true; // default ON
      if (!isEnabled) return;

      const threadCache = cache.get(threadID);
      if (!threadCache) return;

      const original = threadCache.get(messageID);
      if (!original) return;

      // 🧩 BYPASS: Skip resend kung si owner o bot ang nag-unsent
      if (original.senderID === ownerID || original.senderID === botID) return;

      // ===== Get sender name =====
      let senderName = "Unknown User";
      try {
        const userInfo = await api.getUserInfo(original.senderID);
        if (userInfo[original.senderID]?.name) {
          senderName = userInfo[original.senderID].name;
        }
      } catch (e) {
        console.error("❌ Error getting user name:", e);
      }

      // ===== Prepare message and attachments =====
      const resendBody = `🔁 Message unsent by ${senderName}:\n\n${original.body || "[Attachment Only]"}`;
      const attachmentStreams = [];

      for (const item of original.attachments) {
        if (
          ["photo", "video", "sticker", "animated_image", "audio", "file"].includes(item.type) &&
          item.url
        ) {
          try {
            const res = await axios.get(item.url, { responseType: "stream" });
            attachmentStreams.push(res.data);
          } catch (err) {
            console.error("❌ Failed to fetch attachment:", err.message);
          }
        }
      }

      // ===== Send resend message =====
      api.sendMessage(
        {
          body: resendBody,
          attachment: attachmentStreams.length ? attachmentStreams : undefined
        },
        threadID
      );
    }
  }
};