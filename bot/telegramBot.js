const TelegramBot = require("node-telegram-bot-api");
const aiService = require("../services/aiService");
const notionService = require("../services/notionService");
const helpers = require("../utils/helpers");
const userService = require("../services/userService");
const studyService = require("../services/studyService");
const quizService = require("../services/quizService");
const { PREDEFINED_TOPICS, TOPIC_DESCRIPTIONS } = require("../utils/constants");

// Initialize the bot with the token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

// Thay đổi cách xử lý chatId
// Thêm biến để lưu trữ ID của nhóm
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || null;

// Keyboard options
const MAIN_KEYBOARD = {
  reply_markup: {
    keyboard: [
      ["📝 Thêm từ mới", "🎮 Quiz ngẫu nhiên"],
      ["🏷️ Quiz theo chủ đề", "📚 Ôn tập hôm nay"],
      ["📊 Thống kê", "⚙️ Cài đặt"],
    ],
    resize_keyboard: true,
  },
};
const a = 1;
const b = 2;
const TOPICS_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🏢 Business", callback_data: a },
        { text: "💻 Technology", callback_data: b },
      ],
      [
        { text: "🏢 Business", callback_data: "topic_Business" },
        { text: "💻 Technology", callback_data: "topic_Technology" },
      ],
      [
        { text: "🏢 Business", callback_data: "topic_Business" },
        { text: "💻 Technology", callback_data: "topic_Technology" },
      ],
      [
        { text: "🏥 Health", callback_data: "topic_Health" },
        { text: "🎓 Education", callback_data: "topic_Education" },
      ],
      [
        { text: "🌍 Travel", callback_data: "topic_Travel" },
        { text: "🍽️ Food", callback_data: "topic_Food" },
      ],
      [
        { text: "🏛️ Politics", callback_data: "topic_Politics" },
        { text: "🎭 Entertainment", callback_data: "topic_Entertainment" },
      ],
      [
        { text: "📚 All Topics", callback_data: "topic_all" },
        { text: "↩️ Back", callback_data: "back_to_main" },
      ],
    ],
  },
};

/**
 * Start the Telegram bot and set up message handlers
 */
function start() {
  bot = new TelegramBot(token, { polling: true });

  // Thiết lập các lệnh cho bot
  bot.setMyCommands([
    { command: "/start", description: "Khởi động bot" },
    { command: "/help", description: "Xem hướng dẫn sử dụng" },
    { command: "/quiz", description: "Nhận một quiz ngẫu nhiên" },
    { command: "/topics", description: "Xem danh sách chủ đề từ vựng" },
    { command: "/stats", description: "Xem thống kê học tập" },
    { command: "/review", description: "Ôn tập từ vựng hôm nay" },
    { command: "/settings", description: "Điều chỉnh cài đặt" },
    { command: "/id", description: "Lấy ID chat của bạn" },
  ]);

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    // Lưu chatId vào biến toàn cục để sử dụng trong quizScheduler
    global.userChatId = chatId;

    // Kiểm tra xem đây có phải là nhóm không
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";

    if (isGroup) {
      // Lưu ID nhóm nếu chưa có
      if (!global.groupChatId) {
        global.groupChatId = chatId;
        console.log(`Bot đã được khởi động trong nhóm với ID: ${chatId}`);
      }

      bot.sendMessage(
        chatId,
        "👋 Chào mừng! Bot học từ vựng đã sẵn sàng phục vụ nhóm này.\n\n" +
          'Các thành viên có thể gửi từ vựng theo định dạng: "từ - nghĩa"\n' +
          'Ví dụ: "inflation - lạm phát"\n\n' +
          "Bot sẽ tự động phân loại và tạo câu ví dụ cho mọi người.",
        MAIN_KEYBOARD
      );
    } else {
      // Phản hồi cho chat cá nhân như trước
      bot.sendMessage(
        chatId,
        "👋 Chào mừng bạn đến với Bot học từ vựng!\n\n" +
          'Gửi từ vựng theo định dạng: "từ - nghĩa"\n' +
          'Ví dụ: "inflation - lạm phát"\n\n' +
          "Bot sẽ tự động phân loại và tạo câu ví dụ cho bạn.",
        MAIN_KEYBOARD
      );
    }
  });

  // Thêm lệnh /id để lấy chat ID bất cứ lúc nào
  bot.onText(/\/id/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;

    bot.sendMessage(
      chatId,
      `🆔 Chat ID: ${chatId}\n` +
        `📝 Loại chat: ${chatType}\n\n` +
        "Hãy sao chép ID này và thêm vào file .env với biến GROUP_CHAT_ID",
      MAIN_KEYBOARD
    );
  });

  // Handle /help command
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "📚 *Hướng dẫn sử dụng Bot* 📚\n\n" +
        "*Cách thêm từ mới:*\n" +
        'Gửi tin nhắn theo định dạng: "từ - nghĩa"\n' +
        'Ví dụ: "inflation - lạm phát"\n\n' +
        "*Các lệnh:*\n" +
        "/start - Khởi động bot\n" +
        "/help - Xem hướng dẫn\n" +
        "/quiz - Nhận một quiz ngay lập tức\n" +
        "/stats - Xem thống kê học tập\n" +
        "/review - Ôn tập từ vựng hôm nay\n" +
        "/settings - Điều chỉnh cài đặt\n\n" +
        "*Mẹo:*\n" +
        "- Bot sẽ tự động phân loại từ vựng\n" +
        "- Bạn sẽ nhận được quiz hàng ngày\n" +
        "- Từ vựng được lên lịch ôn tập theo phương pháp spaced repetition",
      {
        parse_mode: "Markdown",
        ...MAIN_KEYBOARD,
      }
    );
  });

  // Handle /quiz command
  bot.onText(/\/quiz/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await sendQuiz(chatId);
    } catch (error) {
      console.error("Error sending quiz:", error);
      bot.sendMessage(
        chatId,
        "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau.",
        MAIN_KEYBOARD
      );
    }
  });

  // Handle /stats command
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      // TODO: Implement stats functionality
      const stats = {
        totalWords: 42,
        learnedWords: 28,
        reviewToday: 5,
        streak: 7,
      };

      bot.sendMessage(
        chatId,
        "📊 *Thống kê học tập của bạn* 📊\n\n" +
          `Tổng số từ vựng: *${stats.totalWords}*\n` +
          `Từ đã học: *${stats.learnedWords}* (${Math.round(
            (stats.learnedWords / stats.totalWords) * 100
          )}%)\n` +
          `Cần ôn tập hôm nay: *${stats.reviewToday}*\n` +
          `Số ngày học liên tiếp: *${stats.streak}* 🔥`,
        {
          parse_mode: "Markdown",
          ...MAIN_KEYBOARD,
        }
      );
    } catch (error) {
      console.error("Error getting stats:", error);
      bot.sendMessage(
        chatId,
        "Có lỗi xảy ra khi lấy thống kê. Vui lòng thử lại sau.",
        MAIN_KEYBOARD
      );
    }
  });

  // Handle /review command
  bot.onText(/\/review/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      // TODO: Implement review functionality
      bot.sendMessage(
        chatId,
        "Tính năng ôn tập sẽ sớm được ra mắt!",
        MAIN_KEYBOARD
      );
    } catch (error) {
      console.error("Error starting review:", error);
      bot.sendMessage(
        chatId,
        "Có lỗi xảy ra khi bắt đầu ôn tập. Vui lòng thử lại sau.",
        MAIN_KEYBOARD
      );
    }
  });

  // Handle /settings command
  bot.onText(/\/settings/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(
      chatId,
      "⚙️ *Cài đặt* ⚙️\n\nChọn cài đặt bạn muốn thay đổi:",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🕒 Thời gian nhận quiz",
                callback_data: "settings_quiz_time",
              },
            ],
            [{ text: "🔔 Thông báo", callback_data: "settings_notifications" }],
            [{ text: "🌐 Ngôn ngữ", callback_data: "settings_language" }],
            [{ text: "↩️ Quay lại", callback_data: "back_to_main" }],
          ],
        },
      }
    );
  });

  // Handle text messages (for adding new words)
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) {
      return; // Ignore commands and non-text messages
    }

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const userName = msg.from.first_name || "Người dùng";

    // Handle keyboard button presses
    if (msg.text === "📝 Thêm từ mới") {
      bot.sendMessage(
        chatId,
        'Hãy gửi từ vựng theo định dạng: "từ - nghĩa"\nVí dụ: "inflation - lạm phát"',
        MAIN_KEYBOARD
      );
      return;
    } else if (msg.text === "🎮 Quiz ngẫu nhiên") {
      await sendQuiz(chatId);
      return;
    } else if (msg.text === "🏷️ Quiz theo chủ đề") {
      // Hiển thị danh sách chủ đề
      bot.sendMessage(
        chatId,
        "📋 *Chọn chủ đề cho quiz*\n\nHãy chọn chủ đề bạn muốn làm quiz:",
        {
          parse_mode: "Markdown",
          ...TOPICS_KEYBOARD,
        }
      );
      return;
    } else if (msg.text === "📚 Ôn tập hôm nay") {
      // Trigger review command
      bot.emit("text", msg, ["/review"]);
      return;
    } else if (msg.text === "📊 Thống kê") {
      // Trigger stats command
      bot.emit("text", msg, ["/stats"]);
      return;
    } else if (msg.text === "⚙️ Cài đặt") {
      // Trigger settings command
      bot.emit("text", msg, ["/settings"]);
      return;
    } else if (msg.text === "❓ Trợ giúp") {
      // Trigger help command
      bot.emit("text", msg, ["/help"]);
      return;
    }

    // Process vocabulary input
    const parts = msg.text.split("-").map((part) => part.trim());
    if (parts.length !== 2) {
      // Trong nhóm, chỉ phản hồi khi tin nhắn có định dạng từ vựng
      if (isGroup && msg.text.includes("-")) {
        bot.sendMessage(
          chatId,
          'Định dạng không đúng. Vui lòng gửi theo định dạng: "từ - nghĩa"',
          MAIN_KEYBOARD
        );
      }
      return;
    }

    const word = parts[0];
    const meaning = parts[1];

    // Send typing action to indicate processing
    bot.sendChatAction(chatId, "typing");

    try {
      // Process with AI to get topic and example
      const aiResult = await aiService.processVocabulary(word, meaning);

      // Save to Notion
      const vocabulary = {
        word,
        meaning,
        topic: aiResult.topic,
        example: aiResult.example,
        created_at: new Date().toISOString(),
        added_by: isGroup ? userName : "User", // Thêm thông tin người thêm từ
      };

      await notionService.saveVocabulary(vocabulary);

      // Send confirmation with rich formatting
      const message = `
✅ *Đã lưu từ vựng mới* ${isGroup ? `(thêm bởi ${userName})` : ""}

📝 *Từ:* ${word}
🔤 *Nghĩa:* ${meaning}
🏷️ *Chủ đề:* ${aiResult.topic}
📋 *Ví dụ:* _${aiResult.example}_

_Từ này sẽ xuất hiện trong quiz hàng ngày._
      `;

      bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🎮 Quiz ngay", callback_data: "quiz_now" },
              { text: "📝 Thêm từ khác", callback_data: "add_another" },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Error processing vocabulary:", error);
      bot.sendMessage(
        chatId,
        "Có lỗi xảy ra khi xử lý từ vựng. Vui lòng thử lại sau.",
        MAIN_KEYBOARD
      );
    }
  });

  // Handle callback queries (button clicks)
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    // Acknowledge the callback query immediately
    bot.answerCallbackQuery(query.id);

    if (data === "quiz_now") {
      await sendQuiz(chatId);
    } else if (data.startsWith("topic_")) {
      // Xử lý khi người dùng chọn chủ đề
      const topic = data.replace("topic_", "");

      if (topic === "all") {
        // Nếu chọn tất cả chủ đề, gọi hàm sendQuiz thông thường
        await sendQuiz(chatId);
      } else {
        // Nếu chọn chủ đề cụ thể, gọi hàm sendTopicQuiz
        await sendTopicQuiz(chatId, topic);
      }
    } else if (data === "add_another") {
      bot.sendMessage(
        chatId,
        'Hãy gửi từ vựng tiếp theo theo định dạng: "từ - nghĩa"',
        MAIN_KEYBOARD
      );
    } else if (data === "back_to_main") {
      bot.sendMessage(
        chatId,
        "Quay lại menu chính. Bạn muốn làm gì tiếp theo?",
        MAIN_KEYBOARD
      );
    } else if (data.startsWith("quiz_answer_")) {
      // Xử lý câu trả lời quiz nhanh hơn
      const parts = data.split("_");
      const quizId = parts[2];
      const answerId = parseInt(parts[3]);
      const isCorrect = parts[4] === "correct";

      // Lưu thông tin quiz vào bộ nhớ tạm để truy xuất nhanh
      // Giả sử bạn có một Map lưu trữ thông tin quiz theo quizId
      const quizData = global.quizCache ? global.quizCache.get(quizId) : null;

      if (isCorrect) {
        // Cập nhật tiến độ học tập nếu trả lời đúng (quality = 5)
        try {
          if (quizData && quizData.vocabularyId) {
            // Thực hiện bất đồng bộ nhưng không chờ đợi
            studyService
              .saveStudyProgress(quizData.vocabularyId, 5)
              .catch((err) =>
                console.error("Error saving study progress:", err)
              );
          }
        } catch (error) {
          console.error("Error updating study progress:", error);
        }

        bot.sendMessage(chatId, "🎉 Chính xác! Bạn đã trả lời đúng.", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🎮 Quiz khác", callback_data: "quiz_now" }],
              [{ text: "↩️ Quay lại menu", callback_data: "back_to_main" }],
            ],
          },
        });
      } else {
        // Cập nhật tiến độ học tập nếu trả lời sai (quality = 2)
        try {
          if (quizData && quizData.vocabularyId) {
            // Thực hiện bất đồng bộ nhưng không chờ đợi
            studyService
              .saveStudyProgress(quizData.vocabularyId, 2)
              .catch((err) =>
                console.error("Error saving study progress:", err)
              );
          }
        } catch (error) {
          console.error("Error updating study progress:", error);
        }

        // Lấy đáp án đúng từ cache
        let correctAnswer = "Đáp án đúng"; // Mặc định
        if (quizData && quizData.correctAnswer) {
          correctAnswer = quizData.correctAnswer;
        }

        bot.sendMessage(
          chatId,
          `❌ Tiếc quá! Đáp án đúng là: *${correctAnswer}*`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎮 Thử lại", callback_data: "quiz_now" }],
                [{ text: "↩️ Quay lại menu", callback_data: "back_to_main" }],
              ],
            },
          }
        );
      }
    } else if (data.startsWith("settings_")) {
      // Xử lý các tùy chọn cài đặt
      const setting = data.split("_")[1];

      if (setting === "quiz_time") {
        bot.sendMessage(
          chatId,
          "🕒 *Thời gian nhận quiz hàng ngày*\n\nChọn thời gian bạn muốn nhận quiz:",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "6:00", callback_data: "set_quiz_time_6_0" },
                  { text: "8:00", callback_data: "set_quiz_time_8_0" },
                  { text: "12:00", callback_data: "set_quiz_time_12_0" },
                ],
                [
                  { text: "18:00", callback_data: "set_quiz_time_18_0" },
                  { text: "20:00", callback_data: "set_quiz_time_20_0" },
                  { text: "22:00", callback_data: "set_quiz_time_22_0" },
                ],
                [{ text: "↩️ Quay lại", callback_data: "back_to_settings" }],
              ],
            },
          }
        );
      } else if (setting === "notifications") {
        bot.sendMessage(
          chatId,
          "🔔 *Cài đặt thông báo*\n\nChọn loại thông báo bạn muốn nhận:",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Quiz hàng ngày ✅",
                    callback_data: "toggle_notif_quiz",
                  },
                ],
                [
                  {
                    text: "Nhắc nhở ôn tập ✅",
                    callback_data: "toggle_notif_review",
                  },
                ],
                [
                  {
                    text: "Thống kê hàng tuần ❌",
                    callback_data: "toggle_notif_stats",
                  },
                ],
                [{ text: "↩️ Quay lại", callback_data: "back_to_settings" }],
              ],
            },
          }
        );
      } else if (setting === "language") {
        bot.sendMessage(
          chatId,
          "🌐 *Cài đặt ngôn ngữ*\n\nChọn ngôn ngữ hiển thị:",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🇻🇳 Tiếng Việt", callback_data: "set_lang_vi" }],
                [{ text: "🇬🇧 Tiếng Anh", callback_data: "set_lang_en" }],
                [{ text: "↩️ Quay lại", callback_data: "back_to_settings" }],
              ],
            },
          }
        );
      }
    } else if (data === "back_to_settings") {
      // Trigger settings command
      bot.emit("text", { ...query.message, from: query.from }, ["/settings"]);
    } else if (data === "choose_topic") {
      bot.sendMessage(
        chatId,
        "📋 *Chọn chủ đề cho quiz*\n\nHãy chọn chủ đề bạn muốn làm quiz:",
        {
          parse_mode: "Markdown",
          ...TOPICS_KEYBOARD,
        }
      );
    }
  });

  // Handle /topics command
  bot.onText(/\/topics/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      // Tạo danh sách chủ đề với mô tả
      let topicMessage = "📚 *Danh sách chủ đề từ vựng* 📚\n\n";

      // Nhóm các chủ đề theo loại
      const dailyTopics = PREDEFINED_TOPICS.slice(0, 10);
      const academicTopics = PREDEFINED_TOPICS.slice(10, 20);
      const entertainmentTopics = PREDEFINED_TOPICS.slice(20, 28);
      const socialTopics = PREDEFINED_TOPICS.slice(28, 34);
      const otherTopics = PREDEFINED_TOPICS.slice(34);

      topicMessage += "*🏠 Giao tiếp hàng ngày:*\n";
      dailyTopics.forEach((topic) => {
        topicMessage += `• ${topic}\n`;
      });

      topicMessage += "\n*🏢 Học thuật & Công việc:*\n";
      academicTopics.forEach((topic) => {
        topicMessage += `• ${topic}\n`;
      });

      topicMessage += "\n*🎭 Giải trí:*\n";
      entertainmentTopics.forEach((topic) => {
        topicMessage += `• ${topic}\n`;
      });

      topicMessage += "\n*👥 Tình cảm & Xã hội:*\n";
      socialTopics.forEach((topic) => {
        topicMessage += `• ${topic}\n`;
      });

      topicMessage += "\n*🔠 Khác:*\n";
      otherTopics.forEach((topic) => {
        topicMessage += `• ${topic}\n`;
      });

      // Gửi thông báo với danh sách chủ đề
      bot.sendMessage(chatId, topicMessage, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎮 Quiz theo chủ đề",
                callback_data: "choose_topic",
              },
            ],
            [
              {
                text: "📊 Thống kê từ vựng theo chủ đề",
                callback_data: "topic_stats",
              },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Error displaying topics:", error);
      bot.sendMessage(
        chatId,
        "❌ Có lỗi xảy ra khi hiển thị danh sách chủ đề. Vui lòng thử lại sau.",
        MAIN_KEYBOARD
      );
    }
  });

  // Thêm xử lý cho callback_data "topic_stats"
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.callback_data;

    if (data === "topic_stats") {
      try {
        // Gửi thông báo đang tải
        const loadingMessage = await bot.sendMessage(
          chatId,
          "⏳ Đang tải thống kê từ vựng theo chủ đề...",
          { parse_mode: "Markdown" }
        );

        // Lấy thống kê từ vựng theo chủ đề từ Notion
        const topicStats = await notionService.getVocabularyStatsByTopic();

        if (topicStats && Object.keys(topicStats).length > 0) {
          // Sắp xếp chủ đề theo số lượng từ vựng (từ cao đến thấp)
          const sortedTopics = Object.entries(topicStats)
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => `${topic}: ${count} từ`);

          // Tạo thông báo thống kê
          const statsMessage = `
📊 *Thống kê từ vựng theo chủ đề*

${sortedTopics.join("\n")}

Tổng cộng: ${Object.values(topicStats).reduce((a, b) => a + b, 0)} từ vựng
          `;

          // Cập nhật thông báo với thống kê
          await bot.editMessageText(statsMessage, {
            chat_id: chatId,
            message_id: loadingMessage.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📋 Xem danh sách chủ đề",
                    callback_data: "view_topics",
                  },
                ],
                [
                  {
                    text: "🎮 Quiz ngẫu nhiên",
                    callback_data: "quiz_now",
                  },
                ],
              ],
            },
          });
        } else {
          await bot.editMessageText(
            "❌ Chưa có từ vựng nào được thêm vào. Hãy thêm từ vựng mới để xem thống kê.",
            {
              chat_id: chatId,
              message_id: loadingMessage.message_id,
            }
          );
        }
      } catch (error) {
        console.error("Error getting topic stats:", error);
        bot.sendMessage(
          chatId,
          "❌ Có lỗi xảy ra khi lấy thống kê. Vui lòng thử lại sau.",
          MAIN_KEYBOARD
        );
      }
    } else if (data === "view_topics") {
      // Gọi lại lệnh /topics
      bot.emit("text", { ...query.message, from: query.from, text: "/topics" });
    }
    // Xử lý các callback_data khác...
  });
}

/**
 * Send a vocabulary quiz to the specified chat
 * @param {number} chatId - Telegram chat ID or null to use the group chat ID
 */
async function sendQuiz(chatId = null, quizType = null, topic = null) {
  try {
    // Sử dụng GROUP_CHAT_ID từ biến môi trường nếu chatId không được cung cấp
    // hoặc sử dụng global.groupChatId nếu đã được lưu trước đó
    const targetChatId =
      chatId ||
      global.groupChatId ||
      process.env.GROUP_CHAT_ID ||
      global.userChatId;

    if (!targetChatId) {
      console.error("Không có chat ID nào được cung cấp hoặc lưu trữ trước đó");
      return;
    }

    // Gửi thông báo "đang tạo quiz" để người dùng biết đang xử lý
    const loadingMessage = await bot.sendMessage(
      targetChatId,
      "⏳ Đang tạo quiz...",
      { parse_mode: "Markdown" }
    );

    // Sử dụng quizService để tạo quiz
    const quizData = await quizService.createRandomQuiz(quizType, topic);

    if (quizData.error) {
      // Cập nhật thông báo thay vì gửi mới
      await bot.editMessageText(quizData.message, {
        chat_id: targetChatId,
        message_id: loadingMessage.message_id,
        parse_mode: "Markdown",
        ...MAIN_KEYBOARD,
      });
      return;
    }

    // Khởi tạo cache nếu chưa có
    if (!global.quizCache) {
      global.quizCache = new Map();
    }

    // Lưu thông tin quiz vào cache
    global.quizCache.set(quizData.id, {
      vocabularyId: quizData.vocabularyId,
      correctAnswer: quizData.correctAnswer,
      options: quizData.options,
      type: quizData.type,
      timestamp: quizData.timestamp,
    });

    // Tự động xóa cache sau 5 phút
    setTimeout(() => {
      if (global.quizCache && global.quizCache.has(quizData.id)) {
        global.quizCache.delete(quizData.id);
      }
    }, 5 * 60 * 1000);

    // Tạo bàn phím inline dựa trên các lựa chọn
    const keyboard = quizData.options.map((option, index) => {
      const isCorrect = option === quizData.correctAnswer;
      return [
        {
          text: `${index + 1}`,
          callback_data: `quiz_answer_${quizData.id}_${index}_${
            isCorrect ? "correct" : "wrong"
          }`,
        },
      ];
    });

    // Tạo nội dung tin nhắn quiz
    const quizMessage = `
📝 *Quiz từ vựng${topic ? ` - Chủ đề: ${topic}` : ""}*

${quizData.question}

${quizData.options.map((option, index) => `${index + 1}. ${option}`).join("\n")}
    `;

    // Cập nhật thông báo "đang tạo quiz" thành quiz thực tế
    await bot.editMessageText(quizMessage, {
      chat_id: targetChatId,
      message_id: loadingMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    if (chatId) {
      bot.sendMessage(
        chatId,
        "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau.",
        MAIN_KEYBOARD
      );
    }
  }
}

/**
 * Send a topic-specific vocabulary quiz to the specified chat
 * @param {number} chatId - Telegram chat ID
 * @param {string} topic - Topic to filter vocabulary by
 */
async function sendTopicQuiz(chatId, topic) {
  try {
    // Gọi hàm sendQuiz với tham số topic
    await sendQuiz(chatId, null, topic);
  } catch (error) {
    console.error(`Error sending topic quiz for ${topic}:`, error);
    bot.sendMessage(
      chatId,
      `Có lỗi xảy ra khi tạo quiz cho chủ đề ${topic}. Vui lòng thử lại sau.`,
      MAIN_KEYBOARD
    );
  }
}

/**
 * Stop the Telegram bot
 */
function stop() {
  if (bot) {
    bot.stopPolling();
    console.log("Telegram bot stopped");
  }
}

/**
 * Get the bot instance
 * @returns {TelegramBot} The bot instance
 */
function getBot() {
  return bot;
}

module.exports = {
  start,
  stop,
  getBot,
  sendQuiz,
};
