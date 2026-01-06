import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetailModal from './TaskDetailModal';
import { taskService } from '../../services/taskService';
import { useParams } from 'react-router-dom';

const KanbanBoard = ({ projectId: propProjectId, onTaskUpdate, tasks = [] }) => {
  const { id: urlProjectId } = useParams();
  
  // 1. Resolve Project ID: Priority to prop, then URL param
  const projectId = useMemo(() => {
    return propProjectId || urlProjectId;
  }, [propProjectId, urlProjectId]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('todo'); 
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // Check if user can create tasks
  const canCreateTasks = useMemo(() => {
    const userStr = localStorage.getItem('planyty_user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      const role = (user?.role || '').toLowerCase();
      // Only admin and team_lead can create tasks
      return role === 'admin' || role === 'team_lead';
    } catch (e) {
      return false;
    }
  }, []);

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in progress', title: 'In Progress' },
    { id: 'completed', title: 'Done' }
  ];

  // --- HANDLERS ---

  const handleAddTaskClick = (status) => {
    if (!canCreateTasks) {
      alert("Only team leads and admins can create tasks.");
      return;
    }
    
    if (!projectId) {
      console.error("CANNOT OPEN FORM: projectId is missing.");
      alert("Please select a project from the dropdown first.");
      return;
    }
    // Set status so the new task opens in the correct column
    setSelectedStatus(status);
    setSelectedTask(null); // Ensure it's a "New" task, not an edit
    setShowTaskForm(true);
  };

  const handleTaskSubmit = (newTaskFromServer) => {
    setShowTaskForm(false);
    if (onTaskUpdate) onTaskUpdate(newTaskFromServer);
  };

  const handleTaskDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await taskService.deleteTask(taskId);
        if (onTaskUpdate) onTaskUpdate({ id: taskId, _deleted: true });
        setShowTaskDetail(false);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete task.");
      }
    }
  };

  const handleTaskComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    // Send update to parent state/API
    if (onTaskUpdate) onTaskUpdate({ ...task, status: newStatus });
  };

  // --- DRAG AND DROP LOGIC (UI PRESERVED) ---

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskIdString = e.dataTransfer.getData('taskId');
    const taskId = parseInt(taskIdString, 10);
    
    const taskToMove = tasks.find(t => t.id === taskId);
    if (taskToMove && taskToMove.status !== targetStatus) {
      if (onTaskUpdate) onTaskUpdate({ ...taskToMove, status: targetStatus });
    }
  };

  return (
    <>
      <div className="h-full p-6">
        <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
          {columns.map((column) => (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-80"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Glassmorphism Container */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl h-full flex flex-col shadow-lg border border-purple-100 overflow-hidden">
                
                {/* Column Header */}
                <div className="p-4 border-b border-purple-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-purple-800">{column.title}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                      {tasks.filter(t => t.status === column.id).length}
                    </span>
                  </div>
                </div>
                
                {/* Task List Container */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {tasks
                    .filter(task => task.status === column.id)
                    .map((task) => (
                      <div 
                        key={task.id} 
                        className="relative group cursor-grab active:cursor-grabbing transition-transform"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskComplete(task);
                            }}
                            className={`mt-4 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-400'}`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <div 
                            className="flex-1" 
                            onClick={() => { 
                              console.log("Opening task detail:", { 
                                task, 
                                projectId,
                                taskProjectId: task.project_id 
                              });
                              setSelectedTask(task); 
                              setShowTaskDetail(true); 
                            }}
                          >
                            <TaskCard task={task} isCompleted={task.status === 'completed'} />
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {/* Add Task Button per Column - Only for admins/team leads */}
                  {canCreateTasks && (
                    <button 
                      onClick={() => handleAddTaskClick(column.id)}
                      className="w-full p-3 border-2 border-dashed border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center text-purple-400 group"
                    >
                      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          projectId={projectId} 
          task={selectedTask ? selectedTask : { 
            status: selectedStatus,
            project_id: projectId
          }}
          onClose={() => setShowTaskForm(false)}
          onSubmit={handleTaskSubmit}
        />
      )}

      {/* TASK DETAIL VIEW MODAL */}
      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowTaskDetail(false)}
          onDelete={() => handleTaskDelete(selectedTask.id)}
          onUpdateTask={(updated) => {
            if (onTaskUpdate) onTaskUpdate(updated);
            setShowTaskDetail(false);
          }}
        />
      )}
    </>
  );
};
export default KanbanBoard;