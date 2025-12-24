const { body } = require('express-validator');
const { User } = require('../models');

// User validations
const userValidations = {
  register: [
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ where: { email } });
        if (user) {
          throw new Error('Email already in use');
        }
        return true;
      }),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/\d/).withMessage('Password must contain a number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters')
  ],

  login: [
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('avatar_url')
      .optional()
      .isURL().withMessage('Avatar must be a valid URL')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .matches(/\d/).withMessage('New password must contain a number')
  ]
};

// Project validations
const projectValidations = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Project name must be between 3-200 characters'),
    body('description')
      .optional()
      .trim(),
    body('start_date')
      .optional()
      .isISO8601().withMessage('Start date must be a valid date'),
    body('end_date')
      .optional()
      .isISO8601().withMessage('End date must be a valid date')
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Project name must be between 3-200 characters'),
    body('status')
      .optional()
      .isIn(['planned', 'in_progress', 'completed', 'on_hold']).withMessage('Invalid status'),
    body('description')
      .optional()
      .trim()
  ]
};

// Task validations
const taskValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3-200 characters'),
    body('description')
      .optional()
      .trim(),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('due_date')
      .optional()
      .isISO8601().withMessage('Due date must be a valid date'),
    body('estimated_hours')
      .optional()
      .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number')
  ]
};

// Invitation validations
const invitationValidations = {
  send: [
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ where: { email } });
        if (user) {
          throw new Error('User already exists with this email');
        }
        return true;
      }),
    body('role')
      .isIn(['admin', 'team_lead']).withMessage('Role must be either admin or team_lead')
  ]
};

module.exports = {
  userValidations,
  projectValidations,
  taskValidations,
  invitationValidations
};