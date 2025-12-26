import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { 
  ArrowLeft, Plus, Users, Briefcase, CheckCircle, 
  Clock, Loader2, UserPlus, X, Trash2, Edit2, Shield, AlertTriangle, Search
} from 'lucide-react';
import Button from '../../components/ui/Button';
import toast, { Toaster } from 'react-hot-toast';

// --- Global CSS for Custom Scrollbar ---
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c084fc;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a855f7;
  }
`;

// --- Sub-Components ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button 
            onClick={onClose}
            className="flex-1 py-5 font-bold text-gray-400 hover:bg-gray-50 transition-colors border-r border-gray-100"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-5 font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, className, onClick }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:shadow-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300 hover:shadow-orange-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300 hover:shadow-rose-100"
  };
  return (
    <div 
      onClick={onClick} 
      className={`p-6 rounded-2xl border bg-white flex items-center gap-4 shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${colors[color] || colors.blue} ${className}`}
    >
      <div className="p-3.5 rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110">
        <Icon size={26} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const ProjectItem = ({ project, onEdit, onDelete, canEdit, canManage }) => {
  const getProgressColor = (p) => {
    if (p < 30) return 'bg-rose-500';
    if (p < 70) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:border-purple-200 hover:scale-[1.02] transition-all duration-300 group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
          <Briefcase size={22}/>
        </div>
        <div className="flex gap-1">
          {/* ONLY ADMIN/TEAM_LEAD SEES DELETE */}
          {canManage && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 active:scale-90"
              title="Delete Project"
            >
              <Trash2 size={18}/>
            </button>
          )}
          {canEdit && (
            <button 
              onClick={onEdit} 
              className="p-2 text-gray-300 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 active:scale-90"
              title="Edit Project"
            >
              <Edit2 size={18}/>
            </button>
          )}
        </div>
      </div>
      <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">{project.name}</h3>
      <p className="text-sm text-gray-500 mb-6 line-clamp-2">{project.description || 'No description'}</p>
      
      <div className="flex justify-between text-xs font-semibold mb-2">
        <span className="text-gray-400">PROGRESS</span>
        <span className="text-gray-800">{project.progress || 0}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(project.progress || 0)}`} 
          style={{ width: `${project.progress || 0}%` }} 
        />
      </div>
    </div>
  );
};

// --- Main Component ---

const WorkspaceDetail = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  
  // Custom Confirmation State
  const [confirmState, setConfirmState] = useState({ 
    isOpen: false, 
    type: '', 
    targetId: null, 
    title: '', 
    message: '', 
    loading: false 
  });
  
  const [projectForm, setProjectForm] = useState({ id: null, name: '', description: '', progress: 0 });
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const loggedInUser = useMemo(() => {
    const userStr = localStorage.getItem('planyty_user'); 
    try { return userStr ? JSON.parse(userStr) : null; } catch (e) { return null; }
  }, []);

  // --- PERMISSION LOGIC ---
  const canManage = useMemo(() => {
    if (!data || !loggedInUser) return false;
    // Normalize role to lowercase for safety
    const role = (loggedInUser.role || '').toLowerCase();
    const isOwner = Number(data.created_by) === Number(loggedInUser.id);
    const isPrivileged = role === 'admin' || role === 'team_lead';
    
    return isOwner || isPrivileged;
  }, [data, loggedInUser]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${workspaceId}`);
      setData(res.data);
      setWorkspaceForm({ name: res.data?.name || '', description: res.data?.description || '' });
    } catch (err) { 
        toast.error("Error loading workspace details");
    } finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { if (workspaceId) loadData(); }, [workspaceId, loadData]);

  const filteredProjects = useMemo(() => {
    if (!data?.Projects) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return data.Projects;
    return data.Projects.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
  }, [data?.Projects, searchQuery]);

  const allMembersList = useMemo(() => {
    if (!data) return [];
    const uniqueMap = new Map();
    if (data.creator) {
      const ownerEmail = data.creator.email.toLowerCase().trim();
      uniqueMap.set(ownerEmail, { id: data.creator.id, email: data.creator.email, name: data.creator.name, status: 'owner', role: 'admin' });
    }
    (data.teams || []).forEach(team => {
      (team.members || []).forEach(m => {
        const emailKey = m.email.toLowerCase().trim();
        if (!uniqueMap.has(emailKey)) {
          uniqueMap.set(emailKey, { id: m.id, email: m.email, name: m.name, status: 'active', role: m.TeamMember?.role || 'member' });
        }
      });
    });
    (data.invitations || []).forEach(inv => {
      const emailKey = inv.email.toLowerCase().trim();
      if (inv.status === 'pending' && !uniqueMap.has(emailKey)) {
        uniqueMap.set(emailKey, { id: inv.id, email: inv.email, name: 'Pending Invite', status: 'pending', role: inv.role });
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.status === 'owner') return -1;
      if (a.status === 'active' && b.status === 'pending') return -1;
      return 0;
    });
  }, [data]);

  const isWorkspaceMember = useMemo(() => {
    if (!loggedInUser) return false;
    return allMembersList.some(m => 
      (m.id && Number(m.id) === Number(loggedInUser.id)) || 
      (m.email && m.email.toLowerCase() === loggedInUser.email?.toLowerCase())
    );
  }, [allMembersList, loggedInUser]);

  // Members can ONLY update progress
  const canUpdateProgress = useMemo(() => canManage || isWorkspaceMember, [canManage, isWorkspaceMember]);

  const calculatedAvgProgress = useMemo(() => {
    if (!data?.Projects || data.Projects.length === 0) return 0;
    const total = data.Projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0);
    return Math.round(total / data.Projects.length);
  }, [data?.Projects]);

  // --- HANDLERS ---
  const handleConfirmDelete = async () => {
    const { type, targetId } = confirmState;
    setConfirmState(prev => ({ ...prev, loading: true }));
    try {
      if (type === 'project') await api.delete(`/projects/${targetId}`);
      else if (type === 'workspace') { await api.delete(`/workspaces/${workspaceId}`); navigate('/workspaces'); return; }
      else if (type === 'invite') await api.delete(`/invitations/${targetId}`);
      else if (type === 'member') await api.delete(`/workspaces/${workspaceId}/members/${targetId}`);
      toast.success("Deleted successfully");
      loadData();
    } catch (err) { toast.error("Action failed"); } 
    finally { setConfirmState({ isOpen: false, type: '', targetId: null, title: '', message: '', loading: false }); }
  };

  const openDeleteProject = (id, name) => setConfirmState({ isOpen: true, type: 'project', targetId: id, title: 'Delete Project', message: `Are you sure you want to delete "${name}"?`, loading: false });
  const openDeleteWorkspace = () => setConfirmState({ isOpen: true, type: 'workspace', targetId: workspaceId, title: 'Delete Workspace', message: `All data in "${data?.name}" will be lost.`, loading: false });
  const openRemoveMember = (member) => {
    const isPending = member.status === 'pending';
    setConfirmState({ isOpen: true, type: isPending ? 'invite' : 'member', targetId: member.id, title: isPending ? 'Cancel Invite' : 'Remove Member', message: `Remove ${member.email}?`, loading: false });
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setIsInviting(true);
      await api.post('/invitations', { email: inviteEmail.trim().toLowerCase(), workspaceId, role: 'member' });
      setInviteEmail('');
      loadData();
      toast.success("Invitation sent");
    } catch (err) { toast.error("Failed to send invitation"); } 
    finally { setIsInviting(false); }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: projectForm.name, description: projectForm.description, progress: projectForm.progress, workspace_id: workspaceId, status: projectForm.status || 'planned' };
      if (projectForm.id) await api.put(`/projects/${projectForm.id}`, payload);
      else await api.post('/projects', payload);
      setIsProjectModalOpen(false);
      loadData();
      toast.success(projectForm.id ? "Project updated!" : "Project created!");
    } catch (err) { toast.error("Error saving project"); }
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/workspaces/${workspaceId}`, workspaceForm);
      toast.success("Workspace updated!");
      setIsEditWorkspaceOpen(false);
      loadData();
    } catch (err) { toast.error("Update failed"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F8F9FD]"><Loader2 className="animate-spin text-purple-600 w-12 h-12" /></div>;

  return (
    <div className="p-6 bg-[#F8F9FD] min-h-screen">
      <style>{scrollbarStyles}</style>
      <Toaster position="top-right" />
      <ConfirmModal isOpen={confirmState.isOpen} onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} onConfirm={handleConfirmDelete} {...confirmState} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/workspaces" className="p-2 bg-white rounded-full shadow-sm hover:text-purple-600 transition-all"><ArrowLeft /></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">{data?.name}</h1>
              {canManage && (
                <div className="flex gap-1 ml-2">
                  <button onClick={() => setIsEditWorkspaceOpen(true)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-all"><Edit2 size={18}/></button>
                  <button onClick={openDeleteWorkspace} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"><Trash2 size={18}/></button>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-sm font-medium">{data?.description || 'No description available'}</p>
          </div>
        </div>

        {/* ONLY ADMIN/TEAM_LEAD CAN INVITE OR CREATE PROJECT */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {canManage && (
            <>
              <form onSubmit={handleInviteMember} className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="pl-3 text-gray-400"><UserPlus size={18} /></div>
                <input type="email" placeholder="Invite by email..." className="px-3 py-2.5 outline-none text-sm w-48 font-medium" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                <button type="submit" disabled={isInviting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 text-sm font-bold transition-colors">
                  {isInviting ? <Loader2 size={16} className="animate-spin" /> : 'Invite'}
                </button>
              </form>
              <Button onClick={() => { setProjectForm({id:null, name:'', description:'', progress:0}); setIsProjectModalOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 transition-all">
                <Plus size={18} className="mr-2"/> New Project
              </Button>
            </>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Projects" value={data?.Projects?.length || 0} icon={Briefcase} color="blue" />
        <StatCard title="Active Tasks" value={data?.activeTasksCount || 0} icon={Clock} color="green" />
        <StatCard title="Avg Progress" value={`${calculatedAvgProgress}%`} icon={CheckCircle} color="orange" />
        <StatCard title="Team Members" value={allMembersList.length} icon={Users} color="rose" onClick={() => setIsMemberModalOpen(true)} className="hover:scale-105" />
      </div>

      {/* SEARCH */}
      <div className="mb-8 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400"><Search size={20} /></div>
        <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-medium" />
      </div>

      {/* PROJECTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
            <ProjectItem 
                key={project.id} 
                project={project} 
                canEdit={canUpdateProgress} // Members can edit (update progress)
                canManage={canManage}       // Only Admin/TeamLead can delete
                onEdit={() => { setProjectForm({ ...project, id: project.id }); setIsProjectModalOpen(true); }} 
                onDelete={() => openDeleteProject(project.id, project.name)}
            />
        ))}
      </div>

      {/* MEMBERS MODAL */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800">Team Access</h2>
              <button onClick={() => setIsMemberModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {allMembersList.map(m => (
                <div key={m.email} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-white hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${m.status === 'owner' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>{m.email[0].toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-gray-800">{m.name || m.email.split('@')[0]} {m.status === 'owner' && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">Owner</span>}</p>
                      <p className="text-xs font-medium text-gray-400">{m.email} {m.status === 'pending' && <span className="text-orange-500 font-bold ml-1">Waiting...</span>}</p>
                    </div>
                  </div>
                  {/* ONLY ADMIN/TEAM_LEAD CAN REMOVE OTHERS */}
                  {canManage && m.status !== 'owner' && m.email !== loggedInUser?.email && (
                    <button onClick={() => openRemoveMember(m)} className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROJECT FORM MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <form onSubmit={handleProjectSubmit} className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-gray-800 mb-6">{projectForm.id ? 'Update Project' : 'New Project'}</h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">Project Name</label>
                <input 
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-2xl focus:bg-white focus:border-purple-300 outline-none transition-all font-bold disabled:opacity-70" 
                  placeholder="Project Name" 
                  value={projectForm.name} 
                  onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                  disabled={!canManage} // MEMBER CANNOT CHANGE NAME
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">Description</label>
                <textarea 
                  className="w-full p-4 border border-gray-100 bg-gray-50 rounded-2xl focus:bg-white focus:border-purple-300 outline-none h-24 disabled:opacity-70" 
                  placeholder="Description" 
                  value={projectForm.description} 
                  onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                  disabled={!canManage} // MEMBER CANNOT CHANGE DESCRIPTION
                />
              </div>

              {projectForm.id && (
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 space-y-4">
                  <div className="flex justify-between items-center"><label className="text-sm font-black text-purple-700 uppercase">Completion Rate</label><span className="text-purple-600 font-black text-xl">{projectForm.progress}%</span></div>
                  {/* MEMBER CAN UPDATE PROGRESS SLIDER */}
                  <input type="range" className="w-full h-2.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" min="0" max="100" value={projectForm.progress} onChange={e => setProjectForm({...projectForm, progress: parseInt(e.target.value)})} disabled={!canUpdateProgress} />
                  <p className="text-[10px] text-purple-400 font-bold text-center uppercase tracking-widest">{canUpdateProgress ? 'Slide to update status' : 'View only mode'}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <Button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 py-3.5 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700">Cancel</Button>
              <Button type="submit" className="flex-1 py-3.5 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700">
                {projectForm.id ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;