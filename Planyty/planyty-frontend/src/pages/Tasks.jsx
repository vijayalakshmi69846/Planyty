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

  useEffect(() => {
    if (selectedProject) {
      const fetchTasks = async () => {
        try {
          const data = await taskService.getTasks(selectedProject.id);
          setTasks(data);
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
      <div className="p-6 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 border-2 border-purple-100 rounded-lg text-purple-700 font-medium">
              <Folder className="w-4 h-4" />
              {selectedProject ? selectedProject.name : "Select Project"}
              <ChevronDown className={`w-4 h-4 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-xl shadow-xl z-50">
                // Tasks.jsx - Check this specific line
{projects.map((proj) => (
  <button 
    key={proj.id} 
    className="..." 
    onClick={() => { 
      console.log("Selected Project ID:", proj.id); // Add this log
      setSelectedProject(proj); 
      setIsOpen(false); 
    }}
  >
    <p className="font-semibold">{proj.name}</p>
  </button>
))}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">{selectedProject ? `Tasks for ${selectedProject.name}` : "All Tasks"}</h1>
        </div>

        {/* PROGRESS SECTION */}
        <div className="flex items-center gap-4 bg-purple-50 p-3 rounded-xl border border-purple-100">
          <div className="w-48 bg-gray-200 rounded-full h-2.5">
            <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${calculateProgress()}%` }}></div>
          </div>
          <span className="text-sm font-bold text-purple-700">{calculateProgress()}% Complete</span>
        </div>
      </div>

<div className="flex-1 overflow-hidden">
  {selectedProject ? (
    <KanbanBoard 
      projectId={selectedProject.id} // Ensure this is not undefined
      tasks={tasks} 
      onTaskUpdate={handleTaskStateUpdate} 
    />
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <Folder className="w-16 h-16 opacity-20" />
      <p>Please select a project to view the Kanban board</p>
    </div>
  )}
</div>
    </div>
  );
};
export default Tasks;