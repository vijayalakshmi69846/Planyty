module.exports = {
  ROLES: {
    ADMIN: 'admin',
    TEAM_LEAD: 'team_lead',
    MEMBER: 'member'
  },

  PROJECT_STATUS: {
    PLANNED: 'planned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold'
  },

  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed'
  },

  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  INVITATION_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    EXPIRED: 'expired'
  },

  KAFKA_TOPICS: {
    USER_EVENTS: 'user-events',
    PROJECT_EVENTS: 'project-events',
    TASK_EVENTS: 'task-events',
    INVITATION_EVENTS: 'invitation-events',
    EMAIL_NOTIFICATIONS: 'email-notifications',
    ACTIVITY_LOGS: 'activity-logs'
  },

  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  }
};