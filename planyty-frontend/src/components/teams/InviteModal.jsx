import React, { useState, useEffect } from 'react';
import { X, Users, Mail, FolderKanban, Plus, Trash2, Calendar, ClipboardCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import api from '../../services/api'; // Ensure this path is correct
import toast from 'react-hot-toast';

const InviteModal = ({ team, onClose, onInvite, onCreateTeam }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [{ email: '', taskName: '', dueDate: '' }],
    projects: []
  });
  
  // Real Projects State
  const [dbProjects, setDbProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Real Projects from the database
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        // Calls exports.getAllProjects in project.controller.js
        const response = await api.get('/projects'); 
        // Note: Your controller returns { projects: [...] }
        setDbProjects(response.data.projects || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        toast.error("Could not load projects");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const validMembers = formData.members.filter(m => m.email.trim());

      if (team) {
        if (validMembers.length === 0) throw new Error('Please add at least one email');

        for (const member of validMembers) {
          await onInvite(team.id, {
            email: member.email,
            taskName: member.taskName,
            dueDate: member.dueDate,
            role: 'member'
          });
        }
      } else {
        if (!formData.name.trim()) throw new Error('Team name is required');
        
        const teamPayload = {
          name: formData.name,
          description: formData.description,
          workspace_id: user?.workspaceId || 1, 
          creatorId: user?.id,
          members: validMembers,
          // Extract just the IDs for the backend
          projectIds: formData.projects.map(p => p.id) 
        };
        
        await onCreateTeam(teamPayload);
      }
      onClose();
    } catch (err) {
      console.error("Submission Error:", err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMemberRow = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { email: '', taskName: '', dueDate: '' }]
    }));
  };

  const removeMemberRow = (index) => {
    const newMembers = formData.members.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const updateMemberField = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index][field] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addProject = (project) => {
    if (!formData.projects.some(p => p.id === project.id)) {
      setFormData(prev => ({ ...prev, projects: [...prev.projects, { ...project }] }));
    }
  };

  const removeProject = (projectId) => {
    setFormData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== projectId) }));
  };

  // Filter out projects already selected in the UI
  const filteredAvailableProjects = dbProjects.filter(
    p => !formData.projects.some(selected => selected.id === p.id)
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-purple-100">
          
          <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {team ? <Mail className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              {team ? `Invite to ${team.name}` : 'Create New Team'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            {!team && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50"
                    placeholder="e.g., Marketing Squad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50"
                    placeholder="What will this team achieve?"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-600" />
                  Member Assignments
                </label>
                <button 
                  type="button" 
                  onClick={addMemberRow}
                  className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Member
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.members.map((member, index) => (
                  <div key={index} className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3 relative">
                    {formData.members.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeMemberRow(index)}
                        className="absolute -top-2 -right-2 bg-white shadow-md p-1.5 rounded-full text-red-500 hover:text-red-600 border border-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Member's Email"
                          value={member.email}
                          onChange={(e) => updateMemberField(index, 'email', e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <ClipboardCheck className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Task (Optional)"
                          value={member.taskName}
                          onChange={(e) => updateMemberField(index, 'taskName', e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-100 rounded-xl text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div className="relative md:w-1/2">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="date"
                        value={member.dueDate}
                        onChange={(e) => updateMemberField(index, 'dueDate', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-100 rounded-xl text-sm outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!team && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-purple-600" />
                    Link Projects
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(true)}
                    className="text-xs font-bold text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200"
                  >
                    Browse Projects
                  </button>
                </div>
                
                {formData.projects.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {formData.projects.map(project => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-white border border-purple-50 rounded-xl shadow-sm">
                        <span className="text-sm font-medium text-gray-700 truncate">{project.name}</span>
                        <button type="button" onClick={() => removeProject(project.id)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="p-6 border-t bg-gray-50 flex gap-4">
            <Button onClick={onClose} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              {isSubmitting ? 'Processing...' : (team ? 'Invite Members' : 'Create Team')}
            </Button>
          </div>
        </div>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-4 border-b bg-purple-50 flex justify-between items-center">
              <h3 className="font-bold text-purple-800">Select Database Projects</h3>
              <X className="w-5 h-5 cursor-pointer text-purple-400" onClick={() => setShowProjectModal(false)} />
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {isLoadingProjects ? (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                  <p>Fetching your projects...</p>
                </div>
              ) : filteredAvailableProjects.length > 0 ? (
                filteredAvailableProjects.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addProject(p)}
                    className="p-3 hover:bg-purple-50 rounded-xl border border-transparent hover:border-purple-200 cursor-pointer flex justify-between items-center group transition-all"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[300px]">{p.description || 'No description'}</div>
                      <div className="mt-1">
                         <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                           {p.status}
                         </span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-purple-400 group-hover:text-purple-600" />
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No projects available to link.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-right">
              <Button onClick={() => setShowProjectModal(false)} className="bg-purple-600 text-white">Done</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InviteModal;