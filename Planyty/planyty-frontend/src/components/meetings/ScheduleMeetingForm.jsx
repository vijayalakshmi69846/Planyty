import React, { useState } from 'react';
import { X, Calendar, User, Folder, Users, Clock, ChevronDown, Mail } from 'lucide-react';
import Button from '../ui/Button';

const ScheduleMeetingForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    project: '',
    host: '',
    description: '',
    selectedAttendees: [],
    meetingLink: '',
  });

  const mockProjects = [
    { id: 1, name: 'Website Redesign' },
    { id: 2, name: 'Mobile App' },
    { id: 3, name: 'API Development' },
  ];

  const mockTeamMembers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: 'JS' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'SW' },
    { id: 5, name: 'David Brown', email: 'david@example.com', avatar: 'DB' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    // Generate meeting link
    const meetingLink = `https://meet.planyty.com/${Date.now()}`;
    
    onSubmit({
      ...formData,
      meetingLink,
      selectedAttendees: formData.selectedAttendees.map(id => 
        mockTeamMembers.find(member => member.id === id)
      )
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttendeeToggle = (attendeeId) => {
    setFormData(prev => ({
      ...prev,
      selectedAttendees: prev.selectedAttendees.includes(attendeeId)
        ? prev.selectedAttendees.filter(id => id !== attendeeId)
        : [...prev.selectedAttendees, attendeeId]
    }));
  };

  const sendInvites = () => {
    const selectedMembers = formData.selectedAttendees.map(id => 
      mockTeamMembers.find(member => member.id === id)
    );
    
    // Simulate sending emails
    console.log('Sending invites to:', selectedMembers);
    alert(`Invites sent to ${selectedMembers.length} team members!`);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(formData.meetingLink);
    alert('Meeting link copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-200 animate-float scrollbar-hide">
        <div className="flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-purple-800 animate-pulse-slow">
            Schedule New Meeting
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 animate-bounce-slow"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Meeting Title */}
          <div className="animate-slide-up delay-100">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              placeholder="Enter meeting title"
            />
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up delay-200">
            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Duration *
              </label>
              <div className="relative">
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 appearance-none pr-10"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Project and Host */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-300">
            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Folder className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Project *
              </label>
              <div className="relative">
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 appearance-none pr-10"
                >
                  <option value="">Select a project</option>
                  {mockProjects.map(project => (
                    <option key={project.id} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <User className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
                Meeting Host *
              </label>
              <div className="relative">
                <select
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105 appearance-none pr-10"
                >
                  <option value="">Select a host</option>
                  {mockTeamMembers.map(member => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Attendees - Team Members Selection */}
          <div className="animate-slide-up delay-400">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Users className="w-4 h-4 inline mr-1 text-purple-600 animate-bounce" />
              Invite Team Members
            </label>
            <div className="border-2 border-purple-300 rounded-lg p-3 max-h-32 overflow-y-auto bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105">
              {mockTeamMembers.map(member => (
                <label key={member.id} className="flex items-center space-x-3 py-2 hover:bg-purple-100 px-2 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.selectedAttendees.includes(member.id)}
                    onChange={() => handleAttendeeToggle(member.id)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {member.avatar}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">{member.name}</span>
                      <span className="text-xs text-gray-500 block">{member.email}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {formData.selectedAttendees.length} team members selected
            </div>
            
            {/* Send Invites Button */}
            {formData.selectedAttendees.length > 0 && (
              <Button
                type="button"
                onClick={sendInvites}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md animate-pulse-slow w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invites via Email
              </Button>
            )}
          </div>

          {/* Meeting Link (Generated after form submission) */}
          {formData.meetingLink && (
            <div className="animate-slide-up delay-500">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Meeting Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.meetingLink}
                  readOnly
                  className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg bg-purple-50 text-gray-600"
                  placeholder="Meeting link will be generated..."
                />
                <Button
                  type="button"
                  onClick={copyMeetingLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
                >
                  Copy Link
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="animate-slide-up delay-500">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Meeting Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50 transition-all duration-300 hover:scale-105 focus:scale-105"
              placeholder="Brief description of the meeting agenda..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 animate-slide-up delay-600">
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
              Schedule Meeting 🚀
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetingForm;