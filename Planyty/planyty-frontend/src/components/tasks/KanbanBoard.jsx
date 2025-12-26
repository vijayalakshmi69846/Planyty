import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetailModal from './TaskDetailModal';
import { taskService } from '../../services/taskService';
import { useParams } from 'react-router-dom';

const KanbanBoard = ({ projectId: propProjectId, onTaskUpdate, tasks = [] }) => {
  const { id: urlProjectId } = useParams();
  // Ensure we have a valid Project ID from props or URL
  const projectId = propProjectId || urlProjectId;

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('todo'); 
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in progress', title: 'In Progress' },
    { id: 'completed', title: 'Done' }
  ];

  const handleAddTaskClick = (status) => {
    if (!projectId) {
      alert("Project ID is missing. Please select a project or refresh the page.");
      return;
    }
    setSelectedStatus(status);
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
    if (onTaskUpdate) onTaskUpdate({ ...task, status: newStatus });
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl h-full flex flex-col shadow-lg border border-purple-100 overflow-hidden">
                <div className="p-4 border-b border-purple-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-purple-800">{column.title}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                      {tasks.filter(t => t.status === column.id).length}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
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
                          
                          <div className="flex-1" onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}>
                            <TaskCard task={task} isCompleted={task.status === 'completed'} />
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  <button 
                    onClick={() => handleAddTaskClick(column.id)}
                    className="w-full p-3 border-2 border-dashed border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center text-purple-400 group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
{showTaskForm && (
  <TaskForm
    projectId={projectId} // This 'projectId' comes from props (selectedProject.id)
    task={selectedStatus ? { status: selectedStatus } : null}
    onClose={() => setShowTaskForm(false)}
    onSubmit={handleTaskSubmit}
  />
)}
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