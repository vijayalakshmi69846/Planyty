const { consumer } = require('../config/kafka');
const emailService = require('./email.service');

const startKafkaConsumer = async () => {
  if (!consumer || process.env.KAFKA_ENABLED !== 'true') {
    console.log('ℹ️  Kafka Consumer skipped (Disabled in .env)');
    return;
  }

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ['email-notifications'], fromBeginning: false });

    console.log('✅ Kafka Consumer Connected & Listening for Emails...');

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const value = JSON.parse(message.value.toString());
          const { type, email, data } = value;
          const recipient = email || (data && data.email);

          if (topic === 'email-notifications' && data && recipient) {
            console.log(`📩 Consumer handling ${type} for ${recipient}`);

            switch (type) {
              case 'COMPANY_INVITATION':
                if (data.role === 'admin') {
                  await emailService.sendAdminInvitationEmail(recipient, data.token, data.companyName);
                } else if (data.role === 'team_lead') {
                  await emailService.sendTeamLeadInvitationEmail(recipient, data.token, data.companyName, data.inviterName);
                } else {
                  await emailService.sendInvitationEmail(recipient, data.token, 'member', data.inviterName);
                }
                break;

              // Combined all invitation types to use the standard high-fidelity template
              case 'WORKSPACE_INVITATION':
              case 'INVITATION_SENT':
              case 'TEAM_INVITATION':
                await emailService.sendInvitationEmail(
                  recipient, 
                  data.token, 
                  data.role || 'member', 
                  data.inviterName || 'A teammate',
                  data.workspaceName || 'a Workspace' // Pass workspace name if available
                );
                break;

              case 'MEMBER_ADDED':
                await emailService.sendMemberAddedEmail(recipient, data.teamName, data.inviterName, data.taskData);
                break;

              default:
                console.warn(`⚠️  Unknown notification type received: ${type}`);
            }
          }
        } catch (err) {
          console.error('❌ Kafka Message Processing Error:', err.message);
        }
      }
    });
  } catch (err) { 
    console.error('❌ Kafka Consumer Connection Error:', err); 
  }
};

module.exports = { startKafkaConsumer };