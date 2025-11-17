const WebSocket = require("ws");
const axios = require("axios");
const activeSessions = new Map();
const lastSentCache = new Map();
const favoriteMap = new Map();
const globalLastSeen = new Map();

let sharedWebSocket = null;
let keepAliveInterval = null;

function formatValue(val) {
  if (val >= 1_000_000) return `x${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `x${(val / 1_000).toFixed(1)}K`;
  return `x${val}`;
}

function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function getTimeAgo(date) {
  const now = getPHTime();
  const diff = now - new Date(date);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hour < 24) return `${hour}h ago`;
  return `${day}d ago`;
}

function formatItems(items, useEmoji = true) {
  return items
    .filter(i => i.quantity > 0)
    .map(i => `• ${useEmoji && i.emoji ? i.emoji + " " : ""}${i.name}: ${formatValue(i.quantity)}`)
    .join("\n");
}

function cleanText(text) {
  return text.trim().toLowerCase();
}

function updateLastSeen(category, items) {
  if (!Array.isArray(items)) return;
  if (!globalLastSeen.has(category)) globalLastSeen.set(category, new Map());
  const catMap = globalLastSeen.get(category);
  const now = getPHTime();
  for (const item of items) {
    if (item.quantity > 0) {
      catMap.set(item.name, now);
    }
  }
}

function ensureWebSocketConnection() {
  if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) return;

  sharedWebSocket = new WebSocket("wss://gagstock.gleeze.com");

  sharedWebSocket.on("open", () => {
    keepAliveInterval = setInterval(() => {
      if (sharedWebSocket.readyState === WebSocket.OPEN) {
        sharedWebSocket.send("ping");
      }
    }, 10000);
  });

  sharedWebSocket.on("message", async (data) => {
    try {
      const payload = JSON.parse(data);
      if (payload.status !== "success" || !payload.data) return;

      const stock = payload.data;
      const stockData = {
        gear: stock.gear || { items: [] },
        seed: stock.seed || { items: [] },
        egg: stock.egg || { items: [] },
        cosmetics: stock.cosmetics || { items: [] },
        event: stock.honey || { items: [] },
        travelingmerchant: stock.travelingmerchant || { items: [] }
      };

      updateLastSeen("gear", stockData.gear.items);
      updateLastSeen("seed", stockData.seed.items);
      updateLastSeen("egg", stockData.egg.items);
      updateLastSeen("cosmetics", stockData.cosmetics.items);
      updateLastSeen("event", stockData.event.items);
      updateLastSeen("travelingmerchant", stockData.travelingmerchant.items);

      for (const [senderId, session] of activeSessions.entries()) {
        const favList = favoriteMap.get(senderId) || [];
        let sections = [];
        let matchCount = 0;

        function checkAndAdd(label, section, useEmoji, altCountdown = null) {
          const items = Array.isArray(section?.items) ? section.items.filter(i => i.quantity > 0) : [];
          if (items.length === 0) return false;
          const matchedItems = favList.length > 0
            ? items.filter(i => favList.includes(cleanText(i.name)))
            : items;
          if (favList.length > 0 && matchedItems.length === 0) return false;
          matchCount += matchedItems.length;
          const restockLabel = section.countdown || altCountdown;
          sections.push(`🟢 ${label}:\n${formatItems(matchedItems, useEmoji)}${restockLabel ? `\n⏳ Restock In: ${restockLabel}` : ""}`);
          return true;
        }

        checkAndAdd("𝗚𝗲𝗮𝗿", stockData.gear, true);
        checkAndAdd("𝗦𝗲𝗲𝗱𝘀", stockData.seed, true);
        checkAndAdd("𝗘𝗴𝗴𝘀", stockData.egg, true);
        checkAndAdd("𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰𝘀", stockData.cosmetics, false);
        checkAndAdd("𝗘𝘃𝗲𝗻𝘁", stockData.event, false);
        checkAndAdd("𝗧𝗿𝗮𝘃𝗲𝗹𝗶𝗻𝗴 𝗠𝗲𝗿𝗰𝗵𝗮𝗻𝘁", stockData.travelingmerchant, false, stockData.travelingmerchant.appearIn);

        if (favList.length > 0 && matchCount === 0) continue;
        if (sections.length === 0) continue;

        const updatedAt = getPHTime().toLocaleString("en-PH", {
          hour: "numeric", minute: "numeric", second: "numeric",
          hour12: true, day: "2-digit", month: "short", year: "numeric"
        });

        const weather = await axios.get("https://growagardenstock.com/api/stock/weather")
          .then(res => res.data).catch(() => null);

        const weatherInfo = weather
          ? `🌤️ Weather: ${weather.icon} ${weather.weatherType}\n📋 ${weather.description}\n🎯 Crop Bonuses: ${weather.cropBonuses}\n`
          : "";

        const title = favList.length > 0
          ? `♥️ ${matchCount} Favorite item${matchCount > 1 ? "s" : ""} Found!`
          : "🌾 Grow A Garden — Tracker";

        const messageKey = JSON.stringify({ title, sections, weatherInfo, updatedAt });
        const lastSent = lastSentCache.get(senderId);
        if (lastSent === messageKey) continue;

        lastSentCache.set(senderId, messageKey);
        await session.api.sendMessage(
          `🌟 Jonnel's Gagstock Tracker 🌟\n\n${title}\n\n${sections.join("\n\n")}\n\n${weatherInfo}📅 Updated at (PH): ${updatedAt}\n🔹 Bot Owner: Jonnel`,
          session.threadID
        );
      }
    } catch (_) {
      // Silent error
    }
  });

  sharedWebSocket.on("close", () => {
    clearInterval(keepAliveInterval);
    sharedWebSocket = null;
    setTimeout(ensureWebSocketConnection, 3000);
  });

  sharedWebSocket.on("error", () => sharedWebSocket?.close());
}

module.exports = {
  config: {
    name: "gagstock",
    version: "1.1",
    role: 0,
    countDown: 3,
    description: "Track Grow A Garden stock via WebSocket with favorites and last seen items",
    guide: {
      en: "gagstock on | gagstock off | gagstock fav add Carrot | gagstock lastseen gear"
    }
  },

  async execute({ api, event, args }) {
    const senderId = event.senderID;
    const threadID = event.threadID;
    const subcmd = args[0]?.toLowerCase();

    if (subcmd === "fav") {
      const action = args[1]?.toLowerCase();
      const input = args.slice(2).join(" ").split("|").map(i => cleanText(i)).filter(Boolean);
      if (!action || !["add", "remove"].includes(action) || input.length === 0) {
        return api.sendMessage("📌 Usage: gagstock fav add/remove Item1 | Item2", threadID);
      }
      const currentFav = favoriteMap.get(senderId) || [];
      const updated = new Set(currentFav);
      for (const name of input) {
        if (action === "add") updated.add(name);
        else if (action === "remove") updated.delete(name);
      }
      favoriteMap.set(senderId, Array.from(updated));
      return api.sendMessage(`✅ Favorite list updated: ${Array.from(updated).join(", ") || "(empty)"}\n🔹 Jonnel`, threadID);
    }

    if (subcmd === "lastseen") {
      const filters = args.slice(1).join(" ").split("|").map(c => c.trim().toLowerCase()).filter(Boolean);
      const categories = filters.length > 0 ? filters : ["gear", "seed", "egg", "cosmetics", "event", "travelingmerchant"];
      let result = [];
      for (const cat of categories) {
        const entries = globalLastSeen.get(cat);
        if (!entries || entries.size === 0) continue;
        const list = Array.from(entries.entries())
          .sort((a, b) => new Date(b[1]) - new Date(a[1]))
          .map(([name, date]) => `• ${name}: ${getTimeAgo(date)}`);
        result.push(`🔹 ${cat.toUpperCase()} (${list.length})\n${list.join("\n")}`);
      }
      if (result.length === 0) return api.sendMessage("⚠️ No last seen data found.", threadID);
      return api.sendMessage(`📦 Last Seen Items\n\n${result.join("\n\n")}\n🔹 Jonnel`, threadID);
}

if (subcmd === "off") {
  if (!activeSessions.has(senderId)) {
    return api.sendMessage("⚠️ You don't have an active Gagstock session.", threadID);
  }
  activeSessions.delete(senderId);
  lastSentCache.delete(senderId);
  return api.sendMessage("🛑 Gagstock tracking stopped.\n🔹 Jonnel", threadID);
}

if (subcmd !== "on") {
  return api.sendMessage(
    "📌 Usage:\n" +
    "• gagstock on — Start tracking\n" +
    "• gagstock fav add/remove Item1 | Item2 — Manage favorite items\n" +
    "• gagstock lastseen gear | seed — Show last seen items\n" +
    "• gagstock off — Stop tracking\n🔹 Jonnel",
    threadID
  );
}

if (activeSessions.has(senderId)) {
  return api.sendMessage("📡 You're already tracking Gagstock. Use gagstock off to stop.\n🔹 Jonnel", threadID);
}

activeSessions.set(senderId, { api, threadID });
api.sendMessage("✅ Gagstock tracking started via WebSocket!\n🌟 Updates will include your favorites and last seen items.\n🔹 Jonnel", threadID);
ensureWebSocketConnection();

} };