export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done',
};

export const PRIORITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  WORKSPACES: '/workspaces',
  PROJECTS: (workspaceId) => `/workspaces/${workspaceId}/projects`,
  TASKS: (projectId) => `/projects/${projectId}/tasks`,
};
