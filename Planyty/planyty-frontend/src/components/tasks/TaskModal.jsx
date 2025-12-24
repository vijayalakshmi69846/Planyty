import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { X, Calendar, Users, Tag, ListChecks } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, task }) => {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Task: ${task.title}`}>
      <div className="space-y-4 p-4">
        <div className="flex items-center space-x-2">
          <ListChecks size={20} className="text-purple-500" />
          <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar size={16} className="text-purple-500" />
              <span>N/A</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <div className="flex items-center space-x-1 text-gray-600">
            <Users size={16} className="text-purple-500" />
            <span>Me</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full flex items-center"
              >
                <Tag size={14} className="mr-1 text-purple-500" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-gray-600 bg-purple-50 p-3 rounded-md min-h-[100px]">
            {/* Placeholder for task description */}
            This is a placeholder for the detailed description of the task "{task.title}".
            It should include all necessary context, requirements, and acceptance criteria.
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-lg font-semibold mb-2">Comments</h4>
          <div className="space-y-2">
            <div className="p-3 bg-purple-100 rounded-md text-sm">
              <p className="font-medium text-purple-800">User 1:</p>
              <p>Starting work on this task now.</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-md text-sm">
              <p className="font-medium text-purple-800">User 2:</p>
              <p>Need clarification on the design specs for the login page.</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <Input placeholder="Add a comment..." className="flex-grow" />
            <Button variant="primary">Post</Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary">
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;