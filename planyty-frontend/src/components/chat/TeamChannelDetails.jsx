// src/components/chat/TeamChannelDetails.jsx
import React, { useState, useEffect } from 'react';
import { Users, FolderKanban, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const TeamChannelDetails = ({ channel, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    if (channel?.teamInfo) {
      fetchTeamDetails(channel.teamInfo.id);
    }
  }, [channel]);

  const fetchTeamDetails = async (teamId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team/team-channel/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('planyty_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!channel?.teamInfo) return null;

  const renderProjectStats = (project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = project.tasks.filter(t => t.status === 'todo').length;
    
    return (
      <div className="text-xs text-gray-500 flex gap-3">
        <span className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-500" />
          {completedTasks} done
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-blue-500" />
          {inProgressTasks} in progress
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle size={12} className="text-yellow-500" />
          {pendingTasks} pending
        </span>
      </div>
    );
  };

  const renderProjectsTab = () => (
    <div className="space-y-4">
      {details?.projects?.map(project => (
        <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-800">{project.name}</h4>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {project.progress}%
              </span>
            </div>
          </div>
          
          {renderProjectStats(project)}
          
          {/* Project Members from Tasks */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Assigned Members:</p>
            <div className="flex flex-wrap gap-2">
              {project.tasks
                .filter(task => task.assignee)
                .map((task, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-xs text-white">
                      {task.assignee.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-700">{task.assignee.name}</span>
                  </div>
                ))}
              {project.tasks.filter(task => task.assignee).length === 0 && (
                <p className="text-xs text-gray-400">No members assigned yet</p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {(!details?.projects || details.projects.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No projects in this workspace yet</p>
        </div>
      )}
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-3">
      {details?.members?.map(member => (
        <div key={member.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold">
              {member.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{member.name}</h4>
              <p className="text-xs text-gray-500">{member.role} • {member.email}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            member.role === 'team_lead' ? 'bg-purple-100 text-purple-800' :
            member.role === 'admin' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {member.role.replace('_', ' ')}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{channel.name}</h2>
            <p className="text-sm text-gray-600">
              Team: <span className="font-semibold">{channel.teamInfo?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === 'projects'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderKanban className="w-4 h-4 inline mr-2" />
            Projects ({details?.projects?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Members ({details?.members?.length || 0})
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading team details...</p>
            </div>
          ) : (
            <>
              {activeTab === 'projects' && renderProjectsTab()}
              {activeTab === 'members' && renderMembersTab()}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChannelDetails;