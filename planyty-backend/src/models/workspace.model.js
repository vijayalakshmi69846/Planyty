// src/models/workspace.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Workspace = sequelize.define('Workspace', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: 'purple'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'workspaces',
    underscored: true,
    timestamps: true, // Keep this true
    createdAt: 'created_at', // This maps to your existing column
    updatedAt: false, // Disable updatedAt since column doesn't exist
});

module.exports = Workspace;