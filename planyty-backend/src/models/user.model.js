const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'team_lead', 'member'),
    defaultValue: 'member',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refresh_token: { // Ensuring this is also in your model since it's in your DB
    type: DataTypes.TEXT,
    allowNull: true,
  },// In user.model.js - Add these to your model definition
phone: {
  type: DataTypes.STRING,
  allowNull: true,
},
location: {
  type: DataTypes.STRING,
  allowNull: true,
},
jobTitle: {
  type: DataTypes.STRING,
  allowNull: true,
},
department: {
  type: DataTypes.STRING,
  allowNull: true,
},
bio: {
  type: DataTypes.TEXT,
  allowNull: true,
},
avatar_url: {
  type: DataTypes.STRING,
  allowNull: true,
},
preferences: {
  type: DataTypes.JSON,
  defaultValue: {},
},
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
