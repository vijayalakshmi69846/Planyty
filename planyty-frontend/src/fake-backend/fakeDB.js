export const fakeDB = {
  users: [
    { id: 1, name: "Harshini", email: "harshini@test.com" },
    { id: 2, name: "John", email: "john@example.com" },
    { id: 3, name: "Alice", email: "alice@example.com" },
    { id: 4, name: "Bob", email: "bob@example.com" },
    { id: 5, name: "Charlie", email: "charlie@example.com" },
    { id: 6, name: "Emma", email: "emma@example.com" },
    { id: 7, name: "David", email: "david@example.com" },
    { id: 8, name: "Sophia", email: "sophia@example.com" }
  ],

  channels: [
    { id: 'general', name: "General" },
    { id: 'design', name: "Design" },
    { id: 'announcements', name: "Announcements" },
  ],

  teams: [
    { id: 'frontend-team', name: "Frontend Team" },
    { id: 'backend-team', name: "Backend Team" },
  ],

  messages: {
    'general': [
      { id: 1, sender: "John", text: "Welcome everyone!", timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'text' },
      { id: 2, sender: "Alice", text: "Good morning team!", timestamp: new Date().toISOString(), type: 'text' },
      { id: 3, sender: "Bob", text: "Has anyone seen the project report?", timestamp: new Date(Date.now() - 43200000).toISOString(), type: 'text' },
      { id: 4, sender: "Emma", text: "The meeting has been rescheduled to 3 PM", timestamp: new Date(Date.now() - 21600000).toISOString(), type: 'text' },
    ],
    'design': [
      { id: 5, sender: "Harshini", text: "Here's the latest mockup", timestamp: new Date().toISOString(), type: 'text' },
      { id: 6, sender: "Sophia", text: "I love the new color palette!", timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'text' },
      { id: 7, sender: "David", text: "Can we add more spacing between elements?", timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'text' },
    ],
    'frontend-team': [
      { id: 8, sender: "John", text: "Meeting at 2 PM", timestamp: new Date().toISOString(), type: 'text' },
      { id: 9, sender: "Charlie", text: "I've fixed the login bug", timestamp: new Date(Date.now() - 5400000).toISOString(), type: 'text' },
      { id: 10, sender: "Alice", text: "The new React hooks are working great", timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'text' },
    ],
    'backend-team': [
      { id: 11, sender: "Bob", text: "API documentation is updated", timestamp: new Date().toISOString(), type: 'text' },
      { id: 12, sender: "David", text: "Database migration completed", timestamp: new Date(Date.now() - 900000).toISOString(), type: 'text' },
    ],
    'dm_john': [
      { id: 13, sender: "John", text: "Hi there!", timestamp: new Date().toISOString(), type: 'text' },
      { id: 14, sender: "You", text: "Hello John!", timestamp: new Date(Date.now() - 600000).toISOString(), type: 'text' },
    ]
  },

  unread: {
    'general': 2,
    'design': 1,
    'frontend-team': 0,
    'backend-team': 0,
    'dm_john': 0,
  }
};