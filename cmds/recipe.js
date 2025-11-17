const axios = require("axios");

module.exports = {
  name: "recipe",
  version: "1.0",
  usePrefix: false,
  description: "Get a recipe based on ingredients using Spoonacular",
  usage: "recipe [ingredients,comma,separated]",

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const ingredients = args.join(",").toLowerCase().replace(/,\s+/g, ",");

    if (!ingredients) {
      return api.sendMessage("❗ Usage: recipe [ingredients]\nExample: recipe chicken,rice", threadID, messageID);
    }

    const apiKey = "0bb12ff3958a433cbab6580c438b6a64"; // Spoonacular key
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=1&apiKey=${apiKey}`;

    try {
      const res = await axios.get(url);
      const data = res.data;

      if (!data || data.length === 0) {
        return api.sendMessage(`⚠️ No recipe found using: ${ingredients.replace(/,/g, ", ")}`, threadID, messageID);
      }

      const recipe = data[0];
      const message = `🍽 Jonnel Recipe Suggestion\n\n📋 Ingredients: ${ingredients.replace(/,/g, ", ")}\n\n🍳 Recipe:\n${recipe.title}\n📝 Used Ingredients: ${recipe.usedIngredientCount}\n💡 Missed Ingredients: ${recipe.missedIngredientCount}\n🔗 Recipe ID: ${recipe.id}`;

      return api.sendMessage(message, threadID, messageID);
    } catch (err) {
      console.error("❌ Spoonacular RECIPE ERROR:", err.message);
      return api.sendMessage("❌ Error fetching recipe. Try again later.", threadID, messageID);
    }
  }
};