import React, { useState, useEffect } from 'react';
import { useTeams } from '../../hooks/useTeams';
import { useAuth } from '../../contexts/AuthContext';
import TeamCard from './TeamCard';
import InviteModal from './InviteModal';
// FIX: Added 'Users' to imports
import { Plus, Crown, User, Loader2, Users } from 'lucide-react';

const TeamManagement = () => {
  const { user, isTeamLead } = useAuth();
  const { teams, loading, createTeam, inviteMember, removeMember, updateTeam, deleteTeam } = useTeams();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const sendNotification = (type, title, message) => {
    const notifications = JSON.parse(localStorage.getItem('planyty_notifications') || '[]');
    notifications.unshift({ 
      id: Date.now(), 
      title, 
      message, 
      type, 
      read: false, 
      timestamp: new Date().toLocaleTimeString() 
    });
    localStorage.setItem('planyty_notifications', JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('notificationUpdate'));
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if (window.confirm('Remove this member?')) {
      try {
        await removeMember(teamId, memberId);
        sendNotification('team', 'Member Removed', 'Team updated');
      } catch (error) {
        alert("Failed to remove member: " + error.message);
      }
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(teamId);
        sendNotification('team', 'Team Deleted', 'Team has been permanently removed');
      } catch (err) {
        alert("Failed to delete team: " + err.message);
      }
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-white rounded-2xl">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${isTeamLead ? 'bg-purple-500' : 'bg-gray-400'}`}>
               {isTeamLead ? 'Lead View' : 'Member View'}
             </span>
          </div>
        </div>
        {isTeamLead && (
          <button 
            onClick={() => { setSelectedTeam(null); setShowInviteModal(true); }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" /> Create Team
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            {/* FIX: Users icon is now defined via import */}
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p>No teams found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => {
              const isOwner = Number(user?.id) === Number(team?.creator_id);
              const userRole = team.members?.find(m => Number(m.id) === Number(user?.id))?.TeamMember?.role;
              const isLead = isOwner || userRole === 'lead';

              return (
                <TeamCard 
                  key={team.id}
                  team={team}
                  onAddMember={() => { setSelectedTeam(team); setShowInviteModal(true); }}
                  onRemoveMember={(memberId) => handleRemoveMember(team.id, memberId)}
                  onUpdateTeam={updateTeam}
                  onDeleteTeam={handleDeleteTeam}
                  canEdit={isLead} 
                />
              );
            })}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          team={selectedTeam}
          onClose={() => setShowInviteModal(false)}
          onInvite={inviteMember}
          onCreateTeam={createTeam}
        />
      )}
    </div>
  );
};

export default TeamManagement;