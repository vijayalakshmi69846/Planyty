const { sequelize } = require('../config/database');
const User = require('./user.model');
const Team = require('./team.model');
const Project = require('./project.model');
const TeamMember = require('./TeamMember');
const Workspace = require('./workspace.model');
const Company = require('./company.model');
const Invitation = require('./invitation.model');
const Task = require('./task.model');
const Subtask = require('./subtask.model');
const Tag = require('./tag.model');
const Meeting = require('./Meeting');
const MeetingAttendee = require('./MeetingAttendee');

// 1. User <-> Project
User.hasMany(Project, { foreignKey: 'created_by', as: 'createdProjects' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 2. Workspace <-> Project
Workspace.hasMany(Project, { foreignKey: 'workspace_id', as: 'Projects', onDelete: 'CASCADE' });
Project.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });
Workspace.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// 3. Workspace <-> Invitation
Workspace.hasMany(Invitation, { foreignKey: 'workspace_id', as: 'invitations' });
Invitation.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// 4. Workspace <-> Team
Workspace.hasMany(Team, { foreignKey: 'workspace_id', as: 'teams' });
Team.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// 5. Team <-> TeamMember
Team.hasMany(TeamMember, { foreignKey: 'team_id', onDelete: 'CASCADE' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id' });

// 6. Many-to-Many: Team <-> User
Team.belongsToMany(User, { 
    through: TeamMember,
    foreignKey: 'team_id', 
    otherKey: 'user_id',
    as: 'members' 
});
User.belongsToMany(Team, { 
    through: TeamMember, 
    foreignKey: 'user_id', 
    otherKey: 'team_id',
    as: 'teams' 
});

// 7. Task <-> Subtask (One-to-Many)
Task.hasMany(Subtask, { foreignKey: 'task_id', as: 'subtasks', onDelete: 'CASCADE' });
Subtask.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// 8. Recursive Subtasks
Subtask.hasMany(Subtask, { foreignKey: 'parent_subtask_id', as: 'children', onDelete: 'CASCADE' });
Subtask.belongsTo(Subtask, { foreignKey: 'parent_subtask_id', as: 'parent' });

// 9. Subtask <-> User (Assignee)
Subtask.belongsTo(User, { 
    as: 'subtaskAssignee',
    foreignKey: 'assigned_to' 
});
User.hasMany(Subtask, { 
    as: 'assignedSubtasks', 
    foreignKey: 'assigned_to' 
});

// 10. Task <-> Tag (Many-to-Many)
Task.belongsToMany(Tag, { 
    through: 'task_tags', 
    foreignKey: 'task_id', 
    otherKey: 'tag_id',
    as: 'tags',
    timestamps: false
});
Tag.belongsToMany(Task, { 
    through: 'task_tags', 
    foreignKey: 'tag_id', 
    otherKey: 'task_id',
    timestamps: false 
});

// 11. Task <-> Project
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// 12. Task <-> User (Assignee)
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// 13. Team <-> Project
Team.hasMany(Project, { foreignKey: 'team_id', as: 'projects' });
Project.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

// 14. Meeting Associations
Meeting.belongsTo(Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
});

Meeting.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

Meeting.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project'
});

Meeting.belongsToMany(User, {
    through: MeetingAttendee,
    foreignKey: 'meeting_id',
    otherKey: 'user_id',
    as: 'attendees'
});

// 15. User <-> Meeting (as attendee)
User.belongsToMany(Meeting, {
    through: MeetingAttendee,
    foreignKey: 'user_id',
    otherKey: 'meeting_id',
    as: 'meetings'
});

module.exports = { 
    sequelize, 
    Project, 
    User, 
    Team, 
    TeamMember, 
    Company, 
    Workspace, 
    Invitation, 
    Task, 
    Tag, 
    Subtask,
    Meeting,
    MeetingAttendee
};