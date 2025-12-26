const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Tag = sequelize.define('Tag', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), unique: true, allowNull: false }
}, {
    timestamps: false,
    tableName: 'tags'
});

module.exports = Tag;