const { Kafka } = require('kafkajs');

const kafkaEnabled = process.env.KAFKA_ENABLED === 'true';
let producer = null;
let consumer = null;

if (kafkaEnabled) {
  try {
    const kafka = new Kafka({
      clientId: process.env.CLIENT_ID || 'planyty-backend',
      // Ensure this matches your .env KAFKA_BROKERS=localhost:9092
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 300,
        retries: 10 // Increased retries for slower Docker startups
      }
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: 'planyty-group' });
    console.log('✅ Kafka client configuration loaded');
  } catch (error) {
    console.error('❌ Kafka initialization failed:', error.message);
  }
}

/**
 * Connects the producer with a retry loop.
 * This prevents the ECONNREFUSED error during Docker startup.
 */
const connectKafka = async () => {
  if (!kafkaEnabled || !producer) {
    console.log('⚠️ Kafka disabled via env, using mock producer');
    return { producer: { send: async () => true } };
  }

  let retries = 5;
  while (retries > 0) {
    try {
      await producer.connect();
      console.log('🚀 Kafka Producer Connected Successfully');
      return { producer };
    } catch (err) {
      retries--;
      console.error(`❌ Kafka connection failed. Retries left: ${retries}`);
      console.log('⏳ Waiting 5 seconds for Kafka broker to be ready...');
      
      if (retries === 0) {
        console.error('🚫 Could not connect to Kafka. Switching to mock producer.');
        return { producer: { send: async () => true } };
      }

      // Wait 5 seconds before trying again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = {
  producer,
  consumer,
  connectKafka
};