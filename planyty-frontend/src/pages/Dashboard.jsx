import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Filter, PieChart, ArrowRight, Crown, Users, Loader, Calendar, Target, CheckCircle, Clock, Layers, CheckSquare } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, onSeeAll, loading = false, subValue, subLabel }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
    <div className="flex items-start justify-between mb-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <div>
            <p className="text-3xl font-bold text-gray-800 mt-1 truncate">{value}</p>
            {subValue && (
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">{subLabel}:</span>
                <span className="text-xs font-semibold text-gray-700 ml-1">{subValue}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-full ${color} ml-2 flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-gray-500 truncate">
        {loading ? 'Loading...' : 'Click to view details'}
      </span>
      {onSeeAll && !loading && (
        <button 
          onClick={onSeeAll}
          className="text-xs text-purple-600 cursor-pointer flex-shrink-0 ml-2 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
        >
          See all <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      )}
    </div>
  </div>
);

const PieChartComponent = ({ data, title, onSeeAll, loading = false }) => {
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-48 h-48 bg-gray-200 rounded-full animate-pulse mb-6 lg:mb-0 lg:mr-6"></div>
          <div className="w-full space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#A78BFA', '#C084FC', '#E879F9', '#F472B6'];
  
  let accumulatedAngle = 0;
  
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 truncate text-lg">{title}</h3>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
          >
            See all <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
      
      <div className="flex flex-col lg:flex-row items-center">
        <div className="relative w-48 h-48 mb-6 lg:mb-0 lg:mr-6 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const angle = (percentage / 100) * 360;
              const largeArc = angle > 180 ? 1 : 0;
              
              const x1 = 50 + 50 * Math.cos(accumulatedAngle * Math.PI / 180);
              const y1 = 50 + 50 * Math.sin(accumulatedAngle * Math.PI / 180);
              accumulatedAngle += angle;
              const x2 = 50 + 50 * Math.cos(accumulatedAngle * Math.PI / 180);
              const y2 = 50 + 50 * Math.sin(accumulatedAngle * Math.PI / 180);
              
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 50 50 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="3"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
        
        <div className="w-full space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center min-w-0 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full mr-3 flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm font-semibold text-gray-700 truncate">{item.label}</span>
                </div>
                <div className="flex items-center ml-4">
                  <span className="text-lg font-bold text-gray-800 mr-2">
                    {item.value}
                  </span>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BarChartComponent = ({ data, title, onSeeAll, onProjectClick, loading = false }) => {
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 truncate text-lg">{title}</h3>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
          >
            See all <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            onClick={() => onProjectClick && onProjectClick(item.projectId)}
          >
            <span className="text-sm font-semibold text-gray-700 w-20 truncate flex-shrink-0">{item.label}</span>
            <div className="flex-1 mx-4 min-w-0">
              <div className="bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${Math.min(item.value, 100)}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-800 w-12 text-right flex-shrink-0">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onClick, loading = false }) => {
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="flex justify-between items-center">
          <div className="flex-1 mr-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
            <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse"></div>
          </div>
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const getDisplayStatus = () => {
    if (!project) return 'planned';
    
    if (project.status === 'completed') return 'completed';
    if (project.status === 'in_progress') return 'in_progress';
    if ((project.progress || 0) > 0) return 'in_progress';
    return 'planned';
  };

  const displayStatus = getDisplayStatus();
  const mainTasks = project.task_count || project.taskCount || 0;
  const subtasks = project.subtask_count || 0;
  
  return (
    <div 
      className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-gray-800 truncate text-lg">{project?.name || 'Unnamed Project'}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          displayStatus === 'completed' ? 'bg-green-100 text-green-800' :
          displayStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {displayStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project?.description || 'No description'}</p>
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{project?.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${project?.progress || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-600 flex items-center">
            <CheckSquare className="w-3 h-3 mr-1" />
            {mainTasks} tasks
          </div>
          {subtasks > 0 && (
            <div className="text-xs text-gray-500 flex items-center mt-1">
              <Layers className="w-3 h-3 mr-1" />
              {subtasks} subtasks
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" />
      </div>
    </div>
  );
};

const TimelineBarChart = ({ projects, title, onSeeAll, onProjectClick, loading = false }) => {
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // Calculate actual data from projects with tasks and subtasks
  const getRecentProjects = () => {
    if (!projects || projects.length === 0) return [];
    
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return projects
      .filter(project => project && project.created_at && new Date(project.created_at) >= last30Days)
      .slice(0, 7)
      .map((project, index) => {
        const createdDate = new Date(project.created_at);
        const daysAgo = Math.floor((now - createdDate) / (24 * 60 * 60 * 1000));
        const mainTasks = project.task_count || project.taskCount || 0;
        const subtasks = project.subtask_count || 0;
        const totalTasks = mainTasks + subtasks;
        
        return {
          date: daysAgo === 0 ? 'Today' : `${daysAgo}d ago`,
          mainTasks,
          subtasks,
          totalTasks,
          projectName: project.name,
          projectId: project.id,
          progress: project.progress || 0
        };
      });
  };

  const timelineData = getRecentProjects();
  const maxTotalTasks = timelineData.length > 0 ? Math.max(...timelineData.map(item => item.totalTasks)) : 0;
  const totalMainTasks = timelineData.reduce((sum, item) => sum + item.mainTasks, 0);
  const totalSubtasks = timelineData.reduce((sum, item) => sum + item.subtasks, 0);

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
          >
            See all <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>

      {timelineData.length > 0 ? (
        <>
          <div className="flex">
            <div className="flex flex-col justify-between h-64 mr-4 text-xs text-gray-600 font-medium">
              <span>{maxTotalTasks}</span>
              <span>{Math.round(maxTotalTasks * 0.75)}</span>
              <span>{Math.round(maxTotalTasks * 0.5)}</span>
              <span>{Math.round(maxTotalTasks * 0.25)}</span>
              <span>0</span>
            </div>

            <div className="flex-1">
              <div className="flex items-end justify-between h-64 border-b-2 border-l-2 border-gray-300 pb-4 pl-4">
                {timelineData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1 mx-1">
                    <div className="relative w-full" style={{ height: '100%' }}>
                      {/* Main Tasks Bar */}
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-300 cursor-pointer relative group shadow-lg"
                        style={{ 
                          height: maxTotalTasks > 0 ? `${(item.mainTasks / maxTotalTasks) * 100}%` : '0%',
                          minHeight: '8px',
                          position: 'absolute',
                          bottom: 0
                        }}
                        onClick={() => onProjectClick && onProjectClick(item.projectId)}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-gray-600 shadow-xl">
                            <div className="font-bold">
                              {item.mainTasks} main tasks
                              {item.subtasks > 0 && ` + ${item.subtasks} subtasks`}
                            </div>
                            <div className="text-gray-300 mt-1">
                              {item.projectName}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              Progress: {item.progress}%
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                      
                      {/* Subtasks Bar (stacked on top) */}
                      {item.subtasks > 0 && (
                        <div
                          className="w-full bg-gradient-to-t from-blue-400 to-cyan-400 rounded-t-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 cursor-pointer relative group shadow-lg"
                          style={{ 
                            height: maxTotalTasks > 0 ? `${(item.subtasks / maxTotalTasks) * 100}%` : '0%',
                            minHeight: '4px',
                            position: 'absolute',
                            bottom: maxTotalTasks > 0 ? `${(item.mainTasks / maxTotalTasks) * 100}%` : '0%'
                          }}
                          onClick={() => onProjectClick && onProjectClick(item.projectId)}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-blue-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-blue-600 shadow-xl">
                              <div className="font-bold">{item.subtasks} subtasks</div>
                              <div className="text-blue-200">Part of: {item.projectName}</div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-800"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 mt-2 text-center font-medium">
                      {item.date}
                    </div>
                    
                    <div className="text-xs font-bold text-gray-800 mt-1">
                      {item.totalTasks}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-3">
                <span className="text-sm text-gray-600 font-medium">Recent Projects (Last 30 Days)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-t from-purple-500 to-pink-400 mr-2"></div>
              <span className="text-xs text-gray-600">Main Tasks</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-t from-blue-400 to-cyan-400 mr-2"></div>
              <span className="text-xs text-gray-600">Subtasks</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {timelineData.slice(0, 4).map((item, index) => (
              <div 
                key={item.projectId} 
                className="flex items-center text-sm p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                onClick={() => onProjectClick && onProjectClick(item.projectId)}
              >
                <div 
                  className="w-3 h-3 rounded mr-2 flex-shrink-0 shadow-sm"
                  style={{ 
                    backgroundColor: ['#A78BFA', '#C084FC', '#E879F9', '#F472B6'][index % 4]
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 font-medium truncate">{item.projectName}</div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{item.mainTasks} tasks</span>
                    {item.subtasks > 0 && (
                      <span className="ml-2">{item.subtasks} subtasks</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-300">
            <button 
              onClick={onSeeAll}
              className="text-purple-600 hover:text-purple-700 text-sm font-bold transition-colors duration-200 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-1" />
              View Calendar
            </button>
            <div className="text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-4">
                <div>
                  Tasks: <span className="font-bold text-gray-800">{totalMainTasks}</span>
                </div>
                <div>
                  Subtasks: <span className="font-bold text-gray-800">{totalSubtasks}</span>
                </div>
                <div>
                  Total: <span className="font-bold text-gray-800">{totalMainTasks + totalSubtasks}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent projects in the last 30 days</p>
          <button 
            onClick={onSeeAll}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-sm"
          >
            Create New Project
          </button>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMainTasks: 0,
    totalSubtasks: 0,
    totalProjects: 0,
    completedTasks: 0,
    completedSubtasks: 0,
    inProgressProjects: 0,
    completedProjects: 0
  });
  const [tasksByPriority, setTasksByPriority] = useState([
    { label: 'High Priority', value: 0 },
    { label: 'Medium Priority', value: 0 },
    { label: 'Low Priority', value: 0 },
  ]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setTasksLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      let projectsData = [];
      let allTasks = [];
      let totalMainTasks = 0;
      let totalSubtasks = 0;
      let completedMainTasks = 0;
      let completedSubtasks = 0;
      
      try {
        // Fetch projects
        const projectsRes = await api.get('/projects');
        projectsData = projectsRes.data?.projects || projectsRes.data || [];
        console.log('Fetched projects data:', projectsData.length, 'projects');
        
        // Fetch all tasks across all projects
        for (const project of projectsData) {
          if (project?.id) {
            try {
              const tasksRes = await api.get(`/projects/${project.id}/tasks`);
              const projectTasks = tasksRes.data || [];
              allTasks = [...allTasks, ...projectTasks];
              
              // Count tasks and subtasks for this project
              projectTasks.forEach(task => {
                totalMainTasks += 1;
                
                // Count completed main tasks
                if (task.status === 'completed' || (task.progress || 0) >= 100) {
                  completedMainTasks += 1;
                }
                
                // Count subtasks
                if (task.subtasks && Array.isArray(task.subtasks)) {
                  totalSubtasks += task.subtasks.length;
                  
                  // Count completed subtasks
                  task.subtasks.forEach(subtask => {
                    if (subtask.status === 'completed' || subtask.completed) {
                      completedSubtasks += 1;
                    }
                  });
                }
              });
            } catch (taskError) {
              console.warn(`Could not fetch tasks for project ${project.id}:`, taskError.message);
            }
          }
        }
        
        // Add subtask counts to each project for display
        projectsData = projectsData.map(project => {
          const projectTasks = allTasks.filter(task => task.project_id === project.id);
          const projectSubtaskCount = projectTasks.reduce((sum, task) => 
            sum + (task.subtasks ? task.subtasks.length : 0), 0
          );
          
          return {
            ...project,
            subtask_count: projectSubtaskCount
          };
        });
      } catch (projectsError) {
        console.warn('Could not fetch projects:', projectsError.message);
      }
      
      setProjects(projectsData);
      
      const totalProjects = projectsData.length;
      const completedProjects = projectsData.filter(p => p?.status === 'completed').length;
      
      const inProgressProjects = projectsData.filter(p => {
        if (p?.status === 'completed') return false;
        if (p?.status === 'in_progress') return true;
        if (p?.status === 'planned' || !p?.status) {
          const progress = p?.progress || 0;
          const taskCount = p?.task_count || p?.taskCount || p?.tasks_count || 0;
          if (progress > 0 || taskCount > 0) return true;
        }
        return true;
      }).length;
      
      console.log('Calculated stats:', {
        totalMainTasks,
        totalSubtasks,
        totalProjects,
        completedMainTasks,
        completedSubtasks,
        inProgressProjects,
        completedProjects
      });
      
      let priorityDistribution = { high: 0, medium: 0, low: 0 };
      
      // Calculate priority distribution from all tasks and subtasks
      allTasks.forEach(task => {
        // Get priority distribution from tasks
        if (task.priority) {
          const priority = task.priority.toLowerCase();
          if (priority === 'high') priorityDistribution.high += 1;
          else if (priority === 'medium') priorityDistribution.medium += 1;
          else if (priority === 'low') priorityDistribution.low += 1;
        }
        
        // Also count priorities from subtasks
        if (task.subtasks && Array.isArray(task.subtasks)) {
          task.subtasks.forEach(subtask => {
            if (subtask.priority) {
              const priority = subtask.priority.toLowerCase();
              if (priority === 'high') priorityDistribution.high += 1;
              else if (priority === 'medium') priorityDistribution.medium += 1;
              else if (priority === 'low') priorityDistribution.low += 1;
            }
          });
        }
      });
      
      // Fallback for priority distribution if needed
      if (priorityDistribution.high === 0 && priorityDistribution.medium === 0 && priorityDistribution.low === 0) {
        try {
          const analyticsRes = await api.get('/tasks/analytics');
          const analyticsData = analyticsRes.data;
          if (analyticsData && analyticsData.priorityDistribution) {
            priorityDistribution = {
              high: analyticsData.priorityDistribution.high || 0,
              medium: analyticsData.priorityDistribution.medium || 0,
              low: analyticsData.priorityDistribution.low || 0
            };
          }
        } catch (analyticsError) {
          console.warn('Could not fetch analytics data:', analyticsError.message);
        }
      }
      
      const newStats = {
        totalMainTasks: totalMainTasks || 0,
        totalSubtasks: totalSubtasks || 0,
        totalProjects: totalProjects || 0,
        completedTasks: completedMainTasks || 0,
        completedSubtasks: completedSubtasks || 0,
        inProgressProjects: inProgressProjects || 0,
        completedProjects: completedProjects || 0
      };
      
      setStats(newStats);
      
      // Calculate priority distribution based on collected data
      const priorityData = [
        { label: 'High Priority', value: priorityDistribution.high || 0 },
        { label: 'Medium Priority', value: priorityDistribution.medium || 0 },
        { label: 'Low Priority', value: priorityDistribution.low || 0 },
      ];
      
      setTasksByPriority(priorityData);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setProjects([]);
      setStats({
        totalMainTasks: 0,
        totalSubtasks: 0,
        totalProjects: 0,
        completedTasks: 0,
        completedSubtasks: 0,
        inProgressProjects: 0,
        completedProjects: 0
      });
      setTasksByPriority([
        { label: 'High Priority', value: 0 },
        { label: 'Medium Priority', value: 0 },
        { label: 'Low Priority', value: 0 },
      ]);
    } finally {
      setLoading(false);
      setTasksLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  const handleSeeAll = () => navigate('/projects');

  // Calculate projects by status
  const projectsByStatus = [
    { 
      label: 'In Progress', 
      value: projects.filter(p => p?.status !== 'completed').length 
    },
    { 
      label: 'Completed', 
      value: projects.filter(p => p?.status === 'completed').length 
    }
  ].filter(item => item.value > 0);

  // Projects by completion (top 5)
  const projectsByCompletion = projects
    .slice(0, 5)
    .map(project => ({
      label: project?.name || 'Unnamed Project',
      value: project?.progress || 0,
      projectId: project?.id
    }))
    .filter(item => item.projectId);

  // Stats cards data
  const statCards = [
    { 
      title: 'Total Projects', 
      value: stats.totalProjects.toString(), 
      icon: Target,
      color: 'bg-purple-500',
      loading: loading
    },
    { 
      title: 'In Progress', 
      value: stats.inProgressProjects.toString(), 
      icon: Clock,
      color: 'bg-blue-500',
      onSeeAll: handleSeeAll,
      loading: loading
    },
    { 
      title: 'Completed', 
      value: stats.completedProjects.toString(), 
      icon: CheckCircle,
      color: 'bg-green-500',
      onSeeAll: handleSeeAll,
      loading: loading
    },
    { 
      title: 'Total Tasks', 
      value: (stats.totalMainTasks + stats.totalSubtasks).toString(),
      subValue: `${stats.totalMainTasks} tasks + ${stats.totalSubtasks} subtasks`,
      subLabel: 'Breakdown',
      icon: Layers,
      color: 'bg-pink-500',
      loading: loading
    }
  ];

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto mt-8">
          <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Projects Dashboard</h1>
            <p className="text-gray-600 text-lg">
              {loading ? 'Loading...' : `Welcome back, ${user?.name || 'User'}! Overview of all your projects`}
            </p>
          </div>
          {user && !loading && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              user.role === 'team_lead' || user.role === 'admin'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
            }`}>
              {user.role === 'team_lead' || user.role === 'admin' ? <Crown className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              <span className="font-semibold">
                {user.role === 'admin' ? 'Administrator' : 
                 user.role === 'team_lead' ? 'Team Lead' : 'Team Member'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Main Tasks" 
          value={stats.totalMainTasks.toString()}
          subValue={`${stats.completedTasks} completed`}
          subLabel="Completed"
          icon={CheckSquare}
          color="bg-indigo-500"
          loading={loading}
        />
        <StatCard 
          title="Subtasks" 
          value={stats.totalSubtasks.toString()}
          subValue={`${stats.completedSubtasks} completed`}
          subLabel="Completed"
          icon={Layers}
          color="bg-cyan-500"
          loading={loading}
        />
        <StatCard 
          title="Task Completion" 
          value={`${stats.totalMainTasks > 0 ? Math.round((stats.completedTasks / stats.totalMainTasks) * 100) : 0}%`}
          subValue={`${stats.completedTasks}/${stats.totalMainTasks}`}
          subLabel="Tasks"
          icon={CheckCircle}
          color="bg-emerald-500"
          loading={loading}
        />
        <StatCard 
          title="Subtask Completion" 
          value={`${stats.totalSubtasks > 0 ? Math.round((stats.completedSubtasks / stats.totalSubtasks) * 100) : 0}%`}
          subValue={`${stats.completedSubtasks}/${stats.totalSubtasks}`}
          subLabel="Subtasks"
          icon={CheckCircle}
          color="bg-teal-500"
          loading={loading}
        />
      </div>

      {/* Recent Projects Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Projects</h2>
          {!loading && (
            <button 
              onClick={handleSeeAll}
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center transition-colors duration-200"
            >
              View All Projects <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <ProjectCard key={i} loading={true} />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.slice(0, 8).map(project => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onClick={() => handleProjectClick(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">No projects found</p>
            <button 
              onClick={() => navigate('/projects/create')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent 
          title="Projects by Status" 
          data={projectsByStatus}
          onSeeAll={handleSeeAll}
          loading={loading}
        />

        <BarChartComponent 
          title="Top Projects by Progress" 
          data={projectsByCompletion}
          onSeeAll={handleSeeAll}
          onProjectClick={handleProjectClick}
          loading={loading}
        />

        <PieChartComponent 
          title="Tasks by Priority" 
          data={tasksByPriority}
          onSeeAll={handleSeeAll}
          loading={tasksLoading}
        />

        <TimelineBarChart 
          title="Recent Project Activity"
          projects={projects}
          onSeeAll={handleSeeAll}
          onProjectClick={handleProjectClick}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;