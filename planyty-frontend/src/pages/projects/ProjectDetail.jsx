import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Calendar, User, Loader, AlertCircle, CheckCircle, PlayCircle, PauseCircle, Clock, BarChart3, Users as UsersIcon, Target, RefreshCw, Layers, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasksWithSubtasks, setTasksWithSubtasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const calculateTaskProgress = (task) => {
    if (task.progress !== undefined && task.progress !== null) {
      return task.progress;
    }
    
    if (task.status === 'completed') {
      return 100;
    } else if (task.status === 'in progress' || task.status === 'in_progress') {
      return 50;
    }
    return 0;
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Fetch tasks with subtasks for this project
  const fetchTasksWithSubtasks = async (projectId) => {
    try {
      console.log(`Fetching tasks with subtasks for project ${projectId}...`);
      const response = await api.get(`/projects/${projectId}/tasks`);
      const tasks = response.data || [];
      console.log(`Found ${tasks.length} tasks with subtasks`);
      
      // Log the structure of first task to check subtasks
      if (tasks.length > 0) {
        console.log('Sample task structure:', {
          id: tasks[0].id,
          title: tasks[0].title,
          subtasks: tasks[0].subtasks,
          subtasksCount: tasks[0].subtasks?.length || 0
        });
      }
      
      return tasks;
    } catch (error) {
      console.error('Failed to fetch tasks with subtasks:', error);
      return [];
    }
  };

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await api.get(`/projects/${id}?_t=${Date.now()}`);
      
      if (!projectRes.data || !projectRes.data.project) {
        throw new Error('No project data received');
      }
      
      const projectData = projectRes.data.project;
      console.log('Project data fetched:', projectData);
      
      // Fetch tasks with subtasks separately
      const tasksWithSubtasksData = await fetchTasksWithSubtasks(id);
      
      // Process tasks to include subtasks and calculate progress
      let totalMainTasks = 0;
      let totalSubtasks = 0;
      let completedMainTasks = 0;
      let completedSubtasks = 0;
      
      const processedTasks = tasksWithSubtasksData.map(task => {
        totalMainTasks += 1;
        
        const taskProgress = calculateTaskProgress(task);
        const subtasks = task.subtasks || [];
        const subtaskCount = subtasks.length;
        
        // Calculate subtask completion
        const completedSubtaskCount = subtasks.filter(subtask => 
          subtask.status === 'completed' || subtask.completed
        ).length;
        
        totalSubtasks += subtaskCount;
        completedSubtasks += completedSubtaskCount;
        
        if (task.status === 'completed' || taskProgress >= 100) {
          completedMainTasks += 1;
        }
        
        return {
          ...task,
          progress: taskProgress,
          subtasks: subtasks,
          subtaskCount: subtaskCount,
          completedSubtasks: completedSubtaskCount,
          subtaskProgress: subtaskCount > 0 ? Math.round((completedSubtaskCount / subtaskCount) * 100) : 0
        };
      });
      
      // Calculate overall progress including subtasks
      const totalTasksWithSubtasks = totalMainTasks + totalSubtasks;
      const totalCompleted = completedMainTasks + completedSubtasks;
      const overallProgress = totalTasksWithSubtasks > 0 
        ? Math.round((totalCompleted / totalTasksWithSubtasks) * 100) 
        : (projectData.progress || 0);
      
      // Use tasks from project data as fallback if no tasks with subtasks were found
      const displayTasks = processedTasks.length > 0 ? processedTasks : (projectData.tasks || []);
      
      // Calculate correct project status
      const hasTasks = displayTasks.length > 0;
      const isCompleted = projectData.status === 'completed';
      const isOnHold = projectData.status === 'on_hold';
      
      let correctedStatus = projectData.status;
      if (hasTasks && !isCompleted && !isOnHold) {
        correctedStatus = 'in_progress';
      }
      
      // Update project data
      const updatedProjectData = {
        ...projectData,
        tasks: displayTasks,
        correctedStatus,
        displayStatus: correctedStatus,
        totalMainTasks: processedTasks.length > 0 ? totalMainTasks : (projectData.tasks?.length || 0),
        totalSubtasks: processedTasks.length > 0 ? totalSubtasks : 0,
        completedMainTasks: processedTasks.length > 0 ? completedMainTasks : 0,
        completedSubtasks: processedTasks.length > 0 ? completedSubtasks : 0,
        overallProgress
      };
      
      setProject(updatedProjectData);
      setTasksWithSubtasks(processedTasks);
      
      // Calculate comprehensive stats
      const stats = {
        total_tasks: displayTasks.length,
        total_items: displayTasks.length + totalSubtasks,
        todo_tasks: displayTasks.filter(t => t.status === 'todo' || t.status === 'pending').length,
        in_progress_tasks: displayTasks.filter(t => t.status === 'in progress' || t.status === 'in_progress').length,
        completed_tasks: completedMainTasks,
        completed_items: totalCompleted,
        priority_distribution: {
          low: displayTasks.filter(t => t.priority === 'Low' || t.priority === 'low').length,
          medium: displayTasks.filter(t => t.priority === 'Medium' || t.priority === 'medium').length,
          high: displayTasks.filter(t => t.priority === 'High' || t.priority === 'high').length
        },
        subtask_stats: {
          total: totalSubtasks,
          completed: completedSubtasks,
          pending: totalSubtasks - completedSubtasks
        }
      };
      
      console.log('Calculated stats:', stats);
      setStats(stats);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchProjectDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskProgressUpdate = async (taskId, progress) => {
    try {
      await api.put(`/tasks/${taskId}`, { progress });
      fetchProjectDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update task progress:', error);
    }
  };

  const handleSubtaskStatusUpdate = async (subtaskId, status) => {
    try {
      await api.put(`/subtasks/${subtaskId}`, { status });
      fetchProjectDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update subtask status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': 
      case 'done': 
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': 
      case 'in progress': 
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'on_hold': 
      case 'on hold': 
        return <PauseCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-purple-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': 
      case 'done': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': 
      case 'in progress': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold': 
      case 'on hold': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const syncProjectStatus = async () => {
    try {
      setSyncing(true);
      await api.put(`/projects/${id}/sync-status`);
      alert('Project status synced successfully!');
      fetchProjectDetails(); // Refresh the data
    } catch (error) {
      console.error('Failed to sync project status:', error);
      alert('Failed to sync project status');
    } finally {
      setSyncing(false);
    }
  };

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const getDueDateColor = (dueDate) => {
    const daysRemaining = calculateDaysRemaining(dueDate);
    if (daysRemaining === null) return 'text-gray-500';
    if (daysRemaining < 0) return 'text-red-500';
    if (daysRemaining < 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getSubtaskStatusIcon = (subtask) => {
    if (subtask.status === 'completed' || subtask.completed) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    if (subtask.status === 'in_progress' || subtask.status === 'in progress') {
      return <PlayCircle className="w-3 h-3 text-blue-500" />;
    }
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  // Debug function
  const debugData = () => {
    console.log('Project Data:', project);
    console.log('Tasks with subtasks:', tasksWithSubtasks);
    console.log('Tasks length:', project?.tasks?.length);
    console.log('First task subtasks:', project?.tasks?.[0]?.subtasks);
    console.log('Stats:', stats);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Project</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Project Not Found</h3>
            <p className="text-yellow-600 mb-6">The requested project could not be found.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
      <button onClick={debugData} className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded z-10 text-xs">
        Debug Data
      </button>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
              <div className="flex items-center flex-wrap gap-4">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="font-semibold">
                    {project.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </span>
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span>Created by: {project.creator?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                  <span>{project.totalMainTasks || 0} tasks</span>
                  {project.totalSubtasks > 0 && (
                    <>
                      <Layers className="w-4 h-4 text-blue-600 ml-2" />
                      <span>{project.totalSubtasks || 0} subtasks</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{project.overallProgress || 0}%</div>
                <div className="text-sm text-gray-600">
                  Overall Progress 
                  <span className="block text-xs">
                    ({project.completedMainTasks}/{project.totalMainTasks} tasks • {project.completedSubtasks}/{project.totalSubtasks} subtasks)
                  </span>
                </div>
              </div>
              <div className="w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${project.overallProgress || 0}, 100`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {project.description || 'No description provided.'}
              </p>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3 text-purple-500" />
                    <div>
                      <div className="text-sm font-medium">Start Date</div>
                      <div className="font-semibold text-gray-800">{formatDate(project.start_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium">Created At</div>
                      <div className="font-semibold text-gray-800">{formatDateTime(project.created_at)}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3 text-pink-500" />
                    <div>
                      <div className="text-sm font-medium">End Date</div>
                      <div className="font-semibold text-gray-800">{formatDate(project.end_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3 text-green-500" />
                    <div>
                      <div className="text-sm font-medium">Last Updated</div>
                      <div className="font-semibold text-gray-800">{formatDateTime(project.updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Tasks & Subtasks ({stats?.total_items || 0})
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckSquare className="w-4 h-4 mr-1 text-purple-600" />
                      <span>{project.totalMainTasks || 0} main tasks</span>
                    </div>
                    {project.totalSubtasks > 0 && (
                      <div className="flex items-center">
                        <Layers className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{project.totalSubtasks || 0} subtasks</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/workspaces/${project.workspace_id}/projects/${project.id}/tasks/create`)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-sm"
                >
                  + Add Task
                </button>
              </div>
              
              {project.tasks && project.tasks.length > 0 ? (
                <div className="space-y-4">
                  {project.tasks.map(task => {
                    const taskProgress = task.progress || calculateTaskProgress(task);
                    const isExpanded = expandedTasks[task.id];
                    const subtaskCount = task.subtasks?.length || 0;
                    const completedSubtasks = task.subtasks?.filter(subtask => 
                      subtask.status === 'completed' || subtask.completed
                    ).length || 0;
                    const subtaskProgress = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0;
                    
                    return (
                      <div key={task.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {subtaskCount > 0 && (
                                  <button 
                                    onClick={() => toggleTaskExpansion(task.id)}
                                    className="flex items-center text-gray-500 hover:text-gray-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <h4 className="font-semibold text-gray-800">{task.title}</h4>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600 mb-2 ml-6">
                                {task.assignee && (
                                  <>
                                    <UsersIcon className="w-3 h-3 mr-1" />
                                    <span className="mr-4">{task.assignee.name}</span>
                                  </>
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  task.priority === 'High' || task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'Medium' || task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {(task.priority || 'MEDIUM').toUpperCase()}
                                </span>
                                {subtaskCount > 0 && (
                                  <span className="ml-3 flex items-center text-xs text-blue-600">
                                    <Layers className="w-3 h-3 mr-1" />
                                    {completedSubtasks}/{subtaskCount} subtasks
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                task.status === 'completed' || task.status === 'done' ? 'bg-green-100 text-green-800' :
                                task.status === 'in progress' || task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {(task.status || 'TODO')?.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Task Progress */}
                          <div className="mb-3 ml-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Task Progress</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{taskProgress}%</span>
                                {user?.id === task.assigned_to && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleTaskStatusUpdate(task.id, 'in progress')}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                      Start
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleTaskStatusUpdate(task.id, 'completed');
                                        handleTaskProgressUpdate(task.id, 100);
                                      }}
                                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      Complete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${getProgressColor(taskProgress)}`}
                                style={{ width: `${taskProgress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Task Timeline */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>Created: {formatDate(task.created_at)}</span>
                            </div>
                            {task.due_date && (
                              <div className={`flex items-center ${getDueDateColor(task.due_date)}`}>
                                <Clock className="w-3 h-3 mr-1" />
                                <span>Due: {formatDate(task.due_date)}</span>
                                {calculateDaysRemaining(task.due_date) !== null && (
                                  <span className="ml-1">
                                    ({calculateDaysRemaining(task.due_date) > 0 
                                      ? `${calculateDaysRemaining(task.due_date)} days left` 
                                      : `${Math.abs(calculateDaysRemaining(task.due_date))} days overdue`})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Subtasks Section */}
                        {isExpanded && subtaskCount > 0 && (
                          <div className="bg-blue-50 border-t border-blue-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-blue-800 flex items-center">
                                <Layers className="w-4 h-4 mr-2" />
                                Subtasks ({completedSubtasks}/{subtaskCount} completed)
                              </h5>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-blue-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${subtaskProgress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-blue-700 font-medium">{subtaskProgress}%</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {task.subtasks?.map(subtask => (
                                <div key={subtask.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                                  <div className="flex items-center gap-2">
                                    {getSubtaskStatusIcon(subtask)}
                                    <span className="text-sm text-gray-700">{subtask.title}</span>
                                    {subtask.subtaskAssignee && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        ({subtask.subtaskAssignee.name})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subtask.due_date && (
                                      <span className="text-xs text-gray-500">
                                        Due: {formatDate(subtask.due_date)}
                                      </span>
                                    )}
                                    {user?.id === subtask.assigned_to && (
                                      <button 
                                        onClick={() => handleSubtaskStatusUpdate(subtask.id, 'completed')}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                      >
                                        Mark Complete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks found for this project.</p>
                  <button 
                    onClick={() => navigate(`/workspaces/${project.workspace_id}/projects/${project.id}/tasks/create`)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
                  >
                    Create First Task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Stats Card */}
            {stats && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <h3 className="text-xl font-bold text-gray-800">Project Statistics</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.total_tasks}</div>
                      <div className="text-sm text-purple-800 font-medium">Total Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completed_tasks}</div>
                      <div className="text-sm text-green-800 font-medium">Completed Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.total_items}</div>
                      <div className="text-sm text-blue-800 font-medium">Total Items</div>
                    </div>
                    <div className="text-center p-3 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">{stats.completed_items}</div>
                      <div className="text-sm text-teal-800 font-medium">Completed Items</div>
                    </div>
                  </div>

                  {/* Subtasks Stats */}
                  {stats.subtask_stats.total > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <Layers className="w-4 h-4 mr-2 text-blue-600" />
                        Subtasks
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Subtasks</span>
                          <span className="text-sm font-semibold text-gray-800">{stats.subtask_stats.total}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Completed Subtasks</span>
                          <span className="text-sm font-semibold text-green-600">{stats.subtask_stats.completed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pending Subtasks</span>
                          <span className="text-sm font-semibold text-yellow-600">{stats.subtask_stats.pending}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completion Rates */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">Completion Rates</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span className="flex items-center">
                            <CheckSquare className="w-3 h-3 mr-1 text-purple-600" />
                            Task Completion
                          </span>
                          <span className="font-semibold text-gray-800">
                            {stats.total_tasks > 0 
                              ? `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}%` 
                              : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${stats.total_tasks > 0 
                                ? (stats.completed_tasks / stats.total_tasks) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {stats.subtask_stats.total > 0 && (
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span className="flex items-center">
                              <Layers className="w-3 h-3 mr-1 text-blue-600" />
                              Subtask Completion
                            </span>
                            <span className="font-semibold text-gray-800">
                              {stats.subtask_stats.total > 0 
                                ? `${Math.round((stats.subtask_stats.completed / stats.subtask_stats.total) * 100)}%` 
                                : '0%'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${stats.subtask_stats.total > 0 
                                  ? (stats.subtask_stats.completed / stats.subtask_stats.total) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Overall Progress</span>
                          <span className="font-semibold text-gray-800">{project.overallProgress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${project.overallProgress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={syncProjectStatus}
                  disabled={syncing}
                  className={`w-full py-3 px-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-300 font-semibold text-center flex items-center justify-center ${syncing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {syncing ? (
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 mr-2" />
                  )}
                  {syncing ? 'Syncing...' : 'Sync Project Status'}
                </button>
                <button 
                  onClick={() => navigate(`/projects/${id}/edit`)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-center"
                >
                  Update Progress
                </button>
                <button 
                  onClick={() => navigate(`/projects/${id}/edit`)}
                  className="w-full py-3 px-4 bg-white border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-semibold text-center"
                >
                  Edit Project
                </button>
                {(user?.role === 'admin' || user?.id === project.created_by) && (
                  <button className="w-full py-3 px-4 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-300 font-semibold text-center">
                    Delete Project
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;