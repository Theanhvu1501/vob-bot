require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function checkDatabaseStructure() {
  try {
    console.log('Checking Notion database structure...');
    
    // Get database metadata
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    
    console.log('Database name:', database.title[0]?.plain_text || 'Unnamed');
    console.log('Properties:');
    
    // Log each property and its type
    Object.entries(database.properties).forEach(([name, property]) => {
      console.log(`- ${name}: ${property.type}`);
    });
    
    return database.properties;
  } catch (error) {
    console.error('Error checking database structure:', error);
    return null;
  }
}

checkDatabaseStructure();