import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, Calendar, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

const ProjectCard = ({ project, workspaceId }) => {
  const progressPercentage = project.progress || 0;
  
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimelineStatus = (startDate, dueDate) => {
    if (!startDate || !dueDate) return { status: 'not-set', text: 'Timeline not set' };
    
    const today = new Date();
    const start = new Date(startDate);
    const due = new Date(dueDate);
    
    if (today < start) return { status: 'upcoming', text: 'Upcoming' };
    if (today > due) return { status: 'overdue', text: 'Overdue' };
    return { status: 'in-progress', text: 'In Progress' };
  };

  const timelineStatus = getTimelineStatus(project.startDate, project.dueDate);

  return (
    <Link to={`/workspaces/${workspaceId}/projects/${project.id}`}>
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer h-full">
        <div className="flex items-start justify-between mb-4">
          <FolderKanban className="w-8 h-8 text-blue-500" />
          <div className="flex flex-col items-end gap-1">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {project.taskCount} Tasks
            </span>
            {project.startDate && project.dueDate && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                timelineStatus.status === 'overdue' ? 'bg-red-100 text-red-800' :
                timelineStatus.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {timelineStatus.text}
              </span>
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(progressPercentage)} transition-all duration-300`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        {(project.startDate || project.dueDate) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <CalendarDays className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Timeline</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <div className="text-center">
                <div className="font-medium">Start</div>
                <div>{formatDate(project.startDate)}</div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-1 bg-gray-300 rounded relative">
                  <div 
                    className="absolute h-1 bg-blue-500 rounded"
                    style={{ 
                      width: progressPercentage > 0 ? `${Math.min(progressPercentage, 100)}%` : '0%' 
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Due</div>
                <div>{formatDate(project.dueDate)}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Team Members */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <div className="flex -space-x-2">
              {project.teamMembers && project.teamMembers.slice(0, 3).map((member, index) => (
                <div
                  key={member.id || index}
                  className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white"
                  title={member.name}
                >
                  {member.avatar || member.name?.charAt(0)}
                </div>
              ))}
              {project.teamMembers && project.teamMembers.length > 3 && (
                <div className="w-6 h-6 bg-gray-300 text-gray-600 text-xs rounded-full flex items-center justify-center border-2 border-white">
                  +{project.teamMembers.length - 3}
                </div>
              )}
              {(!project.teamMembers || project.teamMembers.length === 0) && (
                <span className="text-xs">No members</span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{project.dueDate ? formatDate(project.dueDate) : 'No due date'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;