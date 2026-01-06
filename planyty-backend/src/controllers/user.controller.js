const { User } = require('../models');
const { sendUserEvent } = require('../services/kafka.producer');
const { paginate } = require('../utils/helpers');
const { Op } = require('sequelize');
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const { offset, limit: queryLimit } = paginate(page, limit);

    const where = {};
    if (role) {
      where.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      offset,
      limit: queryLimit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total: count,
        pages: Math.ceil(count / queryLimit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow admin or the user themselves
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ user: user.toJSON() });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, jobTitle, department, bio } = req.body;
    
    const updatedData = {};
    if (name) updatedData.name = name;
    if (phone !== undefined) updatedData.phone = phone;
    if (location !== undefined) updatedData.location = location;
    if (jobTitle !== undefined) updatedData.jobTitle = jobTitle;
    if (department !== undefined) updatedData.department = department;
    if (bio !== undefined) updatedData.bio = bio;

    await req.user.update(updatedData);

    // Send Kafka event
    await sendUserEvent('USER_UPDATED', req.user);

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValid = await req.user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    // Send Kafka event
    await sendUserEvent('USER_PASSWORD_CHANGED', req.user);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'team_lead', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });

    // Send Kafka event
    await sendUserEvent('USER_ROLE_UPDATED', user, { newRole: role });

    res.json({
      message: 'User role updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};
// SEARCH USERS (The function your route was missing)
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const users = await User.findAll({
            where: {
                email: { [Op.like]: `${query}%` }
            },
            attributes: ['id', 'name', 'email'],
            limit: 5
        });
        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: error.message });
    }
};// In user.controller.js - Add these functions

// Get current user profile
exports.getCurrentUserProfile = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    // Assuming you're using multer for file uploads
    // You need to configure multer middleware in your routes
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded file
    const avatar_url = `/uploads/avatars/${req.file.filename}`;
    
    await req.user.update({ avatar_url });

    // Send Kafka event
    await sendUserEvent('USER_AVATAR_UPDATED', req.user);

    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url,
      user: req.user.toJSON()
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // You might want to soft delete instead
    await req.user.update({ is_active: false });
    
    // Or hard delete
    // await req.user.destroy();

    // Send Kafka event
    await sendUserEvent('USER_DELETED', req.user);

    // Clear token
    res.clearCookie('token');
    
    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// Export user data
exports.exportData = async (req, res) => {
  try {
    // Get all user data (you might want to join with other tables)
    const userData = req.user.toJSON();
    
    // Add related data if needed
    // const tasks = await Task.findAll({ where: { userId: req.user.id } });
    // userData.tasks = tasks;
    
    // Convert to JSON string
    const jsonData = JSON.stringify(userData, null, 2);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');
    
    res.send(jsonData);

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Assuming you have a preferences column or a separate table
    // If using JSON column:
    await req.user.update({ 
      preferences: { ...req.user.preferences, ...preferences }
    });

    // Send Kafka event
    await sendUserEvent('USER_PREFERENCES_UPDATED', req.user);

    res.json({
      message: 'Preferences updated successfully',
      preferences: req.user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};