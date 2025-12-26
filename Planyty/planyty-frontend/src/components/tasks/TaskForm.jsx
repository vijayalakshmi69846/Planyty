import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Plus, Trash2, Search } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import Button from '../ui/Button';
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import toast from 'react-hot-toast';
// TaskForm.jsx

const TaskForm = ({ onClose, onSubmit, projectId, task, isSubtask = false }) => {
  const { id: urlId } = useParams();

  // Use useMemo to ensure effectiveProjectId updates if props change
  const effectiveProjectId = React.useMemo(() => {
    // 1. Direct prop from KanbanBoard (The most reliable source)
    if (projectId) return projectId;
    
    // 2. Existing task project reference
    if (task?.project_id) return task.project_id;
    
    // 3. URL ID (e.g., /projects/14)
    if (urlId && !isNaN(urlId)) return urlId;
    
    return null;
  }, [projectId, task, urlId]);

  // Log to console every time the form opens to see what ID it has
  useEffect(() => {
    console.log("TaskForm Component Mounted. Resolved Project ID:", effectiveProjectId);
    if (!effectiveProjectId) {
      console.warn("WARNING: TaskForm has no Project ID. Save will fail.");
    }
  }, [effectiveProjectId]);
  const userStr = localStorage.getItem('planyty_user');
  const loggedInUser = userStr ? JSON.parse(userStr) : null;
  const currentUserId = loggedInUser?.id;

  const [formData, setFormData] = useState({
    title: task ? task.title : '',
    description: task ? task.description : '',
    priority: task ? task.priority : 'Medium',
    assigned_to: task ? (task.assigned_to || task.assignee?.id) : currentUserId,
    assigneeEmail: task ? (task.assignee?.email || '') : (loggedInUser?.email || ''),
    dueDate: task ? (task.due_date ? task.due_date.split('T')[0] : '') : '',
    tags: task ? task.tags?.map(t => t.name || t) || [] : [],
    subtasks: task ? (task.subtasks || []) : [],
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSearch = async (query) => {
    setFormData(prev => ({ ...prev, assigneeEmail: query }));
    if (query.length > 1) {
      try {
        const users = await userService.searchUsers(query);
        setUserSuggestions(users);
        setShowSuggestions(true);
      } catch (err) {
        console.error("User search failed:", err);
      }
    } else {
      setUserSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, { title: newSubtaskTitle.trim(), status: 'todo' }]
      }));
      setNewSubtaskTitle('');
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Force conversion to a base-10 integer
  const cleanProjectId = parseInt(effectiveProjectId, 10);

  // 2. Critical Check: If this is NaN or 0, the backend WILL reject it
  if (!cleanProjectId || isNaN(cleanProjectId)) {
    toast.error("Invalid Project selection. Please select a project again.");
    console.error("Submission blocked: Project ID is", effectiveProjectId);
    return;
  }

  setIsSubmitting(true);
  
  const payload = {
    title: formData.title.trim(),
    description: formData.description,
    priority: formData.priority,
    project_id: cleanProjectId, // Use the cleaned integer
    status: formData.status || 'todo',
    assigned_to: formData.assigned_to,
    due_date: formData.dueDate || null,
    tags: formData.tags,
    subtasks: formData.subtasks
  };

  try {
    let result;
    if (task?.id) {
      result = await taskService.updateTask(task.id, payload);
    } else {
      result = await taskService.createTask(payload);
    }
    onSubmit(result);
    onClose();
    toast.success("Task saved successfully!");
  } catch (error) {
    console.error("Backend Rejected Payload:", error.response?.data);
    toast.error(error.response?.data?.message || "Server Error: Could not save task");
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-200">
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-purple-800">
            {isSubtask ? 'Create New Subtask' : task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-red-100 rounded-full">
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">Task Title *</label>
            <input
              type="text" required value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg outline-none bg-purple-50/50 focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                <Flag className="w-4 h-4 mr-1 text-purple-500" /> Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg bg-white outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-1 text-purple-500" /> Assignee
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.assigneeEmail}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search by email..."
                  className="w-full px-4 py-2 pl-10 border-2 border-purple-200 rounded-lg outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              </div>
              
              {showSuggestions && userSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-purple-100 rounded-lg shadow-2xl max-h-40 overflow-y-auto">
                  {userSuggestions.map(user => (
                    <div 
                      key={user.id} 
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex flex-col border-b border-gray-50 last:border-0"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          assigned_to: user.id,
                          assigneeEmail: user.email 
                        });
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="font-bold text-purple-900 text-sm">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1 text-purple-500" /> Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">Subtasks</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text" value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-purple-200 rounded-lg outline-none"
                placeholder="What needs to be done?"
              />
              <Button type="button" onClick={handleAddSubtask} className="bg-green-500 text-white hover:bg-green-600">
                <Plus className="w-5 h-5"/>
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {formData.subtasks.map((st, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-700">{st.title}</span>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, subtasks: prev.subtasks.filter((_, i) => i !== idx)}))}>
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-purple-100">
            <Button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Task 🚀'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;