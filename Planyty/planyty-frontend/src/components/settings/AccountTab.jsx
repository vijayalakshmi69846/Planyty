// src/components/settings/AccountTab.jsx
import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Key, Globe, Shield, Download, Trash2, AlertCircle } from 'lucide-react';

const AccountTab = () => {
  const [account, setAccount] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'english',
    timezone: 'UTC-08:00 (Pacific Time)',
    dateFormat: 'MM/DD/YYYY',
  });

  const handleInputChange = (field, value) => {
    setAccount(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = () => {
    if (account.newPassword !== account.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log('Password change requested');
    // Add password change logic here
  };

  const handleExportData = () => {
    console.log('Exporting data...');
    // Add export logic here
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Deleting account...');
      // Add delete account logic here
    }
  };

  return (
    <div className="space-y-8">
      {/* Password Change Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Key className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700">Change Password</h3>
            <p className="text-sm text-gray-600">Update your account password</p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <Input
              type="password"
              value={account.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={account.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={account.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <Button
            onClick={handlePasswordChange}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700">Preferences</h3>
            <p className="text-sm text-gray-600">Customize your account preferences</p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={account.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={account.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
            >
              <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
              <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
              <option value="UTC+00:00 (GMT)">UTC+00:00 (GMT)</option>
              <option value="UTC+05:30 (IST)">UTC+05:30 (IST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={account.dateFormat}
              onChange={(e) => handleInputChange('dateFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-700">Account Actions</h3>
            <p className="text-sm text-gray-600">Manage your account data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Export Account Data</h4>
                <p className="text-sm text-gray-600">Download all your data in JSON format</p>
              </div>
            </div>
            <Button
              onClick={handleExportData}
              variant="secondary"
              className="border border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Export Data
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium text-gray-900">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
              </div>
            </div>
            <Button
              onClick={handleDeleteAccount}
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTab;