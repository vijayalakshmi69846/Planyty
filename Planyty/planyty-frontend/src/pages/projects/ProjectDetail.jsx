import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import { Plus, ArrowLeft, Search, Filter } from 'lucide-react';

const ProjectDetail = () => {
  const { workspaceId, projectId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock project data
  const project = {
    id: projectId,
    name: 'E-commerce Platform',
    description: 'Build a complete e-commerce solution with React and Node.js',
    progress: 60,
    taskCount: 15,
    memberCount: 4
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden">
      {/* HEADER - EXACT COPY OF WORKSPACEDETAIL HEADER */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Back button & Project info */}
          <div className="flex items-center gap-3 flex-1">
            <Link to={`/workspaces/${workspaceId}`}>
              <button className="flex items-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-transform">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Back to Projects</span>
              </button>
            </Link>

            <div className="border-l border-gray-300 h-6"></div>

            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {project.name}
              </h1>
              <p className="text-xs text-gray-600">
                {project.description}
              </p>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors duration-200 text-sm">
                <Filter className="w-4 h-4 text-purple-500" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>

          {/* Right Section - New Task Button */}
          <div>
            <button 
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-purple-200 hover:shadow-purple-300 text-sm"
              onClick={() => {/* Add task modal logic */}}
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board - Rest of your existing content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <KanbanBoard 
            projectId={projectId} 
            showAddTaskButton={false}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;