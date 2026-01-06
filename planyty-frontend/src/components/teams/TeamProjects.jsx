import React from 'react';

const TeamProjects = ({ projects }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="team-projects">
      <div className="section-header flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Assigned Projects ({projects.length})
        </h4>
      </div>
      
      <div className="projects-list space-y-2">
        {projects.map(project => (
          <div key={project.id} className="project-item flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div className="project-info flex items-center space-x-3">
              <span className="project-name text-sm font-medium text-gray-900">
                {project.name}
              </span>
              {project.status && (
                <span className={`status-badge px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              )}
            </div>
            {project.dueDate && (
              <span className="project-due-date text-xs text-gray-500">
                Due: {project.dueDate}
              </span>
            )}
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="empty-projects text-center py-4">
            <p className="text-sm text-gray-500">No projects assigned to this team</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamProjects;