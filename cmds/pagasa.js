const axios = require("axios");

const OPENWEATHER_API = "10fa60444edce396861c63ed8672ef38";

module.exports = {
  config: {
    name: "pagasa",
    version: "3.1",
    author: "Jonnel Soriano",
    description: "Shows current weather per city (OpenWeather only)",
    category: "tools",
    role: 0,
    hasPrefix: false
  },

  async execute({ api, event, args }) {
    const { threadID } = event;

    if (!args || args.length === 0) {
      return api.sendMessage(
        "⚠️ Usage: pagasa <CITY, PROVINCE>\nExample: pagasa Infanta, Quezon",
        threadID
      );
    }

    const area = args.join(" ");
    const formattedArea = area.charAt(0).toUpperCase() + area.slice(1);

    try {
      const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(area)}&appid=${OPENWEATHER_API}&units=metric`;
      const weatherRes = await axios.get(weatherURL);
      const w = weatherRes.data;

      const weatherMsg = `
🌤️ Weather Update for ${formattedArea}:
🌡️ Temperature: ${w.main.temp}°C
☁️ Condition: ${w.weather[0].description.toUpperCase()}
💧 Humidity: ${w.main.humidity}%
🌬️ Wind Speed: ${w.wind.speed} km/h
`.trim();

      api.sendMessage(weatherMsg, threadID);

    } catch (err) {
      console.error("❌ Weather command error:", err.message);
      api.sendMessage("❌ Error fetching weather data. Please try again later.", threadID);
    }
  }
};