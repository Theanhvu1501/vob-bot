const notionService = require('./notionService');
const helpers = require('../utils/helpers');

/**
 * Các loại quiz có sẵn
 */
const QUIZ_TYPES = {
  WORD_TO_MEANING: 'word_to_meaning',       // Từ -> Nghĩa
  MEANING_TO_WORD: 'meaning_to_word',       // Nghĩa -> Từ
  FILL_IN_BLANK: 'fill_in_blank',           // Điền từ vào chỗ trống
  MULTIPLE_CHOICE_EXAMPLE: 'mc_example',    // Chọn ví dụ đúng
  TRUE_FALSE: 'true_false'                  // Đúng/Sai
};

/**
 * Tạo quiz từ vựng ngẫu nhiên
 * @param {string} quizType - Loại quiz (nếu không chỉ định, sẽ chọn ngẫu nhiên)
 * @param {string} topic - Chủ đề (nếu không chỉ định, sẽ chọn ngẫu nhiên)
 * @returns {Promise<Object>} - Thông tin quiz
 */
async function createRandomQuiz(quizType = null, topic = null) {
  try {
    // Nếu không chỉ định loại quiz, chọn ngẫu nhiên
    if (!quizType) {
      const quizTypes = Object.values(QUIZ_TYPES);
      quizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];
    }

    // Lấy từ vựng ngẫu nhiên (theo chủ đề nếu có)
    let vocabulary;
    if (topic) {
      vocabulary = await notionService.getRandomVocabularyByTopic(topic);
    } else {
      vocabulary = await notionService.getRandomVocabulary();
    }

    if (!vocabulary) {
      return {
        error: true,
        message: topic 
          ? `Không tìm thấy từ vựng nào thuộc chủ đề ${topic}` 
          : "Không tìm thấy từ vựng nào"
      };
    }

    // Tạo quiz dựa trên loại đã chọn
    switch (quizType) {
      case QUIZ_TYPES.WORD_TO_MEANING:
        return await createWordToMeaningQuiz(vocabulary, topic);
      
      case QUIZ_TYPES.MEANING_TO_WORD:
        return await createMeaningToWordQuiz(vocabulary, topic);
      
      case QUIZ_TYPES.FILL_IN_BLANK:
        return await createFillInBlankQuiz(vocabulary, topic);
      
      case QUIZ_TYPES.MULTIPLE_CHOICE_EXAMPLE:
        return await createMultipleChoiceExampleQuiz(vocabulary, topic);
      
      case QUIZ_TYPES.TRUE_FALSE:
        return await createTrueFalseQuiz(vocabulary, topic);
      
      default:
        // Mặc định là Word to Meaning
        return await createWordToMeaningQuiz(vocabulary, topic);
    }
  } catch (error) {
    console.error("Error creating random quiz:", error);
    return {
      error: true,
      message: "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau."
    };
  }
}

/**
 * Tạo quiz từ -> nghĩa
 * @param {Object} vocabulary - Từ vựng
 * @param {string} topic - Chủ đề (nếu có)
 * @returns {Promise<Object>} - Thông tin quiz
 */
async function createWordToMeaningQuiz(vocabulary, topic = null) {
  try {
    // Lấy các nghĩa sai
    let wrongMeanings;
    if (topic) {
      wrongMeanings = await notionService.getRandomMeaningsByTopic(3, vocabulary.meaning, topic);
    } else {
      wrongMeanings = await notionService.getRandomMeanings(3, vocabulary.meaning);
    }

    // Kết hợp và xáo trộn các lựa chọn
    const options = [vocabulary.meaning, ...wrongMeanings];
    const shuffledOptions = helpers.shuffleArray(options);

    // Tạo ID duy nhất cho quiz
    const quizId = Date.now().toString();

    // Tạo thông tin quiz
    return {
      id: quizId,
      type: QUIZ_TYPES.WORD_TO_MEANING,
      vocabularyId: vocabulary.id,
      word: vocabulary.word,
      correctAnswer: vocabulary.meaning,
      options: shuffledOptions,
      topic: topic || vocabulary.topic,
      question: `Đâu là nghĩa của từ: *${vocabulary.word}*?`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error creating word to meaning quiz:", error);
    return {
      error: true,
      message: "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau."
    };
  }
}

/**
 * Tạo quiz nghĩa -> từ
 * @param {Object} vocabulary - Từ vựng
 * @param {string} topic - Chủ đề (nếu có)
 * @returns {Promise<Object>} - Thông tin quiz
 */
async function createMeaningToWordQuiz(vocabulary, topic = null) {
  try {
    // Lấy các từ sai
    let wrongWords;
    if (topic) {
      wrongWords = await notionService.getRandomWordsByTopic(3, vocabulary.word, topic);
    } else {
      wrongWords = await notionService.getRandomWords(3, vocabulary.word);
    }

    // Kết hợp và xáo trộn các lựa chọn
    const options = [vocabulary.word, ...wrongWords];
    const shuffledOptions = helpers.shuffleArray(options);

    // Tạo ID duy nhất cho quiz
    const quizId = Date.now().toString();

    // Tạo thông tin quiz
    return {
      id: quizId,
      type: QUIZ_TYPES.MEANING_TO_WORD,
      vocabularyId: vocabulary.id,
      meaning: vocabulary.meaning,
      correctAnswer: vocabulary.word,
      options: shuffledOptions,
      topic: topic || vocabulary.topic,
      question: `Từ nào có nghĩa là: *${vocabulary.meaning}*?`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error creating meaning to word quiz:", error);
    return {
      error: true,
      message: "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau."
    };
  }
}

/**
 * Tạo quiz điền từ vào chỗ trống
 * @param {Object} vocabulary - Từ vựng
 * @param {string} topic - Chủ đề (nếu có)
 * @returns {Promise<Object>} - Thông tin quiz
 */
async function createFillInBlankQuiz(vocabulary, topic = null) {
  try {
    // Lấy ví dụ từ từ vựng
    let example = vocabulary.example;
    
    // Nếu không có ví dụ, tạo một ví dụ đơn giản
    if (!example || example.trim() === '') {
      example = `This is an example sentence using the word "${vocabulary.word}".`;
    }
    
    // Thay thế từ vựng bằng dấu gạch ngang
    const blankExample = example.replace(
      new RegExp(`\\b${vocabulary.word}\\b`, 'gi'), 
      '________'
    );
    
    // Lấy các từ sai
    let wrongWords;
    if (topic) {
      wrongWords = await notionService.getRandomWordsByTopic(3, vocabulary.word, topic);
    } else {
      wrongWords = await notionService.getRandomWords(3, vocabulary.word);
    }
    
    // Kết hợp và xáo trộn các lựa chọn
    const options = [vocabulary.word, ...wrongWords];
    const shuffledOptions = helpers.shuffleArray(options);
    
    // Tạo ID duy nhất cho quiz
    const quizId = Date.now().toString();
    
    // Tạo thông tin quiz
    return {
      id: quizId,
      type: QUIZ_TYPES.FILL_IN_BLANK,
      vocabularyId: vocabulary.id,
      example: example,
      blankExample: blankExample,
      correctAnswer: vocabulary.word,
      options: shuffledOptions,
      topic: topic || vocabulary.topic,
      question: `Chọn từ thích hợp điền vào chỗ trống:\n\n*${blankExample}*`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error creating fill in blank quiz:", error);
    return {
      error: true,
      message: "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau."
    };
  }
}

/**
 * Tạo quiz chọn ví dụ đúng
 * @param {Object} vocabulary - Từ vựng
 * @param {string} topic - Chủ đề (nếu có)
 * @returns {Promise<Object>} - Thông tin quiz
 */
async function createMultipleChoiceExampleQuiz(vocabulary, topic = null) {
  try {
    // Lấy ví dụ đúng từ từ vựng
    let correctExample = vocabulary.example;
    
    // Nếu không có ví dụ, tạo một ví dụ đơn giản
    if (!correctExample || correctExample.trim() === '') {
      correctExample = `This is an example sentence using the word "${vocabulary.word}" correctly.`;
    }
    
    // Tạo 3 ví dụ sai
    const wrongExamples = [
      `This sentence uses "${vocabulary.word}" incorrectly in context.`,
      `Here is another example where "${vocabulary.word}" is used with the wrong meaning.`,
      `This is not how you would use the word "${vocabulary.word}" in a sentence.`
    ];
    
    // Kết hợp và xáo trộn các lựa chọn
    const options = [correctExample, ...wrongExamples];
    const shuffledOptions = helpers.shuffleArray(options);
    
    // Tạo ID duy nhất cho quiz
    const quizId = Date.now().toString();
    
    // Tạo thông tin quiz
    return {
      id: quizId,
      type: QUIZ_TYPES.MULTIPLE_CHOICE_EXAMPLE,
      vocabularyId: vocabulary.id,
      word: vocabulary.word,
      meaning: vocabulary.meaning,
      correctAnswer: correctExample,
      options: shuffledOptions,
      topic: topic || vocabulary.topic,
      question: `Chọn câu sử dụng từ "*${vocabulary.word}*" (*${vocabulary.meaning}*) đúng nhất:`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error creating multiple choice example quiz:", error);
    return {
      error: true,
      message: "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau."
    };
  }
}

/**
 * Tạo quiz đúng/sai
 * @param {Object} vocabulary - Từ vựng
 * @param {string} topic - Chủ đề (nếu có)
 * @returns {Promise<Object>} - Thông tin quiz
 */
async function createTrueFalseQuiz(vocabulary, topic = null) {
  try {
    // Quyết định ngẫu nhiên xem câu hỏi là đúng hay sai
    const isTrue = Math.random() < 0.5;
    
    let question, correctAnswer;
    
    if (isTrue) {
      // Tạo câu hỏi đúng
      question = `Từ "*${vocabulary.word}*" có nghĩa là "*${vocabulary.meaning}*". Đúng hay sai?`;
      correctAnswer = "Đúng";
    } else {
      // Lấy một nghĩa sai
      let wrongMeanings;
      if (topic) {
        wrongMeanings = await notionService.getRandomMeaningsByTopic(1, vocabulary.meaning, topic);
      } else {
        wrongMeanings = await notionService.getRandomMeanings(1, vocabulary.meaning);
      }
      
      // Tạo câu hỏi sai
      question = `Từ "*${vocabulary.word}*" có nghĩa là "*${wrongMeanings[0]}*". Đúng hay sai?`;
      correctAnswer = "Sai";
    }
    
    // Tạo ID duy nhất cho quiz
    const quizId = Date.now().toString();
    
    // Tạo thông tin quiz
    return {
      id: quizId,
      type: QUIZ_TYPES.TRUE_FALSE,
      vocabularyId: vocabulary.id,
      word: vocabulary.word,
      meaning: vocabulary.meaning,
      correctAnswer: correctAnswer,
      options: ["Đúng", "Sai"],
      topic: topic || vocabulary.topic,
      question: question,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error creating true/false quiz:", error);
    return {
      error: true,
      message: "Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại sau."
    };
  }
}

module.exports = {
  QUIZ_TYPES,
  createRandomQuiz,
  createWordToMeaningQuiz,
  createMeaningToWordQuiz,
  createFillInBlankQuiz,
  createMultipleChoiceExampleQuiz,
  createTrueFalseQuiz
};