import React, { useState, useEffect, useMemo } from 'react';
import { X, Edit, Trash2, Plus, ChevronDown, ChevronRight, Calendar, User, Flag, Loader2, TrendingUp } from 'lucide-react';
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
  const [manualProgress, setManualProgress] = useState(0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
    // Calculate initial progress based on subtasks or task status
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(sub => sub.status === 'completed').length;
    const totalSubtasks = subtasks.length;
    
    if (totalSubtasks > 0) {
      setManualProgress(Math.round((completedSubtasks / totalSubtasks) * 100));
    } else {
      // If no subtasks, set progress based on task status
      const progressMap = {
        'todo': 0,
        'in progress': 50,
        'completed': 100
      };
      setManualProgress(progressMap[task.status] || 0);
    }
  }, [task]);

  // Get logged in user
  const loggedInUser = useMemo(() => {
    const userStr = localStorage.getItem('planyty_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Check role for Privacy
  const { isMember, canManage } = useMemo(() => {
    const role = (loggedInUser?.role || '').toLowerCase();
    return {
      isMember: role === 'member',
      canManage: role === 'admin' || role === 'team_lead'
    };
  }, [loggedInUser]);
const canEditTask = useMemo(() => {
  if (canManage) return true;
  // Using == instead of === helps avoid string vs number issues
  return isMember && currentTask.assigned_to == loggedInUser?.id;
}, [canManage, isMember, currentTask.assigned_to, loggedInUser?.id]);
  const canAddSubtask = useMemo(() => {
    if (canManage) return true;
    if (isMember && currentTask.assigned_to === loggedInUser?.id) return true;
    return false;
  }, [canManage, isMember, currentTask.assigned_to, loggedInUser?.id]);

  // In TaskDetailModal.jsx, update filteredSubtasks:
const filteredSubtasks = useMemo(() => {
  const subtasks = currentTask.subtasks || [];
  
  if (!isMember || canManage) {
    return subtasks;
  }
  
  // Members see subtasks assigned to them
  return subtasks.filter(subtask => {
    return subtask.assigned_to === loggedInUser?.id || 
           subtask.subtaskAssignee?.id === loggedInUser?.id;
  });
}, [currentTask.subtasks, isMember, canManage, loggedInUser?.id]);
  const handleUpdate = (updatedTask) => {
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
    setIsEditing(false);
  };

  const handleAddSubtask = async (subtaskData) => {
    try {
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
      console.error("Add subtask error:", err);
      toast.error("Failed to add subtask. Please try again.");
    }
  };

  const handleUpdateSubtask = async (updatedSubtask) => {
    try {
      const response = await api.put(`/subtasks/${updatedSubtask.id}`, updatedSubtask);
      const updatedSubtasks = currentTask.subtasks.map(s => 
        s.id === updatedSubtask.id ? response.data : s
      );
      handleUpdate({ ...currentTask, subtasks: updatedSubtasks });
      toast.success("Subtask updated!");
    } catch (err) {
      console.error("Update subtask error:", err);
      toast.error("Failed to update subtask.");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await api.delete(`/subtasks/${subtaskId}`);
      const updatedSubtasks = (currentTask.subtasks || []).filter(s => s.id !== subtaskId);
      handleUpdate({ ...currentTask, subtasks: updatedSubtasks });
      toast.success("Subtask removed");
    } catch (err) {
      console.error("Delete Error:", err.response);
      toast.error(`Delete failed: ${err.response?.status === 404 ? 'Route not found' : 'Server error'}`);
    }
  };

  // Handle task status update
  const handleTaskStatusUpdate = async (newStatus) => {
    if (!canEditTask) {
      toast.error("You don't have permission to update this task");
      return;
    }

    try {
      const response = await api.put(`/tasks/${currentTask.id}`, {
        status: newStatus
      });
      
      handleUpdate(response.data);
      toast.success(`Task status updated to ${newStatus}!`);
    } catch (err) {
      console.error("Update task status error:", err);
      toast.error("Failed to update task status.");
    }
  };
const handleManualProgressUpdate = async (newProgress) => {
  if (!canEditTask) {
    toast.error("You don't have permission to update progress");
    return;
  }

  setIsUpdatingProgress(true);
  try {
    let newStatus = currentTask.status;
    if (newProgress === 100) newStatus = 'completed';
    else if (newProgress > 0) newStatus = 'in progress';
    else newStatus = 'todo';

    // FIX: Send both status and progress to the backend
    const response = await api.put(`/tasks/${currentTask.id}`, {
      status: newStatus,
      progress: newProgress // UNCOMMENT THIS LINE
    });
    
    setManualProgress(newProgress);
    handleUpdate(response.data);
    toast.success(`Progress updated to ${newProgress}%!`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to update progress.");
  } finally {
    setIsUpdatingProgress(false);
  }
};
  // Quick progress buttons
  const handleQuickProgress = (progress) => {
    if (!canEditTask) {
      toast.error("You don't have permission to update progress");
      return;
    }
    setManualProgress(progress);
    handleManualProgressUpdate(progress);
  };

  const completedSubtasks = filteredSubtasks.filter(sub => sub.status === 'completed').length;
  const totalSubtasks = filteredSubtasks.length;
  const subtaskProgress = totalSubtasks >
   0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Determine overall progress to display
const overallProgress = totalSubtasks > 0 ? subtaskProgress : manualProgress;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-purple-200" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-semibold text-purple-800">{currentTask.title}</h2>
            {canEditTask && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Progress:</span>
                </div>
                <div className="w-40 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-purple-800">{Math.round(overallProgress)}%</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canEditTask && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-2 hover:bg-yellow-100 rounded-full transition-colors"
                title="Edit Task"
              >
                <Edit className="w-5 h-5 text-yellow-500" />
              </button>
            )}
            {canManage && (
              <button 
                onClick={onDelete} 
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="p-6 overflow-y-auto">
            <TaskForm 
              task={currentTask} 
              projectId={currentTask.project_id}
              onSubmit={handleUpdate} 
              onClose={() => setIsEditing(false)} 
            />
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
                  <button 
                    onClick={() => setSubtasksExpanded(!subtasksExpanded)} 
                    className="flex items-center gap-2 font-bold text-purple-700 hover:text-purple-800"
                  >
                    {subtasksExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    Subtasks ({completedSubtasks}/{totalSubtasks})
                    {isMember && !canManage && (
                      <span className="text-xs text-gray-500 font-normal">
                        (Assigned to you)
                      </span>
                    )}
                  </button>
                  {canAddSubtask && (
                    <Button 
                      onClick={() => setShowSubtaskForm(true)} 
                      className="bg-purple-600 text-white text-xs py-1.5 px-3 rounded-lg hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-1 inline" /> Add Subtask
                    </Button>
                  )}
                </div>

                {totalSubtasks > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-purple-700 mb-2">
                      <span>Subtask Progress</span>
                      <span className="font-bold">{Math.round(subtaskProgress)}%</span>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${subtaskProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {showSubtaskForm && (
                  <div className="mb-4 border-2 border-dashed border-purple-200 p-4 rounded-xl bg-purple-50/50">
                    <TaskForm 
                      isSubtask={true} 
                      projectId={currentTask.project_id}
                      onSubmit={handleAddSubtask} 
                      onClose={() => setShowSubtaskForm(false)} 
                    />
                  </div>
                )}

                {subtasksExpanded && (
                  <div className="space-y-2">
                    {filteredSubtasks.length > 0 ? (
                      filteredSubtasks.map(sub => (
                        <SubtaskItem 
                          key={sub.id} 
                          subtask={sub} 
                          onUpdate={handleUpdateSubtask} 
                          onDelete={handleDeleteSubtask} 
                          loggedInUserId={loggedInUser?.id}
                          isMember={isMember}
                          canManage={canManage}
                        />
                      ))
                    ) : isMember && !canManage ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No subtasks assigned to you yet.</p>
                        <p className="text-sm mt-1">Contact your team lead if you need work assigned.</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No subtasks created yet.</p>
                        <p className="text-sm mt-1">Click "Add Subtask" to create one.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* SIDEBAR */}
            <div className="col-span-1 space-y-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              {/* Task Status */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Task Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['todo', 'in progress', 'completed'].map(s => (
                    <button 
                      key={s} 
                      disabled={!canEditTask}
                      onClick={() => handleTaskStatusUpdate(s)} 
                      className={`px-3 py-1 text-xs rounded-full border-2 transition-colors ${
                        currentTask.status === s 
                          ? 'bg-purple-600 border-purple-600 text-white' 
                          : 'bg-white text-gray-500 hover:border-purple-300'
                      } ${!canEditTask ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {!canEditTask && isMember && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Only assigned member can update status
                  </p>
                )}
                {currentTask.assigned_to === loggedInUser?.id && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ You are assigned to this task
                  </p>
                )}
              </div>
              
              {/* Manual Progress Control - Only for assigned members & admins */}
              {canEditTask && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Update Progress
                  </h3>
                  
                  {/* Progress Slider */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress: {manualProgress}%</span>
                      <button 
                        onClick={() => handleManualProgressUpdate(manualProgress)}
                        disabled={isUpdatingProgress}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isUpdatingProgress ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={manualProgress}
                      onChange={(e) => setManualProgress(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Quick Progress Buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[0, 25, 50, 75, 100].map(progress => (
                      <button
                        key={progress}
                        onClick={() => handleQuickProgress(progress)}
                        disabled={isUpdatingProgress}
                        className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                          manualProgress === progress 
                            ? 'bg-purple-600 text-white border-purple-600' 
                            : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                        } ${isUpdatingProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {progress}%
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const newProgress = manualProgress === 100 ? 0 : 100;
                        handleQuickProgress(newProgress);
                      }}
                      disabled={isUpdatingProgress}
                      className={`px-2 py-1.5 text-xs rounded-lg border transition-colors col-span-2 ${
                        manualProgress === 100 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                      } ${isUpdatingProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {manualProgress === 100 ? 'Mark as Todo' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Task Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center">
                  <User className="w-3 h-3 mr-1" /> Assignee
                </h3>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <User className="w-4 h-4 text-purple-600" />
                  {currentTask.assignee?.name || 'Unassigned'}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center">
                  <Flag className="w-3 h-3 mr-1" /> Priority
                </h3>
                <div className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                  currentTask.priority === 'High' ? 'bg-red-100 text-red-700' :
                  currentTask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {currentTask.priority || 'Medium'}
                </div>
              </div>
              
              {currentTask.due_date && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" /> Due Date
                  </h3>
                  <div className="text-gray-700 font-medium">
                    {new Date(currentTask.due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {/* Progress Summary */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Progress Summary</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Current Status</span>
                      <span className={`font-medium ${
                        currentTask.status === 'completed' ? 'text-green-600' :
                        currentTask.status === 'in progress' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {currentTask.status?.toUpperCase() || 'TO DO'}
                      </span>
                    </div>
                  </div>
                  
                  {totalSubtasks > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Subtasks Completed</span>
                        <span className="font-medium text-purple-600">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${subtaskProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-bold text-purple-700">{Math.round(overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                  </div>
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