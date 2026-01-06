import React, { useState, useRef, useEffect } from 'react';
import { X, Users, Image as ImageIcon, FileText, UserPlus, Trash2, ChevronDown } from 'lucide-react';
import MemberList from '../TeamInfo/MemberList';
import SharedMedia from '../TeamInfo/SharedMedia';
import SharedDocuments from '../TeamInfo/SharedDocuments';

const TeamInfoModal = ({ team, onClose, onLeaveTeam, onDeleteTeam }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Developer' },
    { id: 6, name: 'David Wilson', email: 'david@example.com', role: 'Designer' },
    { id: 7, name: 'Eva Green', email: 'eva@example.com', role: 'QA Engineer' },
    { id: 8, name: 'Frank Miller', email: 'frank@example.com', role: 'Frontend Lead' },
  ]);
  const dropdownRef = useRef(null);

  // Mock team data
  const teamInfo = {
    id: team?.id || 'frontend-team',
    name: team?.name || 'Frontend Team',
    description: team?.description || 'Team for frontend development',
    created: '2024-01-15',
    members: [
      { id: 1, name: 'John Doe', role: 'Admin', email: 'john@example.com', status: 'online', avatar: 'JD' },
      { id: 2, name: 'Alice Smith', role: 'Member', email: 'alice@example.com', status: 'away', avatar: 'AS' },
      { id: 3, name: 'Bob Johnson', role: 'Member', email: 'bob@example.com', status: 'offline', avatar: 'BJ' },
      { id: 4, name: 'You', role: 'Member', email: 'you@example.com', status: 'online', avatar: 'Y' },
    ],
    mediaCount: 24,
    documentCount: 12,
    linksCount: 8,
  };

  // Filter out members already in the team
  const filteredAvailableMembers = availableMembers.filter(
    availableMember => 
      !teamInfo.members.some(teamMember => 
        teamMember.email === availableMember.email
      )
  );

  const handleAddMemberClick = (e) => {
    // Prevent event bubbling to parent elements
    e.stopPropagation();
    setShowMemberDropdown(!showMemberDropdown);
  };

  const handleSelectMember = (member) => {
    // Handle adding the member to the team
    console.log('Adding member:', member);
    // Here you would typically call an API or update state
    
    // Show success message or update UI
    alert(`Added ${member.name} to the team`);
    
    // Remove from available members
    setAvailableMembers(prev => prev.filter(m => m.id !== member.id));
    
    // Close dropdown
    setShowMemberDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock shared media and documents...
  const sharedMedia = [
    { id: 1, type: 'image', url: 'https://picsum.photos/200/200?random=1', name: 'design.png', date: '2024-01-20' },
    { id: 2, type: 'image', url: 'https://picsum.photos/200/200?random=2', name: 'mockup.jpg', date: '2024-01-19' },
    { id: 3, type: 'video', url: '#', name: 'demo.mp4', date: '2024-01-18' },
    { id: 4, type: 'image', url: 'https://picsum.photos/200/200?random=3', name: 'ui.png', date: '2024-01-17' },
  ];

  const sharedDocuments = [
    { id: 1, type: 'pdf', name: 'Project Requirements.pdf', size: '2.4 MB', date: '2024-01-20' },
    { id: 2, type: 'doc', name: 'Meeting Notes.docx', size: '1.2 MB', date: '2024-01-19' },
    { id: 3, type: 'xls', name: 'Timeline.xlsx', size: '3.1 MB', date: '2024-01-18' },
    { id: 4, type: 'pdf', name: 'API Documentation.pdf', size: '4.5 MB', date: '2024-01-17' },
  ];

  const tabs = [
    { id: 'members', label: 'Members', icon: Users, count: teamInfo.members.length },
    { id: 'media', label: 'Media', icon: ImageIcon, count: teamInfo.mediaCount },
    { id: 'documents', label: 'Documents', icon: FileText, count: teamInfo.documentCount },
    { id: 'links', label: 'Links', icon: FileText, count: teamInfo.linksCount },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return <MemberList members={teamInfo.members} />;
      case 'media':
        return <SharedMedia media={sharedMedia} />;
      case 'documents':
        return <SharedDocuments documents={sharedDocuments} />;
      case 'links':
        return (
          <div className="p-4">
            <div className="text-gray-500 text-center py-8">
              Links feature coming soon
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                {teamInfo.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{teamInfo.name}</h2>
                <p className="text-gray-500">{teamInfo.description}</p>
                <p className="text-sm text-gray-400">Created on {new Date(teamInfo.created).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onLeaveTeam}
              className="flex-1 px-4 py-3 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Leave Team
            </button>
            <button
              onClick={onDeleteTeam}
              className="flex-1 px-4 py-3 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Team
            </button>
            <div className="flex-1 relative" ref={dropdownRef}>
              <button
                onClick={handleAddMemberClick}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Dropdown Menu */}
              {showMemberDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 max-h-60 overflow-y-auto">
                  {filteredAvailableMembers.length > 0 ? (
                    filteredAvailableMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {member.role}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">
                      No members available to add
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamInfoModal;