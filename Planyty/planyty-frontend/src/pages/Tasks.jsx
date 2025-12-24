import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import KanbanBoard from '../components/tasks/KanbanBoard';
import Button from '../components/ui/Button';
import { Folder, ChevronDown, CheckCircle, TrendingUp } from 'lucide-react';

// Mock projects list - in real app, this would come from API
const mockProjects = [
  { id: 1, name: 'Website Redesign' },
  { id: 2, name: 'Mobile App' },
  { id: 3, name: 'API Development' },
  { id: 4, name: 'Database Migration' }
];

const Tasks = () => {
  const { projectId: urlProjectId } = useParams();
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId ? parseInt(urlProjectId) : null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCompletedDropdown, setShowCompletedDropdown] = useState(false);
  
  // State to track completed tasks - this will be passed to KanbanBoard
  const [completedTasks, setCompletedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const handleTaskUpdate = (updatedTask) => {
    const updatedTasks = allTasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    setAllTasks(updatedTasks);

    if (updatedTask.status === 'completed') {
      setCompletedTasks(prevCompletedTasks => {
        const existingTask = prevCompletedTasks.find(task => task.id === updatedTask.id);
        if (existingTask) {
          return prevCompletedTasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          );
        } else {
          return [...prevCompletedTasks, updatedTask];
        }
      });
    }
  };

  const handleTaskComplete = (completedTask) => {
    const updatedTasks = allTasks.map(task =>
      task.id === completedTask.id ? { ...task, status: 'completed' } : task
    );
    setAllTasks(updatedTasks);
    setCompletedTasks(prevCompletedTasks => [...prevCompletedTasks, completedTask]);
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setShowProjectDropdown(false);
  };

  const selectedProject = mockProjects.find(p => p.id === selectedProjectId);

  // Fixed progress calculation - count main tasks only
  const calculateOverallProgress = (tasks) => {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  const progressPercentage = calculateOverallProgress(allTasks);
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter(task => task.status === 'completed').length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden">
      {/* COMPACT HEADER */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors duration-200 text-sm min-w-40 justify-between"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700 truncate">
                    {selectedProject ? selectedProject.name : 'Select Project'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-purple-500 flex-shrink-0" />
              </button>

              {showProjectDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-purple-200 rounded-lg shadow-lg z-10">
                  <div className="p-1">
                    <div className="px-2 py-1 text-xs font-medium text-purple-600 border-b border-purple-200">
                      Projects
                    </div>
                    {mockProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-purple-50 ${
                          selectedProjectId === project.id ? 'bg-purple-500 text-white' : 'text-gray-700'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-l border-gray-300 h-6"></div>

            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {selectedProject ? `${selectedProject.name} Tasks` : 'All Tasks'}
              </h1>
            </div>
          </div>

          {/* Center Section - Progress */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Progress</span>
              </div>
              
              <div className="w-24">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <span className="text-xs font-medium text-gray-600 min-w-16">
                {completedCount}/{totalTasks} ({progressPercentage}%)
              </span>
            </div>

            {/* Completed Tasks Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCompletedDropdown(!showCompletedDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Completed</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showCompletedDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCompletedDropdown && completedTasks.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-green-200 rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-medium text-green-600 border-b border-green-200 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Completed ({completedTasks.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto mt-1">
                      {completedTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="px-2 py-1.5 border-b border-gray-100 last:border-b-0 hover:bg-green-50"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700 truncate">{task.title}</span>
                          </div>
                          {task.completedAt && (
                            <div className="text-xs text-gray-500 ml-5">
                              {task.completedAt}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showCompletedDropdown && completedTasks.length === 0 && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-green-200 rounded-lg shadow-lg z-20">
                  <div className="p-3 text-center">
                    <CheckCircle className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">No completed tasks</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div>
            <Link to="/workspaces">
              <Button className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors duration-200">
                <Folder className="w-4 h-4 mr-1" />
                Workspaces
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
          <div className="h-full inline-block">
            <KanbanBoard
              projectId={selectedProjectId}
              completedTasks={completedTasks}
              onTaskComplete={handleTaskComplete}
              onTaskUpdate={handleTaskUpdate}
              onTasksLoad={setAllTasks}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;