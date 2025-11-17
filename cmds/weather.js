const axios = require("axios");

// Helper function to pick weather emoji
function getWeatherEmoji(condition) {
  condition = condition.toLowerCase();
  if (condition.includes("sun") || condition.includes("clear")) return "🌞";
  if (condition.includes("cloud")) return "☁️";
  if (condition.includes("rain") || condition.includes("shower")) return "🌧️";
  if (condition.includes("thunder")) return "⚡";
  if (condition.includes("snow")) return "❄️";
  if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze")) return "🌫️";
  return "🌤️";
}

module.exports = {
  name: "weather",
  version: "2.1",
  usePrefix: false,
  description: "Check current weather in any city with icons",
  usage: "weather [city name]",
  credits: "Jonnel",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length) {
      return api.sendMessage(
        "🌦️ Usage: weather [city name]\nExample: weather Manila",
        threadID,
        messageID
      );
    }

    const city = args.join(" ");

    try {
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = res.data;

      if (!data || !data.current_condition) {
        return api.sendMessage("❌ Could not retrieve weather data. Check city name.", threadID, messageID);
      }

      const current = data.current_condition[0];
      const locationName = city.charAt(0).toUpperCase() + city.slice(1);
      const weatherEmoji = getWeatherEmoji(current.weatherDesc[0].value);

      const msg =
`🟢⚪🔴 ── 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗥𝗲𝗽𝗼𝗿𝘁 ── 🟢⚪🔴
📍 City: ${locationName}
🌡️ Temperature: ${current.temp_C}°C ${weatherEmoji}
☁️ Condition: ${current.weatherDesc[0].value} ${weatherEmoji}
💧 Humidity: ${current.humidity}%
🌬️ Wind: ${current.windspeedKmph} km/h
🌡️ Feels Like: ${current.FeelsLikeC}°C
🌅 Sunrise: ${data.weather[0].astronomy[0].sunrise}
🌇 Sunset: ${data.weather[0].astronomy[0].sunset}

🤖 Powered by Jonnel Soriano Bot
🛡️ Made with 💚 2025 — JSWEB ORG`;

      api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.error("❌ Weather API Error:", err.message);
      api.sendMessage(
        `❌ Failed to fetch weather for "${city}". Please check spelling or try again later.`,
        threadID,
        messageID
      );
    }
  }
};