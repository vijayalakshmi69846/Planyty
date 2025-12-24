const { User } = require('../models');
const { sendUserEvent } = require('../services/kafka.producer');
const { paginate } = require('../utils/helpers');

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
    const { name, avatar_url } = req.body;
    
    const updatedData = {};
    if (name) updatedData.name = name;
    if (avatar_url) updatedData.avatar_url = avatar_url;

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