import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, Circle, Trash2, Calendar, User, Flag, Plus } from 'lucide-react';
import TaskForm from './TaskForm';

const SubtaskItem = ({ subtask, onUpdate, onDelete, onAddSubtask, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  useEffect(() => {
    const subtasks = subtask.subtasks || [];
    if (subtasks.length > 0) {
      const allCompleted = subtasks.every(s => s.status === 'completed');
      const anyInProgress = subtasks.some(s => s.status === 'in progress' || s.status === 'completed');

      let newStatus = subtask.status;
      if (allCompleted) {
        newStatus = 'completed';
      } else if (anyInProgress) {
        newStatus = 'in progress';
      } else {
        newStatus = 'not yet begun';
      }

      if (newStatus !== subtask.status) {
        onUpdate({ ...subtask, status: newStatus });
      }
    }
  }, [subtask.subtasks, subtask.status]);

  const handleStatusChange = (e, newStatus) => {
    e.stopPropagation();
    onUpdate({ ...subtask, status: newStatus });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(subtask.id);
  };

  const handleAddNestedSubtask = (subtaskData) => {
    const newSubtask = {
      id: Date.now().toString(),
      ...subtaskData,
      status: 'not yet begun',
      subtasks: []
    };
    
    const updatedSubtask = {
      ...subtask,
      subtasks: [...(subtask.subtasks || []), newSubtask]
    };
    
    onUpdate(updatedSubtask);
    setShowSubtaskForm(false);
  };

  const handleUpdateNestedSubtask = (subtaskId, updatedNestedSubtask) => {
    const updatedSubtasks = (subtask.subtasks || []).map(sub =>
      sub.id === subtaskId ? updatedNestedSubtask : sub
    );
    onUpdate({ ...subtask, subtasks: updatedSubtasks });
  };

  const handleDeleteNestedSubtask = (subtaskId) => {
    const updatedSubtasks = (subtask.subtasks || []).filter(sub => sub.id !== subtaskId);
    onUpdate({ ...subtask, subtasks: updatedSubtasks });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in progress':
        return <Circle className="w-5 h-5 text-yellow-500 fill-current" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    setShowSubtaskForm(true);
  };

  const marginLeft = level * 24;

  return (
    <div className="bg-purple-50 rounded-lg border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ marginLeft: `${marginLeft}px` }}>
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(subtask.status)}
          <span className={`font-medium flex-1 truncate ${subtask.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {subtask.title}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-purple-700">
            <User className="w-4 h-4" />
            <span>{subtask.assignee || 'Unassigned'}</span>
          </div>
          
          <button
            onClick={handleAddClick}
            className="p-1.5 hover:bg-purple-200 rounded-full text-purple-600 transition-colors"
            title="Add nested subtask"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
            title="Delete subtask"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-purple-200 rounded-full text-purple-600 transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t-2 border-purple-200 pt-3">
          {subtask.description && (
            <p className="text-sm text-gray-600 mb-4">{subtask.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-700">Status:</span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleStatusChange(e, 'not yet begun')}
                  className={`px-3 py-1 text-xs rounded-full border-2 ${
                    subtask.status === 'not yet begun' 
                      ? 'bg-red-500 text-white font-semibold border-red-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Todo
                </button>
                <button
                  onClick={(e) => handleStatusChange(e, 'in progress')}
                  className={`px-3 py-1 text-xs rounded-full border-2 ${
                    subtask.status === 'in progress' 
                      ? 'bg-yellow-500 text-white font-semibold border-yellow-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={(e) => handleStatusChange(e, 'completed')}
                  className={`px-3 py-1 text-xs rounded-full border-2 ${
                    subtask.status === 'completed' 
                      ? 'bg-green-500 text-white font-semibold border-green-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>

            {(subtask.subtasks && subtask.subtasks.length > 0) && (
              <div className="text-sm text-purple-700">
                {subtask.subtasks.filter(st => st.status === 'completed').length} / {subtask.subtasks.length} nested tasks complete
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-purple-200 space-y-3">
            {subtask.subtasks && subtask.subtasks.map(nestedSubtask => (
              <SubtaskItem
                key={nestedSubtask.id}
                subtask={nestedSubtask}
                onUpdate={(updated) => handleUpdateNestedSubtask(nestedSubtask.id, updated)}
                onDelete={() => handleDeleteNestedSubtask(nestedSubtask.id)}
                onAddSubtask={handleAddNestedSubtask}
                level={level + 1}
              />
            ))}
          </div>

          {showSubtaskForm && (
            <div className="mt-4">
              <TaskForm
                onClose={() => setShowSubtaskForm(false)}
                onSubmit={handleAddNestedSubtask}
                isSubtask={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubtaskItem;
