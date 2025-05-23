const notionService = require("./notionService");
const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Giả sử bạn có một database riêng cho study progress
const studyProgressDatabaseId = process.env.NOTION_STUDY_PROGRESS_DATABASE_ID;

/**
 * Lưu tiến độ học tập
 * @param {string} vocabularyId - ID của từ vựng
 * @param {number} quality - Chất lượng nhớ (1-5)
 */
async function saveStudyProgress(vocabularyId, quality) {
  try {
    // Không cần lưu userId nữa vì chỉ có một người dùng

    // Lưu tiến độ học tập vào Notion
    // Có thể thêm trực tiếp vào bảng từ vựng thay vì tạo bảng riêng

    // Ví dụ: Cập nhật trường last_reviewed và quality trong bảng từ vựng
    await notion.pages.update({
      page_id: vocabularyId,
      properties: {
        last_reviewed: {
          date: {
            start: new Date().toISOString(),
          },
        },
        quality: {
          number: quality,
        },
      },
    });

    return true;
  } catch (error) {
    console.error("Error saving study progress:", error);
    return false;
  }
}

module.exports = {
  saveStudyProgress,
};
