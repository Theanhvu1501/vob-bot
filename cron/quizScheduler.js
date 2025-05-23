const cron = require("node-cron");
const telegramBot = require("../bot/telegramBot");
const notionService = require("../services/notionService");

// Get quiz time from environment variables
const QUIZ_HOUR = process.env.QUIZ_HOUR || 8;
const QUIZ_MINUTE = process.env.QUIZ_MINUTE || 0;

// Store active chat IDs (in a real app, these should be stored in a database)
// This is a simple in-memory solution for demonstration
const activeChatIds = new Set();

/**
 * Add a chat ID to the active list
 * @param {number} chatId - Telegram chat ID to add
 */
function addActiveChatId(chatId) {
  activeChatIds.add(chatId);
  console.log(
    `Added chat ID ${chatId} to active list. Total active: ${activeChatIds.size}`
  );
}

/**
 * Remove a chat ID from the active list
 * @param {number} chatId - Telegram chat ID to remove
 */
function removeActiveChatId(chatId) {
  activeChatIds.delete(chatId);
  console.log(
    `Removed chat ID ${chatId} from active list. Total active: ${activeChatIds.size}`
  );
}

/**
 * Send daily quiz to all active chats
 */
async function sendDailyQuiz() {
  console.log(`Sending daily quiz to ${activeChatIds.size} active chats`);

  // Get bot instance
  const bot = telegramBot.getBot();
  if (!bot) {
    console.error("Bot not initialized");
    return;
  }

  // Check if we have any active chats
  if (activeChatIds.size === 0) {
    console.log("No active chats to send quiz to");
    return;
  }

  // Send quiz to each active chat
  for (const chatId of activeChatIds) {
    try {
      await telegramBot.sendQuiz(chatId);
      console.log(`Sent daily quiz to chat ID ${chatId}`);

      // Add a small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error sending quiz to chat ID ${chatId}:`, error);

      // If the chat is no longer available, remove it from active list
      if (error.code === 403) {
        removeActiveChatId(chatId);
      }
    }
  }
}

/**
 * Start the quiz scheduler
 */
function start() {
  // Schedule daily quiz at specified time
  const cronSchedule = `${QUIZ_MINUTE} ${QUIZ_HOUR} * * *`;

  cron.schedule(cronSchedule, sendDailyQuiz);

  console.log(
    `Quiz scheduler started. Daily quiz will be sent at ${QUIZ_HOUR}:${QUIZ_MINUTE.toString().padStart(
      2,
      "0"
    )}`
  );

  // Set up message listener to track active chats
  const bot = telegramBot.getBot();
  if (bot) {
    bot.on("message", (msg) => {
      const chatId = msg.chat.id;
      addActiveChatId(chatId);
    });

    // Also track users who use commands
    bot.on("callback_query", (query) => {
      const chatId = query.message.chat.id;
      addActiveChatId(chatId);
    });
  }
}

module.exports = {
  start,
  addActiveChatId,
  removeActiveChatId,
  sendDailyQuiz,
};
