const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    workspace_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'workspaces',
            key: 'id'
        }
    },
    // ⭐ Add this to track who can edit/delete
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT }
}, { 
    tableName: 'teams', 
    underscored: true,
    timestamps: true
});

module.exports = Team;