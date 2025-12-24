import React, { useState } from 'react';
import { X, Calendar, User, Flag, Tag, ChevronDown, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const TaskForm = ({ onClose, onSubmit, task, isSubtask = false }) => {
  const [formData, setFormData] = useState({
    title: task ? task.title : '',
    description: task ? task.description : '',
    priority: task ? task.priority : 'Medium',
    assignee: task ? task.assignee : 'Me',
    dueDate: task ? task.dueDate : '',
    tags: task ? task.tags : [],
    subtasks: task ? task.subtasks : [],
  });

  const [currentTag, setCurrentTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSubmit(formData);
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim() !== '') {
      setFormData({
        ...formData,
        subtasks: [...formData.subtasks, { title: newSubtask.trim(), completed: false }],
      });
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index) => {
    const newSubtasks = [...formData.subtasks];
    newSubtasks.splice(index, 1);
    setFormData({ ...formData, subtasks: newSubtasks });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-200 animate-float scrollbar-hide">
        <div className="flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-purple-800 animate-pulse-slow">
            {isSubtask ? 'Create New Subtask' : task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 animate-bounce-slow"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="animate-slide-up delay-100">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              placeholder="Enter task title"
            />
          </div>

          <div className="animate-slide-up delay-200">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 animate-slide-up delay-300">
            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Flag className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Priority
              </label>
              <div className="relative">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 appearance-none pr-10"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <User className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Assignee
              </label>
              <div className="relative">
                <select
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 appearance-none pr-10"
                >
                  <option value="Me">Me</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="animate-slide-up delay-400">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
            />
          </div>

          <div className="animate-slide-up delay-500">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
                placeholder="Add a tag and press Enter"
              />
              <Button 
                type="button" 
                className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-xl shadow-lg animate-pulse-slow"
                onClick={addTag}
              >
                Add ✨
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-purple-500 text-white text-sm rounded-full border-2 border-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-lg animate-bounce-in"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-purple-200 transition-colors duration-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="animate-slide-up delay-600">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Subtasks
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
                placeholder="Add a subtask"
              />
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 transition-all duration-300 hover:scale-110 hover:shadow-xl shadow-lg"
                onClick={handleAddSubtask}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded-lg"
                >
                  <span>{subtask.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="p-1 hover:bg-red-100 rounded-full transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 animate-slide-up delay-700">
            <Button
              type="button"
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-500 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md animate-pulse-slow"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-2 border-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg animate-pulse-slow"
            >
              {isSubtask ? 'Create Subtask 🚀' : task ? 'Save Changes 🚀' : 'Create Task 🚀'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
