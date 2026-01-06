import React, { useState, useEffect } from 'react';
import { ChevronDown, Folder } from 'lucide-react';
import KanbanBoard from '../components/tasks/KanbanBoard';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';

const Tasks = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getAllProjects();
        if (response && response.projects) setProjects(response.projects);
        else if (Array.isArray(response)) setProjects(response);
      } catch (err) { console.error("Failed to load projects", err); }
    };
    fetchProjects();
  }, []);
// In Tasks.jsx, update the fetchTasks useEffect:
useEffect(() => {
  if (selectedProject?.id) {
    const fetchTasks = async () => {
      try {
        const data = await taskService.getTasks(selectedProject.id);
        
        // Get logged in user
        const userStr = localStorage.getItem('planyty_user');
        const loggedInUser = userStr ? JSON.parse(userStr) : null;
        const isMember = loggedInUser?.role?.toLowerCase() === 'member';
        
        console.log('📋 Tasks API Response:', {
          user: loggedInUser?.email,
          isMember,
          totalTasks: data?.length,
          tasks: data?.map(task => ({
            id: task.id,
            title: task.title,
            assigned_to: task.assigned_to,
            subtasksCount: task.subtasks?.length,
            subtasks: task.subtasks?.map(st => ({
              id: st.id,
              title: st.title,
              assigned_to: st.assigned_to,
              assigneeId: st.subtaskAssignee?.id,
              assigneeName: st.subtaskAssignee?.name
            }))
          }))
        });
        
        setTasks(data || []);
      } catch (err) { console.error("Error fetching tasks:", err); }
    };
    fetchTasks();
  }
}, [selectedProject]);
  const handleTaskStateUpdate = (data) => {
    if (data._deleted) {
      setTasks(prev => prev.filter(t => t.id !== data.id));
    } else {
      setTasks(prev => {
        const exists = prev.find(t => t.id === data.id);
        if (exists) return prev.map(t => t.id === data.id ? data : t);
        return [data, ...prev];
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="p-6 bg-white border-b flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="flex items-center gap-2 px-4 py-2 border-2 border-purple-100 rounded-lg text-purple-700 font-medium bg-white hover:border-purple-300 transition-all"
            >
              <Folder className="w-4 h-4" />
              {selectedProject ? selectedProject.name : "Select Project"}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-purple-200 rounded-xl shadow-2xl z-[9999] overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {projects.map((proj) => (
                    <button 
                      key={proj.id} 
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0" 
                      onClick={() => { 
                        setSelectedProject(proj); 
                        setIsOpen(false); 
                      }}
                    >
                      <p className="font-semibold text-purple-900">{proj.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedProject ? `Tasks for ${selectedProject.name}` : "All Tasks"}
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="w-48 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-purple-700">{calculateProgress()}% Complete</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {selectedProject ? (
          <KanbanBoard 
            projectId={selectedProject.id} 
            tasks={tasks} 
            onTaskUpdate={handleTaskStateUpdate} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Folder className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium">Please select a project to view the Kanban board</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;