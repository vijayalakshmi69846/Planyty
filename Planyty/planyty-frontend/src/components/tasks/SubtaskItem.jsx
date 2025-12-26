import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, CheckCircle, Circle, Trash2, User, Plus } from 'lucide-react';
import TaskForm from './TaskForm';

const SubtaskItem = ({ subtask, onUpdate, onDelete, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  // --- PRIVACY & PERMISSION LOGIC ---
  const { loggedInUser, canManage } = useMemo(() => {
    const userStr = localStorage.getItem('planyty_user');
    try {
      const user = userStr ? JSON.parse(userStr) : null;
      const role = (user?.role || '').toLowerCase();
      return {
        loggedInUser: user,
        canManage: role === 'admin' || role === 'team_lead'
      };
    } catch (e) {
      return { loggedInUser: null, canManage: false };
    }
  }, []);

  // --- STATUS AUTO-CALCULATION ---
  // If this subtask has nested children, its status depends on them
  useEffect(() => {
    const nestedSubtasks = subtask.subtasks || [];
    if (nestedSubtasks.length > 0 && typeof onUpdate === 'function') {
      const allCompleted = nestedSubtasks.every(s => s.status === 'completed');
      const anyInProgress = nestedSubtasks.some(s => s.status === 'in progress' || s.status === 'completed');

      let calculatedStatus = subtask.status;
      if (allCompleted) calculatedStatus = 'completed';
      else if (anyInProgress) calculatedStatus = 'in progress';
      else calculatedStatus = 'not yet begun';

      if (calculatedStatus !== subtask.status) {
        onUpdate({ ...subtask, status: calculatedStatus });
      }
    }
  }, [subtask.subtasks, subtask.status, onUpdate]);

  const handleStatusChange = (e, newStatus) => {
    e.stopPropagation();
    // Allow status change if user is Admin/Lead OR if they are the assignee
    const isAssignee = subtask.assigned_to === loggedInUser?.id;
    
    if (canManage || isAssignee) {
      if (onUpdate) onUpdate({ ...subtask, status: newStatus });
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(subtask.id);
  };

  const handleAddNestedSubtask = (subtaskData) => {
    // FIX 400 ERROR: Clean the nested subtask payload
    const newNestedSubtask = {
      ...subtaskData,
      id: `temp-${Date.now()}`, 
      status: 'not yet begun',
      parent_subtask_id: subtask.id,
      // Ensure assigned_to is a simple ID
      assigned_to: typeof subtaskData.assigned_to === 'object' 
        ? subtaskData.assigned_to.id 
        : subtaskData.assigned_to
    };
    
    if (onUpdate) {
      onUpdate({
        ...subtask,
        subtasks: [...(subtask.subtasks || []), newNestedSubtask]
      });
    }
    setShowSubtaskForm(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in progress': return <Circle className="w-5 h-5 text-yellow-500 fill-current" />;
      default: return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const marginLeft = level * 24;

  return (
    <div 
      className="bg-white rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-2" 
      style={{ marginLeft: `${marginLeft}px` }}
    >
      {/* --- MAIN ITEM ROW --- */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-50/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div onClick={(e) => handleStatusChange(e, subtask.status === 'completed' ? 'not yet begun' : 'completed')}>
            {getStatusIcon(subtask.status)}
          </div>
          <span className={`font-medium flex-1 truncate ${subtask.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {subtask.title}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Assignee Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100/50 rounded-md text-xs text-purple-700">
            <User className="w-3 h-3" />
            <span className="max-w-[80px] truncate">{subtask.assignee?.name || subtask.assignee_name || 'Unassigned'}</span>
          </div>
          
          {/* Management Actions - Hidden for standard members */}
          {canManage && (
            <div className="flex items-center gap-1 border-l pl-2 border-purple-200">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSubtaskForm(true); }} 
                className="p-1.5 hover:bg-purple-200 rounded-full text-purple-600 transition-colors"
                title="Add nested subtask"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDelete} 
                className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                title="Delete subtask"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
        </div>
      </div>

      {/* --- EXPANDED DETAILS --- */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-purple-100 pt-3 bg-gray-50/30">
          {subtask.description && (
            <div className="mb-4">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</h4>
               <p className="text-sm text-gray-600 italic">{subtask.description}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-tight">Set Status:</span>
              <div className="flex gap-1">
                {['not yet begun', 'in progress', 'completed'].map(s => (
                  <button
                    key={s}
                    onClick={(e) => handleStatusChange(e, s)}
                    className={`px-3 py-1 text-[10px] rounded-full border transition-all font-semibold uppercase ${
                      subtask.status === s 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {s === 'not yet begun' ? 'To Do' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nested Subtasks List */}
          <div className="space-y-2">
            {subtask.subtasks && subtask.subtasks.map(nested => (
              <SubtaskItem
                key={nested.id}
                subtask={nested}
                onUpdate={(updated) => {
                  const updatedChildren = subtask.subtasks.map(s => s.id === nested.id ? updated : s);
                  onUpdate({ ...subtask, subtasks: updatedChildren });
                }}
                onDelete={(id) => {
                  const filteredChildren = subtask.subtasks.filter(s => s.id !== id);
                  onUpdate({ ...subtask, subtasks: filteredChildren });
                }}
                level={level + 1}
              />
            ))}
          </div>

          {/* Nested Subtask Form */}
          {showSubtaskForm && (
            <div className="mt-4 p-4 bg-white border-2 border-dashed border-purple-200 rounded-xl animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-purple-800">New Nested Subtask</span>
              </div>
              <TaskForm 
                isSubtask={true} 
                onClose={() => setShowSubtaskForm(false)} 
                onSubmit={handleAddNestedSubtask} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubtaskItem;