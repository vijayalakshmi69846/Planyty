import React, { useState, useEffect } from 'react';
import { X, Edit, Plus, ChevronDown, ChevronRight, Calendar, User, Flag, CheckCircle } from 'lucide-react';
import TaskForm from './TaskForm';
import Button from '../ui/Button';
import SubtaskItem from './SubtaskItem';

const TaskDetailModal = ({ task, onClose, onUpdateTask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [currentTask, setCurrentTask] = useState(task);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  useEffect(() => {
    const subtasks = currentTask.subtasks || [];
    if (subtasks.length > 0) {
      const allCompleted = subtasks.every(s => s.status === 'completed');
      const anyInProgress = subtasks.some(s => s.status === 'in progress' || s.status === 'completed');

      let newStatus = currentTask.status;
      if (allCompleted) {
        newStatus = 'completed';
      } else if (anyInProgress) {
        newStatus = 'in progress';
      } else {
        newStatus = 'not yet begun';
      }

      if (newStatus !== currentTask.status) {
        handleStatusChange(newStatus);
      }
    }
  }, [currentTask.subtasks, currentTask.status]);

  const handleUpdate = (updatedTask) => {
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
    setIsEditing(false);
  };

  const handleAddSubtask = (subtaskData) => {
    const newSubtask = {
      id: Date.now().toString(),
      ...subtaskData,
      status: 'not yet begun',
      subtasks: []
    };
    
    const updatedTask = {
      ...currentTask,
      subtasks: [...(currentTask.subtasks || []), newSubtask],
    };
    
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
    setShowSubtaskForm(false);
  };

  const handleUpdateSubtask = (updatedSubtask) => {
    const updatedSubtasks = (currentTask.subtasks || []).map(sub =>
      sub.id === updatedSubtask.id ? updatedSubtask : sub
    );
    const updatedTask = { ...currentTask, subtasks: updatedSubtasks };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = (currentTask.subtasks || []).filter(sub => sub.id !== subtaskId);
    const updatedTask = { ...currentTask, subtasks: updatedSubtasks };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const handleStatusChange = (newStatus) => {
    const updatedTask = { ...currentTask, status: newStatus };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const subtasks = currentTask.subtasks || [];
  const completedSubtasks = subtasks.filter(subtask => subtask.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getStatusPill = (status) => {
    switch (status) {
      case 'not yet begun':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">Not Yet Begun</span>;
      case 'in progress':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">In Progress</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Completed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-purple-200" onClick={handleModalClick}>
        <div className="flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-purple-800">{currentTask.title}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-yellow-100 rounded-full transition-all duration-300"
            >
              <Edit className="w-5 h-5 text-yellow-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-full transition-all duration-300"
            >
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="p-6 overflow-y-auto">
            <TaskForm 
              task={currentTask} 
              onSubmit={handleUpdate} 
              onClose={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-3 gap-8 overflow-y-auto">
            <div className="col-span-2">
              <div className="mb-6">
                <h3 className="font-semibold text-purple-700 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{currentTask.description || 'No description provided.'}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                    className="flex items-center gap-2 font-semibold text-purple-700"
                  >
                    {subtasksExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    Subtasks
                    <span className="text-sm font-normal text-gray-500">({completedSubtasks}/{totalSubtasks})</span>
                  </button>
                  <Button
                    onClick={() => setShowSubtaskForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>

                {totalSubtasks > 0 && (
                  <div className="w-full bg-purple-200 rounded-full h-2 mb-4">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${subtaskProgress}%` }}></div>
                  </div>
                )}

                {subtasksExpanded && (
                  <div className="space-y-2">
                    {showSubtaskForm && (
                      <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50">
                        <TaskForm
                          onClose={() => setShowSubtaskForm(false)}
                          onSubmit={handleAddSubtask}
                          isSubtask={true}
                        />
                      </div>
                    )}
                    {subtasks.map(subtask => (
                      <SubtaskItem
                        key={subtask.id}
                        subtask={subtask}
                        onUpdate={handleUpdateSubtask}
                        onDelete={handleDeleteSubtask}
                        onAddSubtask={handleAddSubtask}
                        level={0}
                      />
                    ))}
                    {subtasks.length === 0 && !showSubtaskForm && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-700">No Subtasks</h4>
                        <p className="text-sm mt-1 text-purple-500">Add a subtask to break this task into smaller parts.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-purple-700 mb-2">Status</h3>
                  {totalSubtasks === 0 ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStatusChange('not yet begun')}
                        className={`px-3 py-1 text-xs rounded-full border-2 ${
                          currentTask.status === 'not yet begun'
                            ? 'bg-red-500 text-white font-semibold border-red-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Todo
                      </button>
                      <button
                        onClick={() => handleStatusChange('in progress')}
                        className={`px-3 py-1 text-xs rounded-full border-2 ${
                          currentTask.status === 'in progress'
                            ? 'bg-yellow-500 text-white font-semibold border-yellow-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className={`px-3 py-1 text-xs rounded-full border-2 ${
                          currentTask.status === 'completed'
                            ? 'bg-green-500 text-white font-semibold border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    getStatusPill(currentTask.status)
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 mb-2">Assignee</h3>
                  <div className="flex items-center gap-2 text-gray-800">
                    <User className="w-5 h-5 text-purple-400" />
                    <span className="font-medium">{currentTask.assignee || 'Unassigned'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 mb-2">Due Date</h3>
                  <div className="flex items-center gap-2 text-gray-800">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="font-medium">{currentTask.dueDate || 'No due date'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 mb-2">Priority</h3>
                  <div className="flex items-center gap-2 text-gray-800">
                    <Flag className="w-5 h-5 text-purple-400" />
                    <span className="font-medium">{currentTask.priority || 'Medium'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
