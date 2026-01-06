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
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  // ADD THESE MISSING FIELDS:
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  task_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  workspace_id: { type: DataTypes.INTEGER, allowNull: false },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'teams',
      key: 'id'
    }
  }
}, {
  tableName: 'projects',
  timestamps: true, // This creates createdAt and updatedAt (camelCase)
  underscored: true, // This converts camelCase to snake_case for database
  createdAt: 'created_at', // Map createdAt to created_at in database
  updatedAt: 'updated_at'  // Map updatedAt to updated_at in database
});

module.exports = Project;