// server.js
require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database'); 
const { sequelize } = require('./src/models/index'); 
const { connectKafka } = require('./src/config/kafka');
const { startKafkaConsumer } = require('./src/services/kafka.consumer');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Core Services: Database must be ready first
    await connectDB();
    console.log('✅ Database connected');
    
    // Sync models (skipping automatic sync if preferred as per your logs)
    await sequelize.sync(); 
    console.log('✅ Database models synchronized');

    // 2. OPEN THE PORT 🚀 
    // We do this BEFORE Kafka so the frontend can connect immediately.
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📡 Health check available at: http://localhost:${PORT}/health`);
    });

    // 3. Background Services: Kafka
    // We do NOT 'await' these globally so they don't block the API
    initBackgroundServices();

  } catch (error) {
    console.error('❌ Critical failure during startup:', error);
    process.exit(1);
  }
}
// Inside your startServer() function
const emailService = require('./src/services/email.service');

emailService.verifyEmailConfig()
  .then(() => console.log('📧 SMTP Server: Connection Verified'))
  .catch((err) => console.error('📧 SMTP Server: Connection Failed!', err.message));
async function initBackgroundServices() {
  try {
    const kafka = await connectKafka();
    console.log(kafka.producer.send ? '✅ Kafka Producer ready' : '⚠️ Kafka mock mode');
    
    // Start consumer in background
    startKafkaConsumer().catch(err => {
      console.error("❌ Kafka Consumer background error:", err.message);
    });
  } catch (kafkaError) {
    console.error('⚠️ Kafka system failed to initialize:', kafkaError.message);
  }
}

startServer();