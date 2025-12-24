// src/components/settings/SettingsTabs.jsx
import React from 'react';

const SettingsTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-purple-200">
      <nav className="flex px-6 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-300
              ${activeTab === tab.id
                ? 'text-purple-700 border-b-2 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }
              ${tab.id === 'profile' ? 'rounded-tl-lg' : ''}
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default SettingsTabs;