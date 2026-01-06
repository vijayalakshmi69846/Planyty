import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, User, Flag, Plus, Trash2, Search } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Button from '../ui/Button';
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import toast from 'react-hot-toast';

const TaskForm = ({ onClose, onSubmit, projectId, task, isSubtask = false }) => {
  const { id: urlId } = useParams();

  // DEBUG: See what the component receives immediately on pop-up
  useEffect(() => {
    console.log("🛠 TaskForm Received Props:", { propProjectId: projectId, taskProjectId: task?.project_id, urlId, isSubtask });
  }, []);

  // 1. LOCK IN THE ID: Capture whatever ID we have the moment the modal opens
  const initialProjectId = useRef(projectId || task?.project_id || urlId);

  const effectiveProjectId = useMemo(() => {
    return initialProjectId.current || projectId || task?.project_id || urlId;
  }, [projectId, task, urlId]);

  const userStr = localStorage.getItem('planyty_user');
  const loggedInUser = userStr ? JSON.parse(userStr) : null;

  const [formData, setFormData] = useState({
    title: task?.id ? task.title : '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    assigned_to: task?.assigned_to || task?.assignee?.id || loggedInUser?.id,
    assigneeEmail: task?.assignee?.email || loggedInUser?.email || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '', // Changed from dueDate to due_date
    tags: task?.tags?.map(t => t.name || t) || [],
    subtasks: task?.subtasks || [],
    status: task?.status || 'todo'
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("📝 TaskForm State Update:", {
      title: formData.title,
      projectId: effectiveProjectId,
      isSubmitting: isSubmitting,
      assigned_to: formData.assigned_to,
      assigneeEmail: formData.assigneeEmail
    });
  }, [formData.title, effectiveProjectId, isSubmitting, formData.assigned_to, formData.assigneeEmail]);

  const handleUserSearch = async (query) => {
    setFormData(prev => ({ ...prev, assigneeEmail: query }));
    if (query.length > 1) {
      try {
        const users = await userService.searchUsers(query);
        setUserSuggestions(users);
        setShowSuggestions(true);
      } catch (err) { console.error("Search error:", err); }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, { 
          title: newSubtaskTitle.trim(), 
          status: 'todo',
          assigned_to: null,
          due_date: '',
          priority: 'Medium'
        }]
      }));
      setNewSubtaskTitle('');
    }
  };
// TaskForm.jsx - handleSubmit update
const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  
  const cleanId = parseInt(effectiveProjectId, 10);
  
  // Create the payload object
  const payload = {
    title: formData.title.trim(),
    description: formData.description,
    priority: formData.priority,
    project_id: cleanId,
    status: formData.status,
    assigned_to: formData.assigned_to,
    due_date: formData.due_date || null,
    tags: formData.tags,
    subtasks: formData.subtasks // This will be empty for subtask-of-subtask
  };

  // NEW LOGIC: If this is a subtask form, do NOT hit the taskService
  if (isSubtask) {
    onSubmit(payload); // Pass payload back to TaskDetailModal's handleAddSubtask
    return; // Exit here
  }

  // Original logic for main tasks only
  setIsSubmitting(true);
  try {
    const result = task?.id 
      ? await taskService.updateTask(task.id, payload)
      : await taskService.createTask(payload);
    
    onSubmit(result);
    onClose();
    toast.success("Task saved successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not save task");
  } finally {
    setIsSubmitting(false);
  }
};
  const isButtonDisabled = isSubmitting || !formData.title.trim() || !effectiveProjectId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-purple-200">
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl font-semibold text-purple-800">
            {isSubtask ? 'Create Subtask' : (task?.id ? 'Edit Task' : 'Create New Task')}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-red-100 rounded-full">
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              {isSubtask ? 'Subtask Title *' : 'Task Title *'}
            </label>
            <input
              type="text" 
              required 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg outline-none bg-purple-50/50"
              placeholder={isSubtask ? "What needs to be done for this subtask?" : "What needs to be done?"}
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
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-purple-500" /> Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-sm font-medium text-purple-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-1 text-purple-500" /> Assignee
              </label>
              <input
                type="text"
                value={formData.assigneeEmail}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="Search email..."
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg"
              />
              {showSuggestions && userSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {userSuggestions.map(user => (
                    <div 
                      key={user.id} 
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b"
                      onClick={() => {
                        setFormData({ ...formData, assigned_to: user.id, assigneeEmail: user.email });
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="font-bold text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!isSubtask && (
              <div>
                <label className="text-sm font-medium text-purple-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg"
                >
                  <option value="todo">To Do</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg outline-none bg-purple-50/50 min-h-[100px]"
              placeholder="Add details about this task..."
            />
          </div>

          {/* Only show subtasks section for main tasks, not for subtask forms */}
          {!isSubtask && (
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">Subtasks</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text" 
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-purple-200 rounded-lg"
                  placeholder="Add a step..."
                />
                <Button 
                  type="button" 
                  onClick={handleAddSubtask} 
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  <Plus className="w-5 h-5"/>
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.subtasks.map((st, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border">
                    <span className="text-sm">{st.title}</span>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({...prev, subtasks: prev.subtasks.filter((_, i) => i !== idx)}))}
                    >
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags section removed for brevity - keep your existing if needed */}

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isButtonDisabled} 
              className={`flex-1 bg-purple-600 text-white hover:bg-purple-700 ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Saving...' : (isSubtask ? 'Save Subtask' : 'Save Task 🚀')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;