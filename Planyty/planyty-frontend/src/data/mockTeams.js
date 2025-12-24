export const mockTeams = [
  {
    id: 1,
    name: "Development Team",
    description: "Frontend and backend development team",
    members: [
      { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "member" },
      { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "member" }
    ],
    projects: [
      { id: 1, name: "Website Redesign", status: "in-progress", dueDate: "2024-02-15" },
      { id: 2, name: "Mobile App", status: "planning", dueDate: "2024-03-01" }
    ]
  },
  {
    id: 2,
    name: "Design Team",
    description: "UI/UX design team",
    members: [
      { id: 4, name: "Sarah Wilson", email: "sarah@example.com", role: "admin" },
      { id: 5, name: "Alex Brown", email: "alex@example.com", role: "member" }
    ],
    projects: [
      { id: 3, name: "Brand Identity", status: "completed", dueDate: "2024-01-10" }
    ]
  }
];