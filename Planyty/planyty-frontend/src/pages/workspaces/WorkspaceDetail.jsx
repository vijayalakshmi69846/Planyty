import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { 
  ArrowLeft, Plus, Users, Briefcase, CheckCircle, 
  Clock, Loader2, UserPlus, X, Trash2, Edit2, Shield 
} from 'lucide-react';
import Button from '../../components/ui/Button';
import toast, { Toaster } from 'react-hot-toast';

// --- Sub-Components ---

const StatCard = ({ title, value, icon: Icon, color, className, onClick }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <div onClick={onClick} className={`p-6 rounded-2xl border bg-white flex items-center gap-4 shadow-sm cursor-default ${colors[color] || colors.blue} ${className}`}>
      <div className="p-3.5 rounded-xl bg-white shadow-sm">
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
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><Briefcase size={22}/></div>
        <div className="flex gap-1">
          {canManage && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title="Delete Project"
            >
              <Trash2 size={18}/>
            </button>
          )}
          {canEdit && (
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
              <Edit2 size={18}/>
            </button>
          )}
        </div>
      </div>
      <h3 className="font-bold text-lg text-gray-800 mb-1">{project.name}</h3>
      <p className="text-sm text-gray-500 mb-6 line-clamp-2">{project.description || 'No description'}</p>
      
      <div className="flex justify-between text-xs font-semibold mb-2">
        <span className="text-gray-400">PROGRESS</span>
        <span className="text-gray-800">{project.progress || 0}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(project.progress || 0)}`} 
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
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  
  const [projectForm, setProjectForm] = useState({ id: null, name: '', description: '', progress: 0 });
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const loggedInUser = useMemo(() => {
    const userStr = localStorage.getItem('planyty_user'); 
    try { return userStr ? JSON.parse(userStr) : null; } catch (e) { return null; }
  }, []);

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

  const allMembersList = useMemo(() => {
    if (!data) return [];
    const uniqueMap = new Map();
    (data.teams || []).forEach(team => {
      (team.members || []).forEach(m => {
        const emailKey = m.email.toLowerCase().trim();
        uniqueMap.set(emailKey, {
          id: m.id, email: m.email, name: m.name,
          status: Number(m.id) === Number(data.created_by) ? 'owner' : 'active',
          role: m.TeamMember?.role || 'member'
        });
      });
    });
    (data.invitations || []).forEach(inv => {
      const emailKey = inv.email.toLowerCase().trim();
      if (inv.status === 'pending' && !uniqueMap.has(emailKey)) {
        uniqueMap.set(emailKey, { id: inv.id, email: inv.email, name: 'Pending Invite', status: 'pending', role: inv.role });
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.status === 'owner' ? -1 : b.status === 'owner' ? 1 : 0);
  }, [data]);

  const canManage = useMemo(() => {
    if (!data || !loggedInUser) return false;
    return Number(data.created_by) === Number(loggedInUser.id) || loggedInUser.role === 'admin';
  }, [data, loggedInUser]);

  const isWorkspaceMember = useMemo(() => {
    return allMembersList.some(m => Number(m.id) === Number(loggedInUser?.id) && m.status !== 'pending');
  }, [allMembersList, loggedInUser]);

  const canUpdateProgress = useMemo(() => canManage || isWorkspaceMember, [canManage, isWorkspaceMember]);

  const calculatedAvgProgress = useMemo(() => {
    if (!data?.Projects || data.Projects.length === 0) return 0;
    const total = data.Projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0);
    return Math.round(total / data.Projects.length);
  }, [data?.Projects]);

  // --- HANDLERS ---

  const removeMember = async (member) => {
    const confirmMsg = member.status === 'pending' 
      ? `Cancel invitation for ${member.email}?` 
      : `Remove ${member.name || member.email} from workspace?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (member.status === 'pending') {
        await api.delete(`/invitations/${member.id}`);
      } else {
        await api.delete(`/workspaces/${workspaceId}/members/${member.id}`);
      }
      toast.success("Member updated");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Delete project: "${projectName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success("Project deleted");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete project");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`CRITICAL: Delete workspace "${data?.name}"? All data will be lost.`)) return;
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      toast.success("Workspace deleted");
      navigate('/workspaces');
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete workspace");
    }
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
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send invitation");
    } finally { setIsInviting(false); }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (projectForm.id) {
        await api.put(`/projects/${projectForm.id}`, projectForm);
        toast.success("Project updated!");
      } else {
        await api.post('/projects', { ...projectForm, workspace_id: workspaceId });
        toast.success("Project created!");
      }
      setIsProjectModalOpen(false);
      loadData();
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8F9FD]">
      <Loader2 className="animate-spin text-purple-600 w-12 h-12" />
    </div>
  );

  return (
    <div className="p-6 bg-[#F8F9FD] min-h-screen">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/workspaces" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{data?.name}</h1>
              {canManage && (
                <div className="flex gap-1 ml-2">
                  <button onClick={() => setIsEditWorkspaceOpen(true)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                      <Edit2 size={18}/>
                  </button>
                  <button onClick={handleDeleteWorkspace} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={18}/>
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-sm">{data?.description || 'No description available'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {canManage && (
            <>
              <form onSubmit={handleInviteMember} className="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-purple-200">
                <div className="pl-3 text-gray-400"><UserPlus size={18} /></div>
                <input 
                  type="email" 
                  placeholder="Invite by email..." 
                  className="px-3 py-2 outline-none text-sm w-48"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={isInviting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-bold">
                  {isInviting ? <Loader2 size={16} className="animate-spin" /> : 'Invite'}
                </button>
              </form>
              <Button onClick={() => { setProjectForm({id:null, name:'', description:'', progress:0}); setIsProjectModalOpen(true); }} className="bg-purple-600 text-white">
                <Plus size={18} className="mr-2"/> New Project
              </Button>
            </>
          )}
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Projects" value={data?.Projects?.length || 0} icon={Briefcase} color="blue" />
        <StatCard title="Active Tasks" value={data?.activeTasksCount || 0} icon={Clock} color="green" />
        <StatCard title="Avg Progress" value={`${calculatedAvgProgress}%`} icon={CheckCircle} color="orange" />
        <StatCard 
          title="Team Members" 
          value={allMembersList.length} 
          icon={Users} 
          color="rose" 
          onClick={() => setIsMemberModalOpen(true)}
          className="cursor-pointer hover:border-rose-300 transition-all" 
        />
      </div>

      {/* PROJECTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.Projects?.map(project => (
            <ProjectItem 
                key={project.id} 
                project={project} 
                canEdit={canUpdateProgress}
                canManage={canManage}
                onEdit={() => { setProjectForm({ ...project, id: project.id }); setIsProjectModalOpen(true); }} 
                onDelete={() => handleDeleteProject(project.id, project.name)}
            />
        ))}
      </div>

      {/* MEMBERS MODAL */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Workspace Members</h2>
              <X className="cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setIsMemberModalOpen(false)} />
            </div>
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
              {allMembersList.map(m => (
                <div key={m.email} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${m.status === 'owner' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>
                      {m.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {m.name || m.email.split('@')[0]} 
                        {m.status === 'owner' && <span className="ml-2 text-[10px] bg-amber-200 px-2 py-0.5 rounded text-amber-700 font-bold uppercase">Owner</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.email} {m.status === 'pending' && <span className="text-orange-500 italic ml-1">(Pending)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canManage && m.status !== 'owner' && m.email !== loggedInUser?.email && (
                      <button onClick={() => removeMember(m)} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT WORKSPACE MODAL */}
      {isEditWorkspaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleUpdateWorkspace} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Edit Workspace</h2>
            <div className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Name" value={workspaceForm.name} onChange={e => setWorkspaceForm({...workspaceForm, name: e.target.value})} required />
              <textarea className="w-full p-3 border rounded-xl h-24" placeholder="Description" value={workspaceForm.description} onChange={e => setWorkspaceForm({...workspaceForm, description: e.target.value})} />
            </div>
            <div className="flex gap-3 mt-6">
              <Button type="button" onClick={() => setIsEditWorkspaceOpen(false)} className="flex-1 bg-gray-100 text-gray-700">Cancel</Button>
              <Button type="submit" className="flex-1 bg-purple-600 text-white">Save</Button>
            </div>
          </form>
        </div>
      )}

      {/* PROJECT FORM MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleProjectSubmit} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{projectForm.id ? 'Edit Project' : 'New Project'}</h2>
            <div className="space-y-4">
              <input className="w-full p-3 border rounded-xl" placeholder="Project Name" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} disabled={!canManage} required />
              <textarea className="w-full p-3 border rounded-xl h-24" placeholder="Description" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} disabled={!canManage} />
              {projectForm.id && (
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <div className="flex justify-between mb-2"><label className="text-sm font-semibold">Progress</label><span className="text-purple-600 font-bold">{projectForm.progress}%</span></div>
                  <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" min="0" max="100" value={projectForm.progress} onChange={e => setProjectForm({...projectForm, progress: parseInt(e.target.value)})} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700">Cancel</Button>
              <Button type="submit" className="flex-1 bg-purple-600 text-white">Save</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;