import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import WorkspaceCard from '../../components/workspaces/WorkspaceCard';
import WorkspaceForm from '../../components/workspaces/WorkspaceForm';
import Button from '../../components/ui/Button';
import { Plus, Search, Grid3x3, Loader2, AlertCircle } from 'lucide-react';

const Workspaces = () => {
  const { user, logout } = useAuth();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('planyty_token');
      console.log("📡 Fetching workspaces with token:", token ? "Token exists" : "No token");
      
      if (!token) {
        setError("No authentication token found");
        logout();
        return;
      }
      
      // Clean token
      const cleanToken = token.replace(/"/g, '').trim();
      
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        }
      });
      
      console.log("📊 Response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("🔐 Unauthorized - token might be invalid");
          setError("Session expired. Please login again.");
          logout();
          return;
        }
        const errorData = await response.json();
        console.log("❌ Error response:", errorData);
        throw new Error(errorData.message || errorData.error || `Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Workspaces data received:", data);
      
      if (Array.isArray(data)) {
        setWorkspaces(data);
      } else {
        console.warn("⚠️ Unexpected response format:", data);
        setWorkspaces([]);
      }
    } catch (err) {
      console.error("❌ Fetch workspaces error:", err);
      setError(err.message || "Server Error");
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (workspaceData) => {
    try {
      const token = localStorage.getItem('planyty_token');
      if (!token) {
        alert("No authentication token found. Please login again.");
        logout();
        return;
      }
      
      console.log("🆕 Creating workspace with data:", workspaceData);
      
      // Clean token
      const cleanToken = token.replace(/"/g, '').trim();
      
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`
        },
        body: JSON.stringify(workspaceData)
      });
      
      console.log("📊 Create workspace response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ Create workspace error:", errorData);
        
        if (response.status === 401) {
          alert("Session expired. Please login again.");
          logout();
          return;
        }
        throw new Error(errorData.error || errorData.message || 'Failed to create workspace');
      }
      
      const data = await response.json();
      console.log("✅ Workspace created successfully:", data);
      
      // Success - refresh the list
      await fetchWorkspaces();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("❌ Create workspace error:", err);
      alert(err.message || "Failed to create workspace");
    }
  };

  const filteredWorkspaces = (Array.isArray(workspaces) ? workspaces : [])
    .filter(workspace => 
      workspace && workspace.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Grid3x3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Workspaces</h1>
          </div>
          
          {user?.role === 'team_lead' && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-1" /> Create Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <Search className="w-5 h-5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-purple-100 rounded-xl focus:border-purple-500 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-2" />
            <p className="text-purple-800 font-medium">Fetching your workspaces...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center max-w-lg mx-auto mt-10">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-red-800 font-bold text-lg mb-1">Connection Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchWorkspaces} 
              className="bg-red-100 text-red-700 px-6 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredWorkspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-purple-200">
            <p className="text-gray-500 italic">
              {searchTerm ? `No workspaces found matching "${searchTerm}"` : "No workspaces found. Create your first workspace!"}
            </p>
            {user?.role === 'team_lead' && !searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Create Your First Workspace
              </button>
            )}
          </div>
        )}
      </div>
      <WorkspaceForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkspace}
      />
    </div>
  );
};

export default Workspaces;