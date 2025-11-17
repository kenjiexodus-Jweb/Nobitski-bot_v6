let warIntervals = {};
const ADMIN_UID = "100082770721408";

const toxicMessages = [
  "Hoy, utak-gulay! Alam mo bang kaharap mo ako, hindi pader?",
  "Galing mo magsalita, pero 'di ka marunong kumilos. Parang wifi, puro lag!",
  "Kung kaharap mo ang salamin, baka matakot ka sa sarili mong kahinaan!",
  "Ikaw yung tipo ng taong pinagsisihan ng mundo na nilikha pa!",
  "Hindi ka nakakainis kasi bobo ka, nakakainis ka kasi proud kang bobo!",
  "Ang value mo sa usapan? Negative. Wala kang silbi rito!"
];

const baliwMessages = [
  "Ako kausap ko sarili ko... at nananalo pa ako sa debate.",
  "Naririnig mo rin ba yung keyboard na sumisigaw ng 'tama na'?",
  "Nag-usap kami ng pader, siya lang nakakaintindi sakin.",
  "Inutusan ko sarili ko, pero tinamad din ako sundin.",
  "Ka-chat ko sarili ko, pero ini-seenzone pa ako.",
  "May multo sa bulsa ko, sinisingil ako ng utang."
];

const flirtyMessages = [
  "Ang ganda mo sa noti ko. Gusto mo araw-araw ka dun?",
  "Kung emoji ako, ikaw yung ❤️.",
  "Alam mo bang kahit loading ka, worth the wait ka?",
  "Kapag ikaw ang kausap ko, auto smile agad ako.",
  "Kape ka ba? Kasi ikaw ang nagpapagising sa'kin.",
  "Buti pa signal, hinahanap ka. Ako kaya?"
];

module.exports = {
  name: "war",
  version: "2.4.0",
  description: "Spam war messages: toxic, baliw, or flirty. Only admin can use.",
  usage: "war on / war baliw / war flirty @mention / war off",
  cooldown: 2,
  usePrefix: false,
  credits: "Jonnel",

  async execute({ api, event, args }) {
    const { threadID, messageID, senderID, mentions } = event;
    const key = `${threadID}:${senderID}`;
    const action = args[0]?.toLowerCase();

    if (senderID !== ADMIN_UID) {
      return api.sendMessage("Only the developer can use this command.", threadID, messageID);
    }

    if (!action || !["on", "off", "baliw", "flirty"].includes(action)) {
      return api.sendMessage("Gamitin:\n- war on\n- war baliw\n- war flirty @mention\n- war off", threadID, messageID);
    }

    if (action === "off") {
      if (warIntervals[key]) {
        clearInterval(warIntervals[key]);
        delete warIntervals[key];
        return api.sendMessage("❌ War mode stopped.", threadID, messageID);
      } else {
        return api.sendMessage("ℹ️ Walang active war mode.", threadID, messageID);
      }
    }

    if (warIntervals[key]) {
      return api.sendMessage("⚠️ War mode already active.", threadID, messageID);
    }

    let modeMessages = toxicMessages;
    let delay = 2000;
    let sentMessages = new Set();

    let mentionTarget = null;

    if (action === "baliw") {
      modeMessages = baliwMessages;
      delay = 4000;
    } else if (action === "flirty") {
      modeMessages = flirtyMessages;
      delay = 3000;

      // Require mention for flirty
      const mentionIDs = Object.keys(mentions || {});
      if (mentionIDs.length === 0) {
        return api.sendMessage("❌ Please mention someone to flirt with.\nExample: war flirty @pangalan", threadID, messageID);
      }

      const mentionID = mentionIDs[0];
      const mentionName = mentions[mentionID];
      mentionTarget = { id: mentionID, tag: mentionName };
    }

    const interval = setInterval(() => {
      const available = modeMessages.filter(msg => !sentMessages.has(msg));
      if (available.length === 0) sentMessages.clear();
      const pool = available.length > 0 ? available : modeMessages;
      const message = pool[Math.floor(Math.random() * pool.length)];
      sentMessages.add(message);

      if (action === "flirty" && mentionTarget) {
        api.sendMessage({
          body: `@${mentionTarget.tag}, ${message}`,
          mentions: [{ id: mentionTarget.id, tag: `@${mentionTarget.tag}` }]
        }, threadID);
      } else {
        api.sendMessage(message, threadID);
      }
    }, delay);

    warIntervals[key] = interval;

    const label = {
      "on": "🔥 War mode activated",
      "baliw": "🌀 Baliw mode activated",
      "flirty": "💗 Flirty mode activated"
    };

    return api.sendMessage(`${label[action]}. Use 'war off' to stop.`, threadID, messageID);
  }
};
