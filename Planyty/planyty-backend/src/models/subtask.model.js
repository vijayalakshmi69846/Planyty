const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Subtask = sequelize.define('Subtask', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    task_id: { type: DataTypes.INTEGER, allowNull: false },
    parent_subtask_id: { type: DataTypes.INTEGER, allowNull: true },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { 
        type: DataTypes.ENUM('not yet begun', 'in progress', 'completed'), 
        defaultValue: 'not yet begun' 
    },
    priority: { 
        type: DataTypes.ENUM('Low', 'Medium', 'High'), 
        defaultValue: 'Medium' 
    },
    due_date: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    timestamps: false,
    tableName: 'subtasks'
});

module.exports = Subtask;