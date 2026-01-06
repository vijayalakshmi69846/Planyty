const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const MeetingAttendee = sequelize.define('MeetingAttendee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  meeting_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'meetings',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('invited', 'accepted', 'declined', 'attended'),
    defaultValue: 'invited'
  }
}, {
  tableName: 'meeting_attendees',
  timestamps: true
});

module.exports = MeetingAttendee;