// src/components/settings/NotificationsTab.jsx
import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Bell, Mail, Smartphone, MessageSquare, Calendar, Users } from 'lucide-react';
import { userService } from '../../services/userService';
import { toast } from 'react-hot-toast';

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState({
    // ... initial state ...
  });
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({});

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      const response = await userService.getCurrentUser();
      const userData = response.data.user;
      
      if (userData.preferences) {
        setNotifications(userData.preferences.notifications || notifications);
        setInitialData(userData.preferences.notifications || {});
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await userService.updatePreferences({
        notifications: notifications
      });
      toast.success('Notification settings saved');
      setInitialData({ ...notifications });
    } catch (error) {
      console.error('Failed to save notifications:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNotifications(initialData);
  };

  const hasChanges = JSON.stringify(notifications) !== JSON.stringify(initialData);

  if (loading && Object.keys(initialData).length === 0) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Email Notifications */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Mail className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700">Email Notifications</h3>
            <p className="text-sm text-gray-600">Control what emails you receive</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'emailTaskAssignments', label: 'Task Assignments', description: 'When you are assigned to a new task' },
            { key: 'emailDeadlineReminders', label: 'Deadline Reminders', description: 'Reminders for upcoming deadlines' },
            { key: 'emailTeamMentions', label: 'Team Mentions', description: 'When someone mentions you in comments' },
            { key: 'emailWeeklyDigest', label: 'Weekly Digest', description: 'Summary of weekly activity' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-purple-50 transition-colors">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <ToggleSwitch
                enabled={notifications[item.key]}
                onChange={() => toggleNotification(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700">Push Notifications</h3>
            <p className="text-sm text-gray-600">Mobile and desktop push notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'pushNewMessages', label: 'New Messages', description: 'When you receive new direct messages', icon: <MessageSquare className="w-4 h-4" /> },
            { key: 'pushTaskUpdates', label: 'Task Updates', description: 'Updates on tasks you are following', icon: <Bell className="w-4 h-4" /> },
            { key: 'pushMeetingReminders', label: 'Meeting Reminders', description: 'Reminders for upcoming meetings', icon: <Calendar className="w-4 h-4" /> },
            { key: 'pushTeamActivity', label: 'Team Activity', description: 'General team activity updates', icon: <Users className="w-4 h-4" /> },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-purple-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={notifications[item.key]}
                onChange={() => toggleNotification(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700">In-App Notifications</h3>
            <p className="text-sm text-gray-600">Notifications within the application</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'inAppTaskComments', label: 'Task Comments', description: 'New comments on your tasks' },
            { key: 'inAppFileUploads', label: 'File Uploads', description: 'When files are uploaded to your projects' },
            { key: 'inAppStatusChanges', label: 'Status Changes', description: 'When task status changes in your projects' },
            { key: 'inAppNewMembers', label: 'New Team Members', description: 'When new members join your projects' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-purple-50 transition-colors">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <ToggleSwitch
                enabled={notifications[item.key]}
                onChange={() => toggleNotification(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700">Quiet Hours</h3>
            <p className="text-sm text-gray-600">Schedule when notifications should be muted</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div>
              <h4 className="font-medium text-gray-900">Enable Quiet Hours</h4>
              <p className="text-sm text-gray-600">Mute notifications during specific hours</p>
            </div>
            <ToggleSwitch
              enabled={notifications.quietHoursEnabled}
              onChange={() => toggleNotification('quietHoursEnabled')}
            />
          </div>

          {notifications.quietHoursEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-white rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={notifications.quietHoursStart}
                  onChange={(e) => setNotifications(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={notifications.quietHoursEnd}
                  onChange={(e) => setNotifications(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
           <div className="flex justify-between items-center pt-4 border-t">
        <Button
          onClick={handleReset}
          disabled={!hasChanges}
          variant="secondary"
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Reset to Default
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange }) => {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
        enabled ? 'bg-purple-600' : 'bg-gray-300'
      }`}
      onClick={onChange}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default NotificationsTab;