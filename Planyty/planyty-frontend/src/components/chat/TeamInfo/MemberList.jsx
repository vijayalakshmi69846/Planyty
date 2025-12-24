import React from 'react';
import { Mail, MoreVertical, Crown, User } from 'lucide-react';

const MemberList = ({ members }) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
        {/* Removed the Add Member button from here */}
      </div>
      
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white font-medium">
                  {member.avatar}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                  member.status === 'online' ? 'bg-green-500' :
                  member.status === 'away' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{member.name}</span>
                  {member.role === 'Admin' && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                  {member.role === 'Member' && (
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-3.5 h-3.5" />
                  {member.email}
                </div>
              </div>
            </div>
            
            <button className="p-1.5 hover:bg-gray-200 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;