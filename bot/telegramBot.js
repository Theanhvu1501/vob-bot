const TelegramBot = require("node-telegram-bot-api");
const aiService = require("../services/aiService");
const notionService = require("../services/notionService");
const helpers = require("../utils/helpers");
const userService = require("../services/userService");
const studyService = require("../services/studyService");

// Initialize the bot with the token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;

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

const TOPICS_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [
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

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    // Lưu chatId vào biến toàn cục để sử dụng trong quizScheduler
    global.userChatId = chatId;

    bot.sendMessage(
      chatId,
      "👋 Chào mừng bạn đến với Bot học từ vựng!\n\n" +
        'Gửi từ vựng theo định dạng: "từ - nghĩa"\n' +
        'Ví dụ: "inflation - lạm phát"\n\n' +
        "Bot sẽ tự động phân loại và tạo câu ví dụ cho bạn.",
      MAIN_KEYBOARD
    );
  });

  // Thêm lệnh /id để lấy chat ID bất cứ lúc nào
  bot.onText(/\/id/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `🆔 Chat ID của bạn là: ${chatId}\n` +
        "Hãy sao chép ID này và thêm vào file .env với biến USER_CHAT_ID",
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
      bot.sendMessage(
        chatId,
        'Định dạng không đúng. Vui lòng gửi theo định dạng: "từ - nghĩa"',
        MAIN_KEYBOARD
      );
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
      };

      await notionService.saveVocabulary(vocabulary);

      // Send confirmation with rich formatting
      const message = `
✅ *Đã lưu từ vựng mới*

📝 *Từ:* ${word}
🔤 *Nghĩa:* ${meaning}
🏷️ *Chủ đề:* ${aiResult.topic}
📋 *Ví dụ:* _${aiResult.example}_

_Từ này sẽ xuất hiện trong quiz hàng ngày của bạn._
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
}

/**
 * Send a vocabulary quiz to the specified chat
 * @param {number} chatId - Telegram chat ID
 */
async function sendQuiz(chatId) {
  try {
    // Gửi thông báo "đang tạo quiz" để người dùng biết đang xử lý
    const loadingMessage = await bot.sendMessage(
      chatId,
      "⏳ Đang tạo quiz...",
      { parse_mode: "Markdown" }
    );

    // Get a random vocabulary
    const vocabulary = await notionService.getRandomVocabulary();

    if (!vocabulary) {
      // Cập nhật thông báo thay vì gửi mới
      await bot.editMessageText(
        "Không tìm thấy từ vựng nào. Hãy thêm một số từ trước khi làm quiz.",
        {
          chat_id: chatId,
          message_id: loadingMessage.message_id,
          parse_mode: "Markdown",
          ...MAIN_KEYBOARD,
        }
      );
      return;
    }

    // Khởi tạo cache nếu chưa có
    if (!global.quizCache) {
      global.quizCache = new Map();
    }

    // Tạo ID duy nhất cho quiz này
    const quizId = Date.now().toString();

    // Determine quiz type (50% chance for each type)
    const isWordToMeaning = Math.random() < 0.5;

    if (isWordToMeaning) {
      // Word to meaning quiz
      const wrongMeanings = await notionService.getRandomMeanings(
        3,
        vocabulary.meaning
      );

      // Combine and shuffle options
      const options = [vocabulary.meaning, ...wrongMeanings];
      const shuffledOptions = helpers.shuffleArray(options);

      // Lưu thông tin quiz vào cache
      global.quizCache.set(quizId, {
        vocabularyId: vocabulary.id,
        correctAnswer: vocabulary.meaning,
        options: shuffledOptions,
        type: "word_to_meaning",
        timestamp: Date.now(),
      });

      // Tự động xóa cache sau 5 phút
      setTimeout(() => {
        if (global.quizCache && global.quizCache.has(quizId)) {
          global.quizCache.delete(quizId);
        }
      }, 5 * 60 * 1000);

      // Create quiz message
      const quizMessage = `
📝 *Quiz từ vựng*

Đâu là nghĩa của từ: *${vocabulary.word}*?

${shuffledOptions.map((option, index) => `${index + 1}. ${option}`).join("\n")}
      `;

      // Create inline keyboard with options
      const keyboard = shuffledOptions.map((option, index) => {
        const isCorrect = option === vocabulary.meaning;
        return [
          {
            text: `${index + 1}`,
            callback_data: `quiz_answer_${quizId}_${index}_${
              isCorrect ? "correct" : "wrong"
            }`,
          },
        ];
      });

      // Cập nhật thông báo "đang tạo quiz" thành quiz thực tế
      await bot.editMessageText(quizMessage, {
        chat_id: chatId,
        message_id: loadingMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else {
      // Meaning to word quiz
      const wrongWords = await notionService.getRandomWords(3, vocabulary.word);

      // Combine and shuffle options
      const options = [vocabulary.word, ...wrongWords];
      const shuffledOptions = helpers.shuffleArray(options);

      // Lưu thông tin quiz vào cache
      global.quizCache.set(quizId, {
        vocabularyId: vocabulary.id,
        correctAnswer: vocabulary.word,
        options: shuffledOptions,
        type: "meaning_to_word",
        timestamp: Date.now(),
      });

      // Tự động xóa cache sau 5 phút
      setTimeout(() => {
        if (global.quizCache && global.quizCache.has(quizId)) {
          global.quizCache.delete(quizId);
        }
      }, 5 * 60 * 1000);

      // Create quiz message
      const quizMessage = `
📝 *Quiz từ vựng*

Từ nào có nghĩa là: *${vocabulary.meaning}*?

${shuffledOptions.map((option, index) => `${index + 1}. ${option}`).join("\n")}
      `;

      // Create inline keyboard with options
      const keyboard = shuffledOptions.map((option, index) => {
        const isCorrect = option === vocabulary.word;
        return [
          {
            text: `${index + 1}`,
            callback_data: `quiz_answer_${quizId}_${index}_${
              isCorrect ? "correct" : "wrong"
            }`,
          },
        ];
      });

      // Cập nhật thông báo "đang tạo quiz" thành quiz thực tế
      await bot.editMessageText(quizMessage, {
        chat_id: chatId,
        message_id: loadingMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  } catch (error) {
    console.error("Error creating quiz:", error);
    bot.sendMessage(
      chatId,
      "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau.",
      MAIN_KEYBOARD
    );
  }
}

/**
 * Send a topic-specific vocabulary quiz to the specified chat
 * @param {number} chatId - Telegram chat ID
 * @param {string} topic - Topic to filter vocabulary by
 */
async function sendTopicQuiz(chatId, topic) {
  try {
    // Gửi thông báo "đang tạo quiz" để người dùng biết đang xử lý
    const loadingMessage = await bot.sendMessage(
      chatId,
      `⏳ Đang tạo quiz chủ đề *${topic}*...`,
      { parse_mode: "Markdown" }
    );

    // Get a random vocabulary from the specified topic
    const vocabulary = await notionService.getRandomVocabularyByTopic(topic);

    if (!vocabulary) {
      // Cập nhật thông báo thay vì gửi mới
      await bot.editMessageText(
        `Không tìm thấy từ vựng nào thuộc chủ đề *${topic}*. Hãy thử chủ đề khác hoặc thêm từ vựng mới.`,
        {
          chat_id: chatId,
          message_id: loadingMessage.message_id,
          parse_mode: "Markdown",
          reply_markup: TOPICS_KEYBOARD.reply_markup,
        }
      );
      return;
    }

    // Khởi tạo cache nếu chưa có
    if (!global.quizCache) {
      global.quizCache = new Map();
    }

    // Tạo ID duy nhất cho quiz này
    const quizId = Date.now().toString();

    // Determine quiz type (50% chance for each type)
    const isWordToMeaning = Math.random() < 0.5;

    // Tạo quiz dựa trên loại
    if (isWordToMeaning) {
      // Lấy các nghĩa sai từ cùng chủ đề
      const wrongMeanings = await notionService.getRandomMeaningsByTopic(
        3,
        vocabulary.meaning,
        topic
      );

      // Combine and shuffle options
      const options = [vocabulary.meaning, ...wrongMeanings];
      const shuffledOptions = helpers.shuffleArray(options);

      // Lưu thông tin quiz vào cache
      global.quizCache.set(quizId, {
        vocabularyId: vocabulary.id,
        correctAnswer: vocabulary.meaning,
        options: shuffledOptions,
        type: "word_to_meaning",
        topic: topic,
        timestamp: Date.now(),
      });

      // Tự động xóa cache sau 5 phút
      setTimeout(() => {
        if (global.quizCache && global.quizCache.has(quizId)) {
          global.quizCache.delete(quizId);
        }
      }, 5 * 60 * 1000);

      // Create quiz message
      const quizMessage = `
📝 *Quiz từ vựng - Chủ đề: ${topic}*

Đâu là nghĩa của từ: *${vocabulary.word}*?

${shuffledOptions.map((option, index) => `${index + 1}. ${option}`).join("\n")}
      `;

      // Create inline keyboard with options
      const keyboard = shuffledOptions.map((option, index) => {
        const isCorrect = option === vocabulary.meaning;
        return [
          {
            text: `${index + 1}`,
            callback_data: `quiz_answer_${quizId}_${index}_${
              isCorrect ? "correct" : "wrong"
            }`,
          },
        ];
      });

      // Thêm nút để tiếp tục quiz cùng chủ đề hoặc quay lại
      keyboard.push([
        {
          text: `🔄 Quiz tiếp (${topic})`,
          callback_data: `topic_${topic}`,
        },
        {
          text: "📋 Chọn chủ đề khác",
          callback_data: "choose_topic",
        },
      ]);

      // Cập nhật thông báo "đang tạo quiz" thành quiz thực tế
      await bot.editMessageText(quizMessage, {
        chat_id: chatId,
        message_id: loadingMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else {
      // Meaning to word quiz
      const wrongWords = await notionService.getRandomWordsByTopic(
        3,
        vocabulary.word,
        topic
      );

      // Combine and shuffle options
      const options = [vocabulary.word, ...wrongWords];
      const shuffledOptions = helpers.shuffleArray(options);

      // Lưu thông tin quiz vào cache
      global.quizCache.set(quizId, {
        vocabularyId: vocabulary.id,
        correctAnswer: vocabulary.word,
        options: shuffledOptions,
        type: "meaning_to_word",
        topic: topic,
        timestamp: Date.now(),
      });

      // Tự động xóa cache sau 5 phút
      setTimeout(() => {
        if (global.quizCache && global.quizCache.has(quizId)) {
          global.quizCache.delete(quizId);
        }
      }, 5 * 60 * 1000);

      // Create quiz message
      const quizMessage = `
📝 *Quiz từ vựng - Chủ đề: ${topic}*

Từ nào có nghĩa là: *${vocabulary.meaning}*?

${shuffledOptions.map((option, index) => `${index + 1}. ${option}`).join("\n")}
      `;

      // Create inline keyboard with options
      const keyboard = shuffledOptions.map((option, index) => {
        const isCorrect = option === vocabulary.word;
        return [
          {
            text: `${index + 1}`,
            callback_data: `quiz_answer_${quizId}_${index}_${
              isCorrect ? "correct" : "wrong"
            }`,
          },
        ];
      });

      // Thêm nút để tiếp tục quiz cùng chủ đề hoặc quay lại
      keyboard.push([
        {
          text: `🔄 Quiz tiếp (${topic})`,
          callback_data: `topic_${topic}`,
        },
        {
          text: "📋 Chọn chủ đề khác",
          callback_data: "choose_topic",
        },
      ]);

      // Cập nhật thông báo "đang tạo quiz" thành quiz thực tế
      await bot.editMessageText(quizMessage, {
        chat_id: chatId,
        message_id: loadingMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  } catch (error) {
    console.error(`Error creating topic quiz for ${topic}:`, error);
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
