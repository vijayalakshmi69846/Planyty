// models/Meeting.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workspace_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'workspaces',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meeting_link: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  }
}, {
  tableName: 'meetings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Meeting.associate = (models) => {
  Meeting.belongsTo(models.Workspace, {
    foreignKey: 'workspace_id',
    as: 'workspace'
  });
  Meeting.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  Meeting.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });
  Meeting.belongsToMany(models.User, {
    through: 'meeting_attendees',
    foreignKey: 'meeting_id',
    otherKey: 'user_id',
    as: 'attendees'
  });
};

module.exports = Meeting;