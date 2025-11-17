const fs = require("fs");

try {
  // Basahin ang cookies.txt
  const cookiesText = fs.readFileSync("cookies.txt", "utf-8");

  // Hatiin bawat linya, alisin empty lines at comments
  const lines = cookiesText
    .split("\n")
    .filter(line => line.trim() && !line.startsWith("#"));

  const appState = [];

  for (const line of lines) {
    // Auto-detect kung tab o space separator
    const parts = line.includes("\t") ? line.split("\t") : line.trim().split(/\s+/);

    // Check kung valid format (dapat may at least 7 parts)
    if (parts.length < 7) {
      console.warn("⚠️ Skipped invalid line:", line);
      continue;
    }

    // Convert sa appState format
    appState.push({
      key: parts[5],
      value: parts[6],
      domain: parts[0],
      path: parts[2],
      hostOnly: parts[1] === "FALSE",
      creation: Date.now(),
      lastAccessed: Date.now()
    });
  }

  // Isave sa JSON file
  fs.writeFileSync("appState.json", JSON.stringify(appState, null, 2));

  console.log(`✅ Successfully converted ${appState.length} cookies → appState.json!`);
} catch (err) {
  console.error("❌ Error:", err.message);
}
