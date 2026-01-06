import React from 'react';
import { Tag, Clock, User, CheckCircle, Flag } from 'lucide-react';

const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'High':
      return {
        icon: <Flag className="w-3 h-3 text-red-500" />,
        bg: 'bg-red-100',
      };
    case 'Medium':
      return {
        icon: <Flag className="w-3 h-3 text-yellow-500" />,
        bg: 'bg-yellow-100',
      };
    case 'Low':
      return {
        icon: <Flag className="w-3 h-3 text-green-500" />,
        bg: 'bg-green-100',
      };
    default:
      return {
        icon: <Flag className="w-3 h-3 text-gray-500" />,
        bg: 'bg-gray-100',
      };
  }
};

const TaskCard = ({ task, isCompleted = false }) => {
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(subtask => subtask.status === 'completed').length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;
  const priorityStyles = getPriorityStyles(task.priority);

  // Helper to get assignee name
  const getAssigneeDisplay = () => {
    if (!task.assignee) return 'Unassigned';
    // If it's an object (from DB join), show the name
    if (typeof task.assignee === 'object') {
      return task.assignee.name || task.assignee.email.split('@')[0];
    }
    // Fallback for raw ID or string
    return task.assignee;
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all duration-300 flex flex-col gap-2 cursor-pointer ${
        isCompleted 
          ? 'bg-green-50 border-green-200 opacity-80' 
          : 'bg-white border-purple-200 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className={`font-semibold text-sm flex-1 ${
          isCompleted ? 'text-green-700 line-through' : 'text-purple-800'
        }`}>
          {task.title}
        </h3>
      </div>

      {/* Tags - Updated to handle both strings and objects */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {typeof tag === 'object' ? tag.name : tag}
            </span>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${
              isCompleted ? 'text-green-600' : 'text-purple-600'
            }`}>
              Progress
            </span>
            <span className={`text-xs font-bold ${
              isCompleted ? 'text-green-700' : 'text-purple-700'
            }`}>
              {completedSubtasks}/{subtasks.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                isCompleted ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-full ${priorityStyles.bg}`}>
            {priorityStyles.icon}
          </div>
          <div className={`flex items-center gap-1 text-xs ${
            isCompleted ? 'text-green-600' : 'text-purple-600'
          }`}>
            <Clock size={12} />
            <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} className={isCompleted ? 'text-green-500' : 'text-purple-500'} />
          <span className={`text-xs font-medium ${
            isCompleted ? 'text-green-700' : 'text-purple-800'
          }`}>
            {getAssigneeDisplay()}
          </span>
        </div>
      </div>

      {/* Completion Date */}
      {isCompleted && task.updatedAt && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;