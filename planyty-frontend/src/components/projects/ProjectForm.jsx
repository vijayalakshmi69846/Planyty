import React, { useState } from 'react';
import { X, Calendar, Users, Target, Folder, ChevronDown, Tag, Plus, Trash2, Clock, UserPlus } from 'lucide-react';
import Button from '../ui/Button';

const ProjectForm = ({ isOpen, onClose, onSubmit, initialData, workspaceId, availableTeamMembers }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    dueDate: initialData?.dueDate || '',
    startDate: initialData?.startDate || '',
    priority: initialData?.priority || 'Medium',
    teamMembers: initialData?.teamMembers?.map(m => m.id) || [],
    tags: initialData?.tags || [],
    objectives: initialData?.objectives || [],
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({ ...formData, workspaceId });
    onClose();
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

  const addObjective = () => {
    if (currentObjective.trim() !== '') {
      setFormData({
        ...formData,
        objectives: [...formData.objectives, currentObjective.trim()]
      });
      setCurrentObjective('');
    }
  };

  const removeObjective = (index) => {
    const newObjectives = [...formData.objectives];
    newObjectives.splice(index, 1);
    setFormData({ ...formData, objectives: newObjectives });
  };

  const toggleTeamMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter(id => id !== memberId)
        : [...prev.teamMembers, memberId]
    }));
  };

  const getSelectedMembers = () => {
    return (availableTeamMembers || []).filter(member => 
      formData.teamMembers.includes(member.id)
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target.name === 'tagInput') addTag();
      if (e.target.name === 'objectiveInput') addObjective();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-200 animate-float scrollbar-hide">
        <div className="flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-purple-800 animate-pulse-slow">
            {initialData ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 animate-bounce-slow"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div className="animate-slide-up delay-100">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Folder className="w-4 h-4 inline mr-1 text-purple-600" />
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              placeholder="Enter project name"
            />
          </div>

          {/* Description */}
          <div className="animate-slide-up delay-200">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              placeholder="Enter project description"
            />
          </div>

          {/* Timeline & Priority */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up delay-300">
            {/* Start Date */}
            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 text-purple-600" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              />
            </div>

            {/* Due Date */}
            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-purple-600" />
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="animate-slide-up delay-400">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Target className="w-4 h-4 inline mr-1 text-purple-600" />
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
                <option value="Critical">Critical</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
            </div>
          </div>

          {/* Team Members */}
          <div className="animate-slide-up delay-500">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Users className="w-4 h-4 inline mr-1 text-purple-600" />
              Team Members
            </label>
            
            {/* Selected Members Preview */}
            {getSelectedMembers().length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {getSelectedMembers().map(member => (
                    <div
                      key={member.id}
                      className="inline-flex items-center bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-sm border-2 border-blue-200 transition-all duration-300 hover:scale-110 hover:shadow-md"
                    >
                      <span className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs flex items-center justify-center mr-2">
                        {member.avatar || member.name?.charAt(0)}
                      </span>
                      {member.name}
                      <button
                        type="button"
                        onClick={() => toggleTeamMember(member.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors duration-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Members */}
            <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-purple-200 rounded-lg p-3 bg-purple-50">
              {(availableTeamMembers || []).map(member => (
                <div
                  key={member.id}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${
                    formData.teamMembers.includes(member.id)
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                      : 'hover:bg-purple-100 border-2 border-transparent'
                  }`}
                  onClick={() => toggleTeamMember(member.id)}
                >
                  <input
                    type="checkbox"
                    checked={formData.teamMembers.includes(member.id)}
                    onChange={() => {}}
                    className="mr-3 h-4 w-4 text-purple-600 rounded focus:ring-purple-500 border-2 border-purple-300"
                  />
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-sm font-medium text-white mr-3">
                    {member.avatar || member.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="animate-slide-up delay-600">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1 text-purple-600" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                name="tagInput"
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
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full border-2 border-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-lg animate-bounce-in"
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

          {/* Objectives */}
          <div className="animate-slide-up delay-700">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Target className="w-4 h-4 inline mr-1 text-purple-600" />
              Key Objectives
            </label>
            <div className="flex gap-2 mb-2">
              <input
                name="objectiveInput"
                type="text"
                value={currentObjective}
                onChange={(e) => setCurrentObjective(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
                placeholder="Add a key objective"
              />
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 transition-all duration-300 hover:scale-110 hover:shadow-xl shadow-lg"
                onClick={addObjective}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.objectives.map((objective, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 transition-all duration-300 hover:scale-105 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs">
                      {index + 1}
                    </div>
                    <span className="text-gray-800">{objective}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-purple-200 animate-slide-up delay-800">
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-2 border-gray-500 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md animate-pulse-slow"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-2 border-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg animate-pulse-slow text-lg font-semibold"
            >
              {initialData ? 'Update Project 🚀' : 'Create Project 🚀'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;