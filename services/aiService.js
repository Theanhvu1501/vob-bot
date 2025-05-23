const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PREDEFINED_TOPICS } = require("../utils/constants");

// Thêm node-fetch để cung cấp fetch API cho Node.js
const fetch = require("node-fetch");

// Gán fetch vào global để thư viện generative-ai có thể sử dụng
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Initialize the Google Generative AI with API key
console.log(
  `[debug - process.env.GEMINI_API_KEY]: `,
  process.env.GEMINI_API_KEY
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Phân loại từ vựng và tạo ví dụ sử dụng AI
 * @param {string} word - Từ vựng
 * @param {string} meaning - Nghĩa của từ
 * @returns {Promise<{topic: string, example: string}>} - Chủ đề và ví dụ
 */
async function processVocabulary(word, meaning) {
  try {
    // Tạo prompt cho AI với danh sách chủ đề đã định nghĩa
    const prompt = `
    Analyze the following English vocabulary word and its Vietnamese meaning:
    
    Word: "${word}"
    Meaning: "${meaning}"
    
    Please classify this word into ONE of the following predefined topics:
    ${PREDEFINED_TOPICS.join(", ")}
    
    Also create a short example sentence using this word in the correct context.
    
    Format your response as JSON:
    {
      "topic": "ONE topic from the list above that best fits this word",
      "example": "A short example sentence using the word"
    }
    `;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse kết quả JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonResult = JSON.parse(jsonMatch[0]);

        // Kiểm tra xem chủ đề có trong danh sách đã định nghĩa không
        const topic = jsonResult.topic || "General";
        const validTopic = PREDEFINED_TOPICS.includes(topic)
          ? topic
          : "General";

        return {
          topic: validTopic,
          example: jsonResult.example || `Example of ${word}: ${meaning}`,
        };
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
    }

    // Fallback nếu không parse được JSON
    return {
      topic: "General",
      example: `Example of ${word}: ${meaning}`,
    };
  } catch (error) {
    console.error("Error processing vocabulary with AI:", error);

    // Fallback response if AI fails
    return {
      topic: "General",
      example: `This is an example sentence using the word "${word}".`,
    };
  }
}

// Hàm liệt kê các model có sẵn (hữu ích để debug)
async function listAvailableModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:", models);
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    return [];
  }
}

module.exports = {
  processVocabulary,
  listAvailableModels,
};
