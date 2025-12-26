import React, { useState, useEffect, useMemo } from 'react';
import { X, Edit, Trash2, Plus, ChevronDown, ChevronRight, Calendar, User, Flag, Loader2 } from 'lucide-react';
import TaskForm from './TaskForm';
import Button from '../ui/Button';
import SubtaskItem from './SubtaskItem';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TaskDetailModal = ({ task, onClose, onUpdateTask, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [currentTask, setCurrentTask] = useState(task);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  // Check role for Privacy
  const { isMember, canManage } = useMemo(() => {
    const userStr = localStorage.getItem('planyty_user');
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      const role = (user?.role || '').toLowerCase();
      return {
        isMember: role === 'member',
        canManage: role === 'admin' || role === 'team_lead'
      };
    } catch (e) { return { isMember: true, canManage: false }; }
  }, []);

  const handleUpdate = (updatedTask) => {
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
    setIsEditing(false);
  };

  const handleAddSubtask = async (subtaskData) => {
    try {
      // FIX 400 ERROR: Clean the payload to ensure IDs are numbers, not objects
      const payload = {
        title: subtaskData.title,
        description: subtaskData.description,
        assigned_to: typeof subtaskData.assigned_to === 'object' ? subtaskData.assigned_to.id : subtaskData.assigned_to,
        status: 'not yet begun',
        due_date: subtaskData.due_date,
        priority: subtaskData.priority || 'medium'
      };

      const response = await api.post(`/tasks/${currentTask.id}/subtasks`, payload);
      const updatedTask = {
        ...currentTask,
        subtasks: [...(currentTask.subtasks || []), response.data]
      };
      handleUpdate(updatedTask);
      setShowSubtaskForm(false);
      toast.success("Subtask added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add subtask. Check console for 400 errors.");
    }
  };

  const handleUpdateSubtask = async (updatedSubtask) => {
    try {
      // Ensure we hit the correct PUT endpoint
      const response = await api.put(`/tasks/subtasks/${updatedSubtask.id}`, updatedSubtask);
      const updatedSubtasks = currentTask.subtasks.map(s => 
        s.id === updatedSubtask.id ? response.data : s
      );
      handleUpdate({ ...currentTask, subtasks: updatedSubtasks });
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Inside TaskDetailModal.jsx

const handleDeleteSubtask = async (subtaskId) => {
  try {
    // TRY THIS: Remove the /tasks/ prefix if your route is /api/subtasks/:id
    await api.delete(`/subtasks/${subtaskId}`); 
    
    // If that still fails, check if your backend needs:
    // await api.delete(`/tasks/${currentTask.id}/subtasks/${subtaskId}`);

    const updatedSubtasks = (currentTask.subtasks || []).filter(s => s.id !== subtaskId);
    handleUpdate({ ...currentTask, subtasks: updatedSubtasks });
    toast.success("Subtask removed");
  } catch (err) {
    console.error("Delete Error:", err.response);
    toast.error(`Delete failed: ${err.response?.status === 404 ? 'Route not found' : 'Server error'}`);
  }
};

  const subtasks = currentTask.subtasks || [];
  const completedSubtasks = subtasks.filter(sub => sub.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-purple-200" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-purple-800">{currentTask.title}</h2>
          <div className="flex items-center gap-3">
            {canManage && (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-yellow-100 rounded-full transition-colors"><Edit className="w-5 h-5 text-yellow-500" /></button>
                <button onClick={onDelete} className="p-2 hover:bg-red-100 rounded-full transition-colors"><Trash2 className="w-5 h-5 text-red-500" /></button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
        </div>

        {isEditing ? (
          <div className="p-6 overflow-y-auto">
            <TaskForm task={currentTask} onSubmit={handleUpdate} onClose={() => setIsEditing(false)} />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-3 gap-8 overflow-y-auto">
            <div className="col-span-2">
              <section className="mb-6">
                <h3 className="text-sm font-bold text-purple-700 uppercase mb-2">Description</h3>
                <p className="text-gray-600 bg-purple-50/30 p-4 rounded-lg border border-purple-100 min-h-[100px]">
                  {currentTask.description || 'No description provided.'}
                </p>
              </section>

              <section>
                <div className="flex justify-between items-center mb-3">
                  <button onClick={() => setSubtasksExpanded(!subtasksExpanded)} className="flex items-center gap-2 font-bold text-purple-700">
                    {subtasksExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    Subtasks ({completedSubtasks}/{totalSubtasks})
                  </button>
                  {canManage && (
                    <Button onClick={() => setShowSubtaskForm(true)} className="bg-purple-600 text-white text-xs py-1.5 px-3 rounded-lg">
                      <Plus className="w-4 h-4 mr-1 inline" /> Add Subtask
                    </Button>
                  )}
                </div>

                {totalSubtasks > 0 && (
                  <div className="w-full bg-purple-100 rounded-full h-2 mb-4">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all" style={{ width: `${subtaskProgress}%` }}></div>
                  </div>
                )}

                {showSubtaskForm && (
                  <div className="mb-4 border-2 border-dashed border-purple-200 p-4 rounded-xl bg-purple-50/50">
                    <TaskForm isSubtask={true} onSubmit={handleAddSubtask} onClose={() => setShowSubtaskForm(false)} />
                  </div>
                )}

                {subtasksExpanded && (
                  <div className="space-y-2">
                    {subtasks.map(sub => (
                      <SubtaskItem 
                        key={sub.id} 
                        subtask={sub} 
                        onUpdate={handleUpdateSubtask} 
                        onDelete={handleDeleteSubtask} 
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* SIDEBAR */}
            <div className="col-span-1 space-y-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['todo', 'in progress', 'completed'].map(s => (
                    <button key={s} 
                      disabled={isMember && currentTask.assigned_to !== loggedInUser?.id}
                      onClick={() => handleUpdate({ ...currentTask, status: s })} 
                      className={`px-3 py-1 text-xs rounded-full border-2 ${currentTask.status === s ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white text-gray-500'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Assignee</h3>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <User className="w-4 h-4 text-purple-600" />
                  {currentTask.assignee?.name || 'Unassigned'}
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