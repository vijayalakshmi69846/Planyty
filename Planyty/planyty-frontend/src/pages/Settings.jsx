// src/components/pages/Settings.jsx
import React, { useState } from 'react';
import SettingsTabs from '../components/settings/SettingsTabs';
import ProfileTab from '../components/settings/ProfileTab';
import AccountTab from '../components/settings/AccountTab';
import NotificationsTab from '../components/settings/NotificationsTab';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'account':
        return <AccountTab />;
      case 'notifications':
        return <NotificationsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden">
      {/* HEADER SECTION - Same as Meetings page */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
          {/* You can add a button here if needed, like "Save All" */}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Settings Container */}
          <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-purple-200 overflow-hidden">
            {/* Tabs Navigation */}
            <SettingsTabs 
              tabs={tabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
            
            {/* Tab Content Area */}
            <div className="p-4">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;