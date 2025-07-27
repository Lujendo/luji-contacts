// src/models/EmailSettings.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const EmailSettings = sequelize.define('EmailSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  smtp_host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  smtp_port: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  smtp_secure: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  smtp_user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  smtp_pass: {
    type: DataTypes.STRING,
    allowNull: false
  },
  from_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  from_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'email_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = EmailSettings;