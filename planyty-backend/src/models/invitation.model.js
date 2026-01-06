// src/models/invitation.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invitation = sequelize.define('Invitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
  type: DataTypes.ENUM('admin', 'team_lead', 'member'), // ✅ Add 'member' here
  defaultValue: 'member'
},
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'expired'),
    defaultValue: 'pending'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  invited_by: {
    type: DataTypes.STRING, // CHANGE to STRING
    allowNull: false,
    defaultValue: 'system'
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true
  },// Inside your Invitation model definition
workspace_id: {
  type: DataTypes.INTEGER, // Must match your Workspace ID type
  allowNull: true,
  references: {
    model: 'workspaces',
    key: 'id'
  }
},
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'invitations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['email']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Invitation;