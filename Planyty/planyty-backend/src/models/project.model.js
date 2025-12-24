// src/models/project.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'on_hold'),
    defaultValue: 'planned'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  task_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  workspace_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true 
});

module.exports = Project;