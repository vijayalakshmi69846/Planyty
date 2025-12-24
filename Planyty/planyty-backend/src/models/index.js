// src/models/index.js
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Team = require('./team.model');
const Project = require('./project.model');
const TeamMember = require('./TeamMember');
const Workspace = require('./workspace.model');
const Company = require('./company.model');
const Invitation = require('./invitation.model');
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
Team.belongsToMany(User, { through: TeamMember,foreignKey: 'team_id', otherKey: 'user_id',as: 'members' });
User.belongsToMany(Team, { through: TeamMember, foreignKey: 'user_id', otherKey: 'team_id',as: 'teams' });
module.exports = { sequelize, Project, User, Team, TeamMember, Company, Workspace, Invitation };