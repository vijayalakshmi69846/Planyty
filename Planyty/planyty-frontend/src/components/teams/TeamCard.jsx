import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Users, FolderKanban, Edit2, X, Trash2, Check, ShieldCheck } from 'lucide-react';

const TeamCard = ({ team, onAddMember, onRemoveMember, onUpdateTeam, onDeleteTeam, canEdit }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeam, setEditedTeam] = useState({ 
    name: team?.name || '', 
    description: team?.description || '' 
  });

  // 1. Check if user is the creator (using creator_id from database)
  const isCreator = Number(user?.id) === Number(team?.creator_id);

  // 2. Robust Role Check: Support both 'lead' and 'team_lead' (case-insensitive)
  const userMemberInfo = team?.members?.find(m => Number(m.id) === Number(user?.id));
  const rawRole = userMemberInfo?.TeamMember?.role?.toLowerCase() || "";
  const isLeadByRole = rawRole === 'lead' || rawRole === 'team_lead';
  
  // 3. Final Permission Logic
  // Show buttons if: passed from parent OR user is creator OR user has lead role
  const hasPermission = canEdit || isCreator || isLeadByRole;

  useEffect(() => {
    // Helpful logging to see why permission is granted or denied
    console.log(`DEBUG [${team.name}]: UserID=${user?.id}, CreatorID=${team.creator_id}, Role=${rawRole}, hasPermission=${hasPermission}`);
  }, [team, user, hasPermission, rawRole]);

  const handleSave = async () => {
    try {
      await onUpdateTeam(team.id, editedTeam);
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update: " + error.message);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border overflow-hidden flex flex-col h-full transition-all ${hasPermission ? 'border-purple-200 ring-1 ring-purple-50' : 'border-gray-100'}`}>
      
      {/* Header Section */}
      <div className={`p-5 border-b ${hasPermission ? 'bg-purple-50/30' : 'bg-white'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <div className="space-y-2">
                <input 
                  className="w-full text-lg font-bold border-b-2 border-purple-500 outline-none bg-transparent"
                  value={editedTeam.name}
                  onChange={(e) => setEditedTeam({...editedTeam, name: e.target.value})}
                  autoFocus
                />
                <input 
                  className="w-full text-xs text-gray-500 border-b border-gray-300 outline-none bg-transparent"
                  value={editedTeam.description}
                  onChange={(e) => setEditedTeam({...editedTeam, description: e.target.value})}
                  placeholder="Description"
                />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 truncate flex items-center gap-2">
                  {team.name}
                  {isCreator && <ShieldCheck className="w-4 h-4 text-purple-500" title="Creator" />}
                </h3>
                <p className="text-xs text-gray-500 mt-1 truncate">{team.description || 'Plan with Clarity..!'}</p>
              </>
            )}
          </div>

          {/* EDIT/DELETE BUTTONS - Now visible to team_lead */}
          {hasPermission && !isEditing && (
            <div className="flex gap-1 ml-2">
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                title="Edit Team"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDeleteTeam(team.id)} 
                className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete Team"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="p-5 flex-1 space-y-4">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Members ({team.members?.length || 0})</span>
          </div>
          {hasPermission && (
            <button 
              onClick={onAddMember}
              className="text-xs text-purple-600 hover:underline"
            >
              + Add
            </button>
          )}
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
          {team.members?.map(member => (
            <div key={member.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 group">
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-gray-700 truncate">{member.name || 'User'}</span>
                <span className="text-gray-400 truncate scale-90 origin-left">{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] text-gray-600">
                  {member.TeamMember?.role || 'member'}
                </span>
                {isEditing && Number(member.id) !== Number(user?.id) && (
                  <button 
                    onClick={() => onRemoveMember(member.id)} 
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 bg-gray-50/50 border-t text-center">
        {isEditing ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)} 
              className="flex-1 text-xs py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="flex-1 text-xs py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5">
             <span className={`text-[10px] uppercase font-black tracking-widest ${hasPermission ? 'text-purple-600' : 'text-gray-400'}`}>
              {hasPermission ? '★ TEAM LEAD ACCESS' : 'TEAM MEMBER'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;