const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      // ADD THIS to prevent automatic foreign keys
      freezeTableName: true
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    
    // IMPORTANT: Change or remove sync
    if (process.env.NODE_ENV === 'development') {
      // OPTION 1: Skip sync entirely (recommended for now)
      console.log('⚠️  Skipping automatic sync to prevent foreign key errors');
      console.log('ℹ️  Using existing table structure');
      
      // OR OPTION 2: Use safe sync without foreign keys
      // await safeSync();
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    throw error;
  }
};

// OPTIONAL: Add safe sync function
async function safeSync() {
  try {
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync without altering constraints
    await sequelize.sync();
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Database models synchronized safely.');
  } catch (error) {
    console.error('❌ Safe sync failed:', error.message);
  }
}

module.exports = { sequelize, connectDB };