#!/bin/bash
echo "🧹 Cleaning cache folder..."
rm -f cmds/cache/*.mp4
echo "✅ Cache cleared!"

git add .
git commit -m "Termux push: cleaned cache and updated commands"
git push origin main
echo "🚀 Push complete!"