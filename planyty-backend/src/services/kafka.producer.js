const { producer } = require('../config/kafka');
const sendKafkaMessage = async (topic, message) => {
  try {
    // Check if Kafka is enabled and producer is connected
    if (!producer || !producer.send || process.env.KAFKA_ENABLED !== 'true') {
      console.log(`⚠️  [MOCK KAFKA] Topic: ${topic} | Type: ${message.type}`);
      return true;
    }

    await producer.send({
      topic,
      messages: [{
        value: JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
          service: 'planyty-backend'
        })
      }]
    });

    console.log(`📤 Kafka Event Dispatched → ${topic}: ${message.type}`);
    return true;
  } catch (error) {
    console.error(`❌ Kafka send failed to ${topic}:`, error.message);
    return false;
  }
};

// --- Specialized Helpers ---

const sendEmailNotification = (type, email, data) => 
  sendKafkaMessage('email-notifications', { type, email, data });

const sendActivityLog = (userId, action, resourceType, resourceId, details = {}) =>
  sendKafkaMessage('activity-logs', { userId, action, resourceType, resourceId, details });

const sendInvitationEvent = (type, invitation) => 
  sendKafkaMessage('invitation-events', { type, invitation });

const sendUserEvent = (type, user, details = {}) => 
  sendKafkaMessage('user-events', { type, user, details });

module.exports = { 
  sendKafkaMessage, 
  sendEmailNotification, 
  sendActivityLog, 
  sendInvitationEvent,
  sendUserEvent
};