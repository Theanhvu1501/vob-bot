const { GoogleGenerativeAI } = require("@google/generative-ai");
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
 * Process vocabulary with AI to get topic and example
 * @param {string} word - English vocabulary word
 * @param {string} meaning - Vietnamese meaning
 * @returns {Promise<Object>} - Object containing topic and example
 */
async function processVocabulary(word, meaning) {
  try {
    // Create a prompt for the AI
    const prompt = `
    Analyze the following English vocabulary word and its Vietnamese meaning:
    
    Word: ${word}
    Meaning: ${meaning}
    
    Please provide:
    1. A category/topic this word belongs to (e.g., Economics, Travel, Health, Education, Technology, etc.)
    2. An example sentence using this word in the correct context
    
    Format your response as JSON:
    {
      "topic": "category name",
      "example": "example sentence"
    }
    `;

    // Get the generative model - use the full model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    // Find JSON in the response (in case AI adds extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response does not contain valid JSON");
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);

    return {
      topic: jsonResponse.topic,
      example: jsonResponse.example,
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
