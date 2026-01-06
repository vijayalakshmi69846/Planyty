// reset-db.js - UPDATED VERSION
require('dotenv').config(); // ADD THIS LINE
const mysql = require('mysql2/promise');

async function resetDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'planyty_user', // FROM .env
    password: process.env.DB_PASSWORD || 'password123', // FROM .env
    database: process.env.DB_NAME || 'planyty_db'
  });

  try {
    console.log('🔄 Resetting invitations table...');
    console.log(`📊 Using database: ${process.env.DB_NAME}`);
    
    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // ... rest of the code remains the same ...
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetDB();