import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Folder, Users, Clock, ChevronDown, Mail, Loader, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { meetingService } from '../../services/meetingService';
import { projectService } from '../../services/projectService';

// Create an inline FormToast component
const FormToast = ({ message, type = 'success', onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const bgColor = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
    info: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
  };

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  const icons = {
    success: CheckCircle,
    error: X,
    info: Mail
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-6 z-60 animate-slide-in-right">
      <div className={`${bgColor[type]} border rounded-xl shadow-xl max-w-md backdrop-blur-sm`}>
        <div className="flex p-4">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColor[type]}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {autoClose && (
          <div className={`h-1 w-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} animate-progress`} />
        )}
      </div>
    </div>
  );
};

const ScheduleMeetingForm = ({ isOpen, onClose, onSubmit, workspaceId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    project_id: '',
    workspace_id: workspaceId
  });

  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  // Fetch projects when form opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchProjects();
    }
  }, [isOpen, workspaceId]);

  // Fetch project members when project is selected
  useEffect(() => {
    if (formData.project_id) {
      fetchProjectMembers(formData.project_id);
    } else {
      setProjectMembers([]);
    }
  }, [formData.project_id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  const closeToast = () => {
    setToast(null);
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await meetingService.getProjectsForDropdown(workspaceId);
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProjectMembers = async (projectId) => {
    try {
      const response = await meetingService.getProjectMembers(projectId);
      setProjectMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
      showToast('Failed to load project members', 'error');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (end <= start) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await meetingService.createMeeting(formData);
      
      if (onSubmit) {
        onSubmit(response.data);
      }
      
      // Show professional success message
      showToast(
        projectMembers.length > 0 
          ? `Meeting created! Invitations sent to ${projectMembers.length} member(s)`
          : 'Meeting created successfully!',
        'success'
      );
      
      // Reset form and close after a delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      const errorMessage = error.message || 'Failed to create meeting';
      showToast(errorMessage, 'error');
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      project_id: '',
      workspace_id: workspaceId
    });
    setErrors({});
    setProjectMembers([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <FormToast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Schedule New Meeting
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Create a meeting and invite team members
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Meeting Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all ${
                  errors.title 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
                placeholder="Enter meeting title"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2 text-purple-600" />
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all ${
                    errors.start_time 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
                {errors.start_time && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.start_time}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Clock className="w-4 h-4 inline mr-2 text-blue-600" />
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all ${
                    errors.end_time 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
                {errors.end_time && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Folder className="w-4 h-4 inline mr-2 text-green-600" />
                Select Project
              </label>
              <div className="relative">
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all bg-white"
                  disabled={loadingProjects}
                >
                  <option value="" className="text-gray-500">No Project (General Meeting)</option>
                  {loadingProjects ? (
                    <option disabled>Loading projects...</option>
                  ) : (
                    projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-600 mt-2 px-1">
                {formData.project_id 
                  ? "All members with tasks in this project will be automatically invited"
                  : "Select a project to automatically invite its members"
                }
              </p>
            </div>

            {/* Project Members Preview */}
            {formData.project_id && projectMembers.length > 0 && (
              <div className="animate-slide-up">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Users className="w-4 h-4 inline mr-2 text-blue-600" />
                  Project Members (Will be invited)
                </label>
                <div className="border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
                  <div className="space-y-3">
                    {projectMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{member.name}</span>
                            <span className="text-xs text-gray-500">{member.email}</span>
                          </div>
                        </div>
                        <Mail className="w-4 h-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center mt-3 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {projectMembers.length} project member(s) will receive email invitations
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Meeting Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all resize-none"
                placeholder="Brief description of the meeting agenda, topics to discuss, goals, etc..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-gray-700 border border-gray-300 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule Meeting & Send Invites
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ScheduleMeetingForm;