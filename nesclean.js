const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

console.log("☕ Starting Nescafe Auto Cleaner v2.0...");

// 🔹 Mga log files na buburahin
const logFiles = [
  "log.json",
  "iplog.json",
  "error.log",
  "debug.log"
];

// 🔹 Mga folders na auto-clear
const cleanDirs = [
  "tmp",
  "cache",
  "backup",
  "debug",
  "node_modules/.cache"
];

// 🧹 Delete log files
for (const file of logFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🧹 Deleted file: ${file}`);
    } catch (err) {
      console.error(`❌ Error deleting ${file}:`, err.message);
    }
  } else {
    console.log(`✅ File not found: ${file}`);
  }
}

// 🧽 Delete folders recursively
for (const dir of cleanDirs) {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🧽 Cleared folder: ${dir}`);
    } catch (err) {
      console.error(`❌ Error clearing ${dir}:`, err.message);
    }
  } else {
    console.log(`✅ Folder not found: ${dir}`);
  }
}

// 🔄 Optional: Restart your bot
console.log("\n🔁 Restarting Nescafe Bot...");
exec("npm start", (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Restart failed: ${error.message}`);
    return;
  }
  console.log(stdout || stderr);
});