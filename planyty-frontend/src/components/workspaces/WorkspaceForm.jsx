import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Palette } from 'lucide-react';

const WorkspaceForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  // Initialize state with default or initial data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'purple'
  });

  // Effect to sync form when editing existing data or opening/closing
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        description: initialData?.description || '',
        color: initialData?.color || 'purple'
      });
    }
  }, [isOpen, initialData]);

  const colors = [
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // onSubmit here calls handleCreateWorkspace in Workspaces.jsx
    // which uses the authorized api.js (Port 5000)
    onSubmit(formData); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-purple-100 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-purple-800">
            {initialData ? 'Edit Workspace' : 'Create New Workspace'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-red-500 group-hover:rotate-90 transition-all" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Workspace Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50/30 outline-none transition-all"
              placeholder="e.g., Marketing Team"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50/30 outline-none transition-all resize-none"
              placeholder="Describe the workspace purpose..."
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Palette className="w-4 h-4 mr-2 text-purple-600" />
              Identify with a Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`aspect-square rounded-full ${color.class} transition-all duration-200 flex items-center justify-center ${
                    formData.color === color.value 
                      ? 'ring-4 ring-purple-200 scale-110 shadow-md' 
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={color.label}
                >
                  {formData.color === color.value && (
                    <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-all"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              {initialData ? 'Save Changes' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceForm;