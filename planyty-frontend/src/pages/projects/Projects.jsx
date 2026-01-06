import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Plus, Search, Loader, AlertCircle, Calendar, Users, Clock, ChevronRight, RefreshCw, Wrench, Bug, Layers, CheckSquare } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  const displayStatus = project.correctedStatus || project.status;
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate main tasks and subtasks
  const mainTasks = project.task_count || project.taskCount || project.tasks_count || 0;
  const subtasks = project.subtask_count || 0;
  const totalTasks = mainTasks + subtasks;

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-800 truncate">{project.name}</h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{project.description || 'No description'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              displayStatus === 'completed' ? 'bg-green-100 text-green-800' :
              displayStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              displayStatus === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {displayStatus?.replace('_', ' ').toUpperCase()}
            </span>
            {project.needsStatusFix && (
              <span className="text-xs text-red-500 italic">Fixed from {project.status}</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-semibold">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Tasks and Subtasks Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm text-gray-700">
                <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                <span className="font-medium">Tasks:</span>
                <span className="ml-1 font-bold">{mainTasks}</span>
              </div>
              {subtasks > 0 && (
                <div className="flex items-center text-sm text-gray-700">
                  <Layers className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-medium">Subtasks:</span>
                  <span className="ml-1 font-bold">{subtasks}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Total: {totalTasks} items
              </div>
              {subtasks > 0 && (
                <div className="text-xs text-gray-500">
                  {Math.round((subtasks / totalTasks) * 100)}% subtasks
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(project.start_date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatDate(project.end_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Created by: </span>
            <span className="ml-1">{project.creator?.name || 'Unknown'}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-600" />
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [allProjects, setAllProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [syncing, setSyncing] = useState(false);
  const [tasksLoading, setTasksLoading] = useState({});
  const [projectTasksInfo, setProjectTasksInfo] = useState({});

  useEffect(() => {
    console.log('Projects component mounted, user:', user);
    fetchProjects();
  }, []);

  // Function to fetch subtask counts for each project
  const fetchProjectTasksInfo = async (projects) => {
    const tasksInfo = {};
    
    for (const project of projects) {
      if (project?.id) {
        try {
          setTasksLoading(prev => ({ ...prev, [project.id]: true }));
          const tasksRes = await api.get(`/projects/${project.id}/tasks`);
          const projectTasks = tasksRes.data || [];
          
          // Calculate subtask count
          const subtaskCount = projectTasks.reduce((sum, task) => 
            sum + (task.subtasks ? task.subtasks.length : 0), 0
          );
          
          tasksInfo[project.id] = {
            mainTasks: projectTasks.length,
            subtasks: subtaskCount,
            totalTasks: projectTasks.length + subtaskCount
          };
          
        } catch (error) {
          console.warn(`Could not fetch tasks for project ${project.id}:`, error.message);
          tasksInfo[project.id] = {
            mainTasks: project.task_count || 0,
            subtasks: 0,
            totalTasks: project.task_count || 0
          };
        } finally {
          setTasksLoading(prev => ({ ...prev, [project.id]: false }));
        }
      }
    }
    
    setProjectTasksInfo(tasksInfo);
    return tasksInfo;
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching projects...');
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('_t', Date.now());
      
      const queryString = params.toString();
      const url = `/projects${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching from URL:', url);
      
      const response = await api.get(url);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      const projectsData = response.data.projects || [];
      console.log(`Found ${projectsData.length} projects`);
      
      // Fetch tasks info for each project
      const tasksInfo = await fetchProjectTasksInfo(projectsData);
      
      // Add subtask counts to projects
      const projectsWithSubtaskInfo = projectsData.map(project => ({
        ...project,
        subtask_count: tasksInfo[project.id]?.subtasks || 0,
        total_tasks: tasksInfo[project.id]?.totalTasks || project.task_count || 0
      }));
      
      // Store ALL projects
      setAllProjects(projectsWithSubtaskInfo);
      
      // Apply frontend filtering AND sorting
      const filtered = filterAndSortProjectsLocally(projectsWithSubtaskInfo, statusFilter, searchTerm, sortBy);
      setDisplayedProjects(filtered);
      
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view projects.');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load projects');
      }
      
      setAllProjects([]);
      setDisplayedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Local filtering and sorting function
  const filterAndSortProjectsLocally = (projects, status, search, sort) => {
    let filtered = [...projects];
    
    // Filter by status - treat planned as in_progress
    if (status !== 'all') {
      filtered = filtered.filter(project => {
        const statusToUse = project.correctedStatus || project.status;
        
        // If filtering for in_progress, include both in_progress and planned
        if (status === 'in_progress') {
          return statusToUse === 'in_progress' || statusToUse === 'planned';
        }
        
        return statusToUse === status;
      });
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(project => 
        project.name?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort the results
    switch(sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'progress_high':
        filtered.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
      case 'progress_low':
        filtered.sort((a, b) => (a.progress || 0) - (b.progress || 0));
        break;
      case 'name_asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'tasks_high':
        filtered.sort((a, b) => (b.total_tasks || 0) - (a.total_tasks || 0));
        break;
      case 'tasks_low':
        filtered.sort((a, b) => (a.total_tasks || 0) - (b.total_tasks || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return filtered;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  // FIXED: Filter change now filters locally with sorting
  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    const filtered = filterAndSortProjectsLocally(allProjects, filter, searchTerm, sortBy);
    setDisplayedProjects(filtered);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    const filtered = filterAndSortProjectsLocally(allProjects, statusFilter, searchTerm, newSort);
    setDisplayedProjects(filtered);
  };

  const handleCreateProject = () => {
    navigate('/workspaces');
  };

  // FIXED: Calculate counts from ALL projects - group planned as in_progress
  const getStatusCounts = () => {
    const counts = {
      all: allProjects.length,
      in_progress: allProjects.filter(p => {
        const status = p.correctedStatus || p.status;
        return status === 'in_progress' || status === 'planned';
      }).length,
      completed: allProjects.filter(p => (p.correctedStatus || p.status) === 'completed').length,
    };
    
    // Calculate total tasks and subtasks across all projects
    const totalMainTasks = allProjects.reduce((sum, project) => 
      sum + (project.task_count || project.taskCount || project.tasks_count || 0), 0
    );
    
    const totalSubtasks = allProjects.reduce((sum, project) => 
      sum + (project.subtask_count || 0), 0
    );
    
    counts.totalTasks = totalMainTasks + totalSubtasks;
    counts.totalMainTasks = totalMainTasks;
    counts.totalSubtasks = totalSubtasks;
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EED5F0]/10 via-white to-[#A067A3]/10 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EED5F0]/10 via-white to-[#A067A3]/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">All Projects</h1>
              <p className="text-gray-600 text-lg">Manage and track all your projects in one place</p>
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{allProjects.length}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={fetchProjects}
                  className="px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-semibold flex items-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh
                </button>
                <button 
                  onClick={handleCreateProject}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold flex items-center shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">All Projects</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.totalTasks}</div>
            <div className="text-sm text-gray-600">
              <div>Total Tasks: {statusCounts.totalTasks}</div>
              <div className="text-xs text-gray-500">
                ({statusCounts.totalMainTasks} tasks + {statusCounts.totalSubtasks} subtasks)
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'in_progress', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      statusFilter === status 
                        ? status === 'all' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                          status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                          'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()} 
                    ({statusCounts[status] || 0})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="progress_high">Progress (High to Low)</option>
                <option value="progress_low">Progress (Low to High)</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="tasks_high">Total Tasks (High to Low)</option>
                <option value="tasks_low">Total Tasks (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {displayedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'No projects found' 
                : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Create your first project to get started!'}
            </p>
            <button 
              onClick={handleCreateProject}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;