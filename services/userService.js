const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Giả sử bạn có một database riêng cho user data
const userDatabaseId = process.env.NOTION_USER_DATABASE_ID;

/**
 * Lưu thông tin người dùng vào Notion
 */
async function saveUser(userId, chatId, username, firstName, lastName) {
  try {
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await getUserByChatId(chatId);
    
    if (existingUser) {
      // Cập nhật thông tin user
      return await notion.pages.update({
        page_id: existingUser.id,
        properties: {
          last_active: {
            date: {
              start: new Date().toISOString(),
            },
          },
          username: {
            rich_text: [
              {
                text: {
                  content: username || '',
                },
              },
            ],
          },
        },
      });
    } else {
      // Tạo user mới
      return await notion.pages.create({
        parent: {
          database_id: userDatabaseId,
        },
        properties: {
          user_id: {
            title: [
              {
                text: {
                  content: userId.toString(),
                },
              },
            ],
          },
          chat_id: {
            rich_text: [
              {
                text: {
                  content: chatId.toString(),
                },
              },
            ],
          },
          username: {
            rich_text: [
              {
                text: {
                  content: username || '',
                },
              },
            ],
          },
          first_name: {
            rich_text: [
              {
                text: {
                  content: firstName || '',
                },
              },
            ],
          },
          last_name: {
            rich_text: [
              {
                text: {
                  content: lastName || '',
                },
              },
            ],
          },
          joined_date: {
            date: {
              start: new Date().toISOString(),
            },
          },
          last_active: {
            date: {
              start: new Date().toISOString(),
            },
          },
          active: {
            checkbox: true,
          },
        },
      });
    }
  } catch (error) {
    console.error('Error saving user to Notion:', error);
    throw error;
  }
}

/**
 * Lấy thông tin người dùng theo chat ID
 */
async function getUserByChatId(chatId) {
  try {
    const response = await notion.databases.query({
      database_id: userDatabaseId,
      filter: {
        property: 'chat_id',
        rich_text: {
          equals: chatId.toString(),
        },
      },
    });

    if (response.results.length > 0) {
      return response.results[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting user from Notion:', error);
    return null;
  }
}

/**
 * Lấy danh sách tất cả người dùng đang hoạt động
 */
async function getActiveUsers() {
  try {
    const response = await notion.databases.query({
      database_id: userDatabaseId,
      filter: {
        property: 'active',
        checkbox: {
          equals: true,
        },
      },
    });

    return response.results.map(user => ({
      id: user.id,
      userId: user.properties.user_id.title[0]?.plain_text,
      chatId: user.properties.chat_id.rich_text[0]?.plain_text,
      username: user.properties.username.rich_text[0]?.plain_text,
      firstName: user.properties.first_name.rich_text[0]?.plain_text,
      lastName: user.properties.last_name.rich_text[0]?.plain_text,
      joinedDate: user.properties.joined_date.date?.start,
      lastActive: user.properties.last_active.date?.start,
    }));
  } catch (error) {
    console.error('Error getting active users from Notion:', error);
    return [];
  }
}

module.exports = {
  saveUser,
  getUserByChatId,
  getActiveUsers,
};