const fs = require("fs");
const path = require("path");
const { format, getDaysInMonth, startOfMonth, getDay } = require("date-fns");

const eventsFile = path.join(__dirname, "events.json");
let eventsData = {};
try { eventsData = require(eventsFile); } catch {}

module.exports = {
  config: {
    name: "calendar",
    guide: { en: "Show calendar or add event" },
    role: 0
  },
  execute: async ({ api, event, args }) => {
    const threadID = event.threadID;
    if (!args.length) {
      // Show current month calendar
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed
      const daysInMonth = getDaysInMonth(now);
      const startDay = getDay(startOfMonth(now)); // 0 = Sunday

      let calendar = "📅 𝗡𝗢𝗕𝗜 𝗖𝗔𝗟𝗘𝗡𝗗𝗔𝗥\n";
      calendar += `📆 ${format(now,"MMMM yyyy").toUpperCase()}\n`;
      calendar += "───────────────────────────────\n";
      calendar += "Su Mo Tu We Th Fr Sa\n";

      let week = Array(startDay).fill("  ");
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = d < 10 ? ` ${d}` : `${d}`;
        // Check if there's event
        let mark = "";
        const threadEvents = eventsData[threadID] || [];
        if (threadEvents.some(e => new Date(e.date).getDate() === d && new Date(e.date).getMonth() === month)) {
          mark = "*"; // mark event
        }
        week.push(dayStr + mark);
        if (week.length === 7) {
          calendar += week.join(" ") + "\n";
          week = [];
        }
      }
      if (week.length) calendar += week.join(" ") + "\n";

      // Today's date
      const todayStr = format(now,"dd MMMM yyyy");
      calendar += `\n📍 Today: ${todayStr}\n`;

      // List events
      const monthEvents = (eventsData[threadID] || []).filter(e => new Date(e.date).getMonth() === month);
      monthEvents.forEach(e => {
        const day = new Date(e.date).getDate();
        calendar += `* ${format(new Date(e.date),"dd MMM")} → ${e.title}\n`;
      });

      calendar += "───────────────────────────────\n";
      calendar += "⚡ POWERED BY : 𝗝𝗼𝗻𝗻𝗲𝗹 𝗦𝗼𝗿𝗶𝗮𝗻𝗼 💻\n";

      return api.sendMessage(calendar, threadID);
    } else {
      // Add new event: args = ["Dec", "11", "Jonnel Birthday 🎂"]
      const [monthStr, dayStr, ...titleArr] = args;
      const monthIndex = new Date(`${monthStr} 1, 2000`).getMonth(); // convert month name to index
      const day = parseInt(dayStr);
      const year = new Date().getFullYear();
      const title = titleArr.join(" ");

      if (!eventsData[threadID]) eventsData[threadID] = [];
      eventsData[threadID].push({ date: `${year}-${monthIndex+1}-${day}`, title });
      fs.writeFileSync(eventsFile, JSON.stringify(eventsData,null,2));

      return api.sendMessage(`✅ Event added: ${monthStr} ${day} → ${title}`, threadID);
    }
  }
};