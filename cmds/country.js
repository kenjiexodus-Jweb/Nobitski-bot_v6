const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "country",
    version: "1.2",
    author: "Jonnel",
    description: "Get information about any country with region-based GIF and animated header.",
    usage: "[country name]",
    commandCategory: "info",
    cooldowns: 5,
  },

  onStart: async function ({ api, event, args }) {
    const name = args.join(" ");
    if (!name) return api.sendMessage("❌ Please provide a country name.", event.threadID);

    const url = `https://rapido.zetsu.xyz/api/country?name=${encodeURIComponent(name)}`;

    try {
      const res = await axios.get(url);
      const data = res.data;

      if (!data.name?.common) throw new Error("Invalid data");

      const {
        name: { common, official },
        capital,
        region,
        subregion,
        population,
        area,
        currencies,
        languages,
        flag,
        maps,
      } = data;

      const currency = Object.values(currencies)[0];
      const languageList = Object.values(languages).join(", ");

      // 🎬 Dynamic GIF based on region
      const gifMapping = {
        Asia: "https://media.giphy.com/media/3o6Zt8MgUuvSbkZYWc/giphy.gif",
        Europe: "https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif",
        Africa: "https://media.giphy.com/media/26xBs5qUu0kBkpU2E/giphy.gif",
        Americas: "https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif",
        Oceania: "https://media.giphy.com/media/3o6ZsU7W9vIhH1INv2/giphy.gif",
      };

      const regionGif = gifMapping[region] || "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif";

      const header = `
🟢⚪🔴  🌍 𝗖𝗢𝗨𝗡𝗧𝗥𝗬 𝗜𝗡𝗙𝗢 🌍  🟢⚪🔴
👑 Requested via: Jonnel
`;

      const reply = `
${header}
🇦🇹 Name: ${common} (${official})
🏙️ Capital: ${capital?.[0] || "N/A"}
📍 Region: ${region} - ${subregion}
👫 Population: ${population.toLocaleString()}
📐 Area: ${area.toLocaleString()} km²
💱 Currency: ${currency.name} (${currency.symbol})
🗣️ Languages: ${languageList}
🚩 Flag: ${flag}
🗺️ [View on Google Maps](${maps.googleMaps})
`;

      api.sendMessage(
        {
          body: reply,
          attachment: fs.createReadStream(await downloadGif(regionGif))
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Country not found or error occurred.", event.threadID, event.messageID);
    }
  }
};

// Helper to download GIF temporarily
async function downloadGif(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const gifPath = path.join(__dirname, "cache", `country_${Date.now()}.gif`);
  fs.ensureDirSync(path.dirname(gifPath));
  fs.writeFileSync(gifPath, Buffer.from(response.data, "binary"));
  return gifPath;
}