const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Task = sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { 
        type: DataTypes.ENUM('todo', 'in progress', 'completed'), 
        defaultValue: 'todo' 
    },
    priority: { 
        type: DataTypes.ENUM('Low', 'Medium', 'High'), 
        defaultValue: 'Medium' 
    },    progress: {  // Add this field
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    due_date: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    timestamps: false,
    tableName: 'tasks'
});

module.exports = Task;