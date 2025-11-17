const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  name: "cleanbot",
  version: "1.1",
  description: "Auto-clean logs and cache, with dry run option",
  usage: "cleanbot [dry]",
  cooldown: 10,
  role: 1, // admin only
  credits: "Jonnel",

  async execute({ api, event, args }) {
    const threadID = event.threadID;
    const isDryRun = args[0]?.toLowerCase() === "dry";

    const logFiles = [
      "log.json",
      "iplog.json",
      "error.log",
      "debug.log"
    ];

    const cleanDirs = [
      "tmp",
      "cache",
      "backup",
      "debug",
      "node_modules/.cache"
    ];

    const msg = await api.sendMessage(
      isDryRun
        ? "🟡 Dry run mode: Listing files/folders to delete..."
        : "🧹 Starting Auto Cleaner...",
      threadID
    );

    let output = "";

    // Check log files
    for (const file of logFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        output += `🗑️ File: ${file}\n`;
        if (!isDryRun) fs.unlinkSync(filePath);
      }
    }

    // Check folders
    for (const dir of cleanDirs) {
      const dirPath = path.join(__dirname, dir);
      if (fs.existsSync(dirPath)) {
        output += `🗂️ Folder: ${dir}\n`;
        if (!isDryRun) fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }

    await api.unsendMessage(msg.messageID);

    if (isDryRun) {
      await api.sendMessage(`🟡 Dry run complete! Files/folders that would be deleted:\n\n${output}`, threadID);
    } else {
      await api.sendMessage(`✅ Cleaning complete! Deleted files/folders:\n\n${output}\n🔁 Restarting bot...`, threadID);
      exec("npm start", (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Restart failed: ${error.message}`);
          return api.sendMessage(`❌ Bot restart failed: ${error.message}`, threadID);
        }
        console.log(stdout || stderr);
      });
    }
  }
};