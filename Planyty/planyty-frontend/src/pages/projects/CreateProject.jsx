import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Calendar, Users, Target, Folder, ChevronDown, Tag, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

const CreateProject = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'Medium',
    team: '',
    tags: [],
    objectives: [],
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentObjective, setCurrentObjective] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Here you would typically make an API call to create the project
    console.log('Creating project:', formData);
    
    // Navigate back to the workspace
    navigate(`/workspaces/${workspaceId}`);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Mock teams for dropdown
  const mockTeams = [
    { id: 1, name: 'Frontend Team' },
    { id: 2, name: 'Backend Team' },
    { id: 3, name: 'Design Team' },
    { id: 4, name: 'QA Team' },
    { id: 5, name: 'DevOps Team' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => navigate(`/workspaces/${workspaceId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Back to Workspace</span>
            </button>

            <div className="border-l border-gray-300 h-6"></div>

            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Create New Project
              </h1>
              <p className="text-xs text-gray-600">
                Create a new project to organize tasks and collaborate with your team
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div>
            <Button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-all duration-200"
            >
              <Folder className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        </div>
      </div>

      {/* Project Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 text-lg"
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
                rows={4}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
                placeholder="Describe your project goals and objectives..."
              />
            </div>

            {/* Date Range & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up delay-300">
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

              {/* End Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1 text-purple-600" />
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
                />
              </div>

              {/* Priority */}
              <div className="relative">
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
            </div>

            {/* Team Assignment */}
            <div className="animate-slide-up delay-400">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Users className="w-4 h-4 inline mr-1 text-purple-600" />
                Assign Team
              </label>
              <div className="relative">
                <select
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 appearance-none pr-10"
                >
                  <option value="">Select a team</option>
                  {mockTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>

            {/* Tags */}
            <div className="animate-slide-up delay-500">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1 text-purple-600" />
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
                  className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-xl shadow-lg"
                  onClick={addTag}
                >
                  Add ✨
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-500 text-white text-sm rounded-full border-2 border-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-lg"
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
            <div className="animate-slide-up delay-600">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Target className="w-4 h-4 inline mr-1 text-purple-600" />
                Key Objectives
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentObjective}
                  onChange={(e) => setCurrentObjective(e.target.value)}
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
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
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
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 animate-slide-up delay-700 border-t border-purple-200">
              <Button
                type="button"
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-500 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
                onClick={() => navigate(`/workspaces/${workspaceId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-2 border-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg text-lg font-semibold"
              >
                Create Project 🚀
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;