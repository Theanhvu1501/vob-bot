const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * Save vocabulary to Notion database
 * @param {Object} vocabulary - Vocabulary object with word, meaning, topic, example
 * @returns {Promise<Object>} - Saved vocabulary entry
 */
async function saveVocabulary(vocabulary) {
  try {
    // Create a new page in the database
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        // Assuming 'word' is a rich_text property in your database
        word: {
          rich_text: [
            {
              text: {
                content: vocabulary.word,
              },
            },
          ],
        },
        // Assuming 'meaning' is a rich_text property
        meaning: {
          rich_text: [
            {
              text: {
                content: vocabulary.meaning,
              },
            },
          ],
        },
        // Assuming 'topic' is a select property
        topic: {
          select: {
            name: vocabulary.topic,
          },
        },
        // Assuming 'example' is a rich_text property
        example: {
          rich_text: [
            {
              text: {
                content: vocabulary.example,
              },
            },
          ],
        },
        // Assuming 'created_at' is a date property
        created_at: {
          date: {
            start: vocabulary.created_at,
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error saving vocabulary to Notion:", error);
    throw error;
  }
}

/**
 * Get random vocabulary from Notion database
 * @returns {Promise<Object|null>} - Random vocabulary or null if none found
 */
async function getRandomVocabulary() {
  try {
    // Query the database to get all entries
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    if (response.results.length === 0) {
      return null;
    }

    // Select a random entry
    const randomIndex = Math.floor(Math.random() * response.results.length);
    const randomEntry = response.results[randomIndex];

    // Extract properties
    return {
      word: extractRichTextContent(randomEntry.properties.word.rich_text),
      meaning: extractRichTextContent(randomEntry.properties.meaning.rich_text),
      topic: randomEntry.properties.topic.select?.name || "General",
      example: extractRichTextContent(randomEntry.properties.example.rich_text),
    };
  } catch (error) {
    console.error("Error getting random vocabulary from Notion:", error);
    return null;
  }
}

/**
 * Get random meanings for quiz options
 * @param {number} count - Number of random meanings to get
 * @param {string} excludeMeaning - Meaning to exclude from results
 * @returns {Promise<string[]>} - Array of random meanings
 */
async function getRandomMeanings(count, excludeMeaning) {
  try {
    // Query the database to get all entries
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    if (response.results.length < count + 1) {
      // Not enough entries, return dummy meanings
      return Array(count)
        .fill(0)
        .map((_, i) => `Dummy meaning ${i + 1}`);
    }

    // Filter out the excluded meaning and extract all meanings
    const meanings = response.results
      .map((entry) =>
        extractRichTextContent(entry.properties.meaning.rich_text)
      )
      .filter((meaning) => meaning !== excludeMeaning);

    // Shuffle and take the first 'count' meanings
    return shuffleArray(meanings).slice(0, count);
  } catch (error) {
    console.error("Error getting random meanings from Notion:", error);
    return Array(count)
      .fill(0)
      .map((_, i) => `Dummy meaning ${i + 1}`);
  }
}

/**
 * Get random words for quiz options
 * @param {number} count - Number of random words to get
 * @param {string} excludeWord - Word to exclude from results
 * @returns {Promise<string[]>} - Array of random words
 */
async function getRandomWords(count, excludeWord) {
  try {
    // Query the database to get all entries
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    if (response.results.length < count + 1) {
      // Not enough entries, return dummy words
      return Array(count)
        .fill(0)
        .map((_, i) => `dummy${i + 1}`);
    }

    // Filter out the excluded word and extract all words
    const words = response.results
      .map((entry) => extractRichTextContent(entry.properties.word.rich_text))
      .filter((word) => word !== excludeWord);

    // Shuffle and take the first 'count' words
    return shuffleArray(words).slice(0, count);
  } catch (error) {
    console.error("Error getting random words from Notion:", error);
    return Array(count)
      .fill(0)
      .map((_, i) => `dummy${i + 1}`);
  }
}

/**
 * Get random vocabulary from Notion database by topic
 * @param {string} topic - Topic to filter by
 * @returns {Promise<Object|null>} - Random vocabulary or null if none found
 */
async function getRandomVocabularyByTopic(topic) {
  try {
    // Query the database to get entries filtered by topic
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "topic",
        select: {
          equals: topic,
        },
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    // Select a random entry
    const randomIndex = Math.floor(Math.random() * response.results.length);
    const randomEntry = response.results[randomIndex];

    // Extract properties
    return {
      id: randomEntry.id,
      word: extractRichTextContent(randomEntry.properties.word.rich_text),
      meaning: extractRichTextContent(randomEntry.properties.meaning.rich_text),
      topic: randomEntry.properties.topic.select?.name || "General",
      example: extractRichTextContent(randomEntry.properties.example.rich_text),
    };
  } catch (error) {
    console.error(
      `Error getting random vocabulary by topic ${topic} from Notion:`,
      error
    );
    return null;
  }
}

/**
 * Get random meanings for quiz options filtered by topic
 * @param {number} count - Number of random meanings to get
 * @param {string} excludeMeaning - Meaning to exclude from results
 * @param {string} topic - Topic to filter by
 * @returns {Promise<string[]>} - Array of random meanings
 */
async function getRandomMeaningsByTopic(count, excludeMeaning, topic) {
  try {
    // Query the database to get entries filtered by topic
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "topic",
        select: {
          equals: topic,
        },
      },
    });

    if (response.results.length < count + 1) {
      // Not enough entries with this topic, fall back to all meanings
      return await getRandomMeanings(count, excludeMeaning);
    }

    // Filter out the excluded meaning and extract all meanings
    const meanings = response.results
      .map((entry) =>
        extractRichTextContent(entry.properties.meaning.rich_text)
      )
      .filter((meaning) => meaning !== excludeMeaning);

    // Shuffle and take the first 'count' meanings
    return shuffleArray(meanings).slice(0, count);
  } catch (error) {
    console.error(
      `Error getting random meanings by topic ${topic} from Notion:`,
      error
    );
    // Fall back to regular random meanings
    return await getRandomMeanings(count, excludeMeaning);
  }
}

/**
 * Get random words for quiz options filtered by topic
 * @param {number} count - Number of random words to get
 * @param {string} excludeWord - Word to exclude from results
 * @param {string} topic - Topic to filter by
 * @returns {Promise<string[]>} - Array of random words
 */
async function getRandomWordsByTopic(count, excludeWord, topic) {
  try {
    // Query the database to get entries filtered by topic
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "topic",
        select: {
          equals: topic,
        },
      },
    });

    if (response.results.length < count + 1) {
      // Not enough entries with this topic, fall back to all words
      return await getRandomWords(count, excludeWord);
    }

    // Filter out the excluded word and extract all words
    const words = response.results
      .map((entry) => extractRichTextContent(entry.properties.word.rich_text))
      .filter((word) => word !== excludeWord);

    // Shuffle and take the first 'count' words
    return shuffleArray(words).slice(0, count);
  } catch (error) {
    console.error(
      `Error getting random words by topic ${topic} from Notion:`,
      error
    );
    // Fall back to regular random words
    return await getRandomWords(count, excludeWord);
  }
}

/**
 * Get all available topics from the vocabulary database
 * @returns {Promise<string[]>} - Array of topic names
 */
async function getAllTopics() {
  try {
    // Query the database to get all entries
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    // Extract unique topics
    const topics = new Set();
    response.results.forEach((entry) => {
      const topic = entry.properties.topic.select?.name;
      if (topic) {
        topics.add(topic);
      }
    });

    return Array.from(topics);
  } catch (error) {
    console.error("Error getting all topics from Notion:", error);
    return ["General", "Business", "Technology", "Education", "Travel"];
  }
}

/**
 * Lấy thống kê số lượng từ vựng theo chủ đề
 * @returns {Promise<Object>} - Object với key là tên chủ đề, value là số lượng từ vựng
 */
async function getVocabularyStatsByTopic() {
  try {
    // Query the database to get all entries
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    // Tạo object để lưu thống kê
    const topicStats = {};

    // Đếm số lượng từ vựng cho mỗi chủ đề
    response.results.forEach((entry) => {
      if (
        entry.properties.topic &&
        entry.properties.topic.select &&
        entry.properties.topic.select.name
      ) {
        const topic = entry.properties.topic.select.name;
        topicStats[topic] = (topicStats[topic] || 0) + 1;
      } else {
        // Nếu không có chủ đề, tính vào "General"
        topicStats["General"] = (topicStats["General"] || 0) + 1;
      }
    });

    return topicStats;
  } catch (error) {
    console.error("Error getting vocabulary stats by topic:", error);
    return {};
  }
}

/**
 * Helper function to extract content from rich_text array
 * @param {Array} richText - Notion rich_text array
 * @returns {string} - Extracted text content
 */
function extractRichTextContent(richText) {
  if (!richText || richText.length === 0) {
    return "";
  }
  return richText.map((text) => text.plain_text || text.text.content).join("");
}

/**
 * Helper function to shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

module.exports = {
  saveVocabulary,
  getRandomVocabulary,
  getRandomMeanings,
  getRandomWords,
  getRandomVocabularyByTopic,
  getRandomMeaningsByTopic,
  getRandomWordsByTopic,
  getAllTopics,
  getVocabularyStatsByTopic,
};
