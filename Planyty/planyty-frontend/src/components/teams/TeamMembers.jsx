import React from 'react';

const TeamMembers = ({ members, onRemoveMember }) => {
  return (
    <div className="team-members">
      <div className="section-header flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Team Members ({members.length})
        </h4>
      </div>
      
      <div className="members-list space-y-2">
        {members.map(member => (
          <div key={member.id} className="member-item flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div className="member-info flex items-center space-x-3">
              <div className="member-avatar w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {member.name?.charAt(0) || member.email.charAt(0)}
              </div>
              <div className="member-details">
                <div className="member-name text-sm font-medium text-gray-900">
                  {member.name || member.email}
                </div>
                {member.name && (
                  <div className="member-email text-xs text-gray-500">{member.email}</div>
                )}
              </div>
            </div>
            
            <div className="member-actions flex items-center space-x-2">
              <span className={`role-badge px-2 py-1 text-xs rounded-full ${
                member.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {member.role}
              </span>
              <button 
                className="remove-btn w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                onClick={() => onRemoveMember(member.id)}
                title="Remove member"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;