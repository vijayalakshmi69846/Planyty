const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
    id: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        autoIncrement: true, 
        primaryKey: true 
    },
    team_id: { 
        type: DataTypes.INTEGER.UNSIGNED, // Match Team ID
        allowNull: false 
    },
    user_id: { 
        type: DataTypes.INTEGER.UNSIGNED, // Match User ID
        allowNull: false 
    },
    role: { type: DataTypes.STRING, defaultValue: 'member' }
}, { 
    tableName: 'team_members', 
    timestamps: true, 
    underscored: true 
});

module.exports = TeamMember;