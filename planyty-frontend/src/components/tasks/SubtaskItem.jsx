import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, CheckCircle, Circle, Trash2, User, Plus, Calendar, Flag } from 'lucide-react';
import TaskForm from './TaskForm';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SubtaskItem = ({ subtask, onUpdate, onDelete, level = 0, loggedInUserId, isMember, canManage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter nested subtasks for members
  const filteredNestedSubtasks = useMemo(() => {
    const nestedSubtasks = subtask.subtasks || [];
    
    if (!isMember || canManage) {
      // Admin/team lead sees all nested subtasks
      return nestedSubtasks;
    }
    
    // Members only see nested subtasks assigned to them
    return nestedSubtasks.filter(nested => 
      nested.assigned_to === loggedInUserId || 
      nested.subtaskAssignee?.id === loggedInUserId
    );
  }, [subtask.subtasks, isMember, canManage, loggedInUserId]);

  // Check if user can edit this subtask
  const canEditSubtask = useMemo(() => {
    if (canManage) return true;
    if (isMember && subtask.assigned_to === loggedInUserId) return true;
    return false;
  }, [canManage, isMember, subtask.assigned_to, loggedInUserId]);

  const handleStatusChangeWithoutEvent = async (newStatus) => {
    if (!canEditSubtask) {
      toast.error("You don't have permission to update this subtask");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put(`/subtasks/${subtask.id}`, {
        ...subtask,
        status: newStatus
      });
      
      if (onUpdate) onUpdate(response.data);
      toast.success("Subtask updated!");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update subtask");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (e, newStatus) => {
    e.stopPropagation();
    await handleStatusChangeWithoutEvent(newStatus);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!canManage) {
      toast.error("Only admins can delete subtasks");
      return;
    }
    
    if (onDelete) {
      try {
        setIsUpdating(true);
        await onDelete(subtask.id);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleAddNestedSubtask = async (subtaskData) => {
    try {
      const payload = {
        ...subtaskData,
        assigned_to: typeof subtaskData.assigned_to === 'object' 
          ? subtaskData.assigned_to.id 
          : subtaskData.assigned_to
      };

      // For nested subtasks, we need to handle them locally since your API might not support nested
      if (onUpdate) {
        const newNestedSubtask = {
          ...payload,
          id: `temp-${Date.now()}`,
          status: 'not yet begun',
          parent_subtask_id: subtask.id,
          subtasks: []
        };
        
        onUpdate({
          ...subtask,
          subtasks: [...(subtask.subtasks || []), newNestedSubtask]
        });
      }
      setShowSubtaskForm(false);
      toast.success("Nested subtask added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add nested subtask");
    }
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
      {/* MAIN ITEM ROW */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-50/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (!canEditSubtask) {
                toast.error("You don't have permission to update this subtask");
                return;
              }
              const newStatus = subtask.status === 'completed' ? 'not yet begun' : 'completed';
              handleStatusChange(e, newStatus);
            }}
            className={isUpdating ? 'opacity-50 cursor-not-allowed' : canEditSubtask ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'}
            title={canEditSubtask ? "Click to toggle status" : "You don't have permission to update"}
          >
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
  <span className="max-w-[80px] truncate">
    {/* Use subtaskAssignee to match your controller */}
    {subtask.subtaskAssignee?.name || subtask.assignee_name || 'Unassigned'}
  </span>
  {/* Add a "Me" label if it's her */}
  {(subtask.assigned_to === loggedInUserId || subtask.subtaskAssignee?.id === loggedInUserId) && (
    <span className="ml-1 text-[10px] bg-green-500 text-white px-1 rounded">Me</span>
  )}
</div>
          
          {/* Due Date Badge */}
          {subtask.due_date && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100/50 rounded-md text-xs text-blue-700">
              <Calendar className="w-3 h-3" />
              <span>{new Date(subtask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}

          {/* Management Actions */}
          {canManage && (
            <div className="flex items-center gap-1 border-l pl-2 border-purple-200">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSubtaskForm(true); }} 
                className="p-1.5 hover:bg-purple-200 rounded-full text-purple-600 transition-colors"
                title="Add nested subtask"
                disabled={isUpdating}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDelete} 
                className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                title="Delete subtask"
                disabled={isUpdating}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'} ${isUpdating ? 'opacity-50' : ''}`} />
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-purple-100 pt-3 bg-gray-50/30">
          {subtask.description && (
            <div className="mb-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</h4>
              <p className="text-sm text-gray-600 italic">{subtask.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Priority</h4>
              <div className={`px-2 py-1 text-xs font-medium rounded inline-block ${
                subtask.priority === 'High' ? 'bg-red-100 text-red-700' :
                subtask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {subtask.priority || 'Medium'}
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</h4>
              <div className="text-sm text-gray-700">
                {subtask.due_date 
                  ? new Date(subtask.due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'No due date'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-tight">Set Status:</span>
              <div className="flex gap-1">
                {['not yet begun', 'in progress', 'completed'].map(s => (
                  <button
                    key={s}
                    onClick={(e) => handleStatusChange(e, s)}
                    disabled={isUpdating || !canEditSubtask}
                    className={`px-3 py-1 text-[10px] rounded-full border transition-all font-semibold uppercase ${
                      subtask.status === s 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                    } ${(isUpdating || !canEditSubtask) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!canEditSubtask ? "You don't have permission to update" : ""}
                  >
                    {s === 'not yet begun' ? 'To Do' : s}
                  </button>
                ))}
              </div>
            </div>
            {!canEditSubtask && isMember && (
              <p className="text-xs text-gray-500 italic">
                Only assigned member can update
              </p>
            )}
          </div>

          {/* Filtered Nested Subtasks List */}
          <div className="space-y-2">
            {filteredNestedSubtasks.length > 0 ? (
              filteredNestedSubtasks.map(nested => (
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
                  loggedInUserId={loggedInUserId}
                  isMember={isMember}
                  canManage={canManage}
                />
              ))
            ) : subtask.subtasks && subtask.subtasks.length > 0 && isMember && !canManage ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                <p>No nested subtasks assigned to you.</p>
              </div>
            ) : null}
          </div>

          {/* Nested Subtask Form */}
          {showSubtaskForm && (
            <div className="mt-4 p-4 bg-white border-2 border-dashed border-purple-200 rounded-xl animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-purple-800">New Nested Subtask</span>
                <button 
                  onClick={() => setShowSubtaskForm(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
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