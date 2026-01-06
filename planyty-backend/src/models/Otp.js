// src/models/Otp.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Otp = sequelize.define(
    'Otp',
    {
      email: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      // Using 'otp' to match the latest usage in auth.controller.js and the SQL error log
      otp: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      expires_at: { 
        type: DataTypes.DATE, 
        allowNull: false 
      },
      // These fields are crucial for the multi-step registration flow
      role: {
        type: DataTypes.STRING,
        defaultValue: 'team_member'
      },
      verified: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
      },
    },
    {
      tableName: 'Otp',
      freezeTableName: true,
      timestamps: true,
      underscored: true,
    }
  );

  return Otp;
};