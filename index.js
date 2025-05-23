// Main entry point for the vocabulary learning bot
require("dotenv").config();
const telegramBot = require("./bot/telegramBot");
const quizScheduler = require("./cron/quizScheduler");

// Biến toàn cục để lưu chatId của người dùng duy nhất (nếu cần)
global.userChatId = process.env.USER_CHAT_ID || null;

// Start the Telegram bot
telegramBot.start();

// Start the quiz scheduler
quizScheduler.start();

console.log("Vocabulary learning bot is running...");

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down bot...");
  telegramBot.stop();
  process.exit(0);
});
