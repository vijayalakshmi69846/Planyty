import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProjectCard from '../../components/projects/ProjectCard';
import Button from '../../components/ui/Button';
import { Plus, Search, Filter } from 'lucide-react';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Mock data - replace with API call
  const projects = [
    {
      id: 1,
      name: 'E-commerce Platform',
      description: 'Build a complete e-commerce solution',
      taskCount: 15,
      progress: 60,
      memberCount: 4,
      dueDate: 'in 2 weeks',
      workspaceId: 1,
      workspaceName: 'Web Development'
    },
    {
      id: 2,
      name: 'Mobile App',
      description: 'iOS and Android application',
      taskCount: 8,
      progress: 30,
      memberCount: 3,
      dueDate: 'in 1 week',
      workspaceId: 2,
      workspaceName: 'Mobile App'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'high-progress') return matchesSearch && project.progress >= 70;
    if (filter === 'low-progress') return matchesSearch && project.progress < 30;
    
    return matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-600 mt-2">View and manage all projects across workspaces</p>
        </div>
        <Link to="/workspaces">
          <Button variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Projects</option>
          <option value="high-progress">High Progress (70%+)</option>
          <option value="low-progress">Needs Attention (&lt;30%)</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
              workspaceId={project.workspaceId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter terms' : 'No projects created yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Projects;