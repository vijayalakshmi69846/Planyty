import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, CheckCircle } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskDetailModal from './TaskDetailModal';

const KanbanBoard = ({ projectId, completedTasks, onTaskComplete, onTaskUpdate, onTasksLoad }) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const titleInputRef = useRef(null);

  // Add this useEffect to update parent with all tasks
  useEffect(() => {
    // Collect all tasks from all columns and send to parent
    const allTasks = columns.flatMap(column => column.tasks);
    if (onTasksLoad) {
      onTasksLoad(allTasks);
    }
  }, [columns, onTasksLoad]);

  const handleAddTaskClick = (columnId) => {
    setSelectedColumn(columnId);
    setShowTaskForm(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskUpdateFromModal = (updatedTask) => {
    handleUpdateTask(updatedTask);
    setSelectedTask(updatedTask);
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
    }
  };

  const handleTaskSubmit = (taskData) => {
    const updatedColumns = columns.map(column => {
      if (column.id === selectedColumn) {
        const newTask = {
          id: Date.now(),
          ...taskData,
          projectId: projectId,
          subtasks: [],
          status: 'not yet begun',
        };
        return {
          ...column,
          tasks: [...column.tasks, newTask]
        };
      }
      return column;
    });

    setColumns(updatedColumns);
    setShowTaskForm(false);
    setSelectedColumn(null);
  };

  const handleTaskFormClose = () => {
    setShowTaskForm(false);
    setSelectedColumn(null);
  };

  const handleDeleteTask = (columnId, taskId) => {
    const updatedColumns = columns.map(column => {
      if (column.id === columnId) {
        const filteredTasks = column.tasks.filter(task => task.id !== taskId);
        return {
          ...column,
          tasks: filteredTasks
        };
      }
      return column;
    });

    setColumns(updatedColumns);
  };

  const handleUpdateTask = (updatedTask) => {
    const updateTaskInTree = (tasks, updatedTask) => {
      return tasks.map(task => {
        if (task.id === updatedTask.id) {
          return updatedTask;
        }
        if (task.subtasks && task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: updateTaskInTree(task.subtasks, updatedTask),
          };
        }
        return task;
      });
    };

    const updatedColumns = columns.map(column => ({
      ...column,
      tasks: updateTaskInTree(column.tasks, updatedTask),
    }));
    setColumns(updatedColumns);
  };

  const handleTaskComplete = (columnId, taskId) => {
    const updatedColumns = columns.map(column => {
      if (column.id === columnId) {
        const updatedTasks = column.tasks.map(task => {
          if (task.id === taskId) {
            const isCurrentlyCompleted = task.status === 'completed';
            const updatedTask = {
              ...task,
              status: isCurrentlyCompleted ? 'not yet begun' : 'completed',
              completedAt: isCurrentlyCompleted ? null : new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            };
            
            // Notify parent component about task completion status change
            if (onTaskComplete) {
              onTaskComplete(updatedTask);
            }
            return updatedTask;
          }
          return task;
        });
        return { ...column, tasks: updatedTasks };
      }
      return column;
    });
    
    setColumns(updatedColumns);
  };

  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      title: 'New Section',
      tasks: [],
    };
    setColumns([...columns, newSection]);
    setEditingColumnId(newSection.id);
  };

  useEffect(() => {
    if (editingColumnId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingColumnId]);

  const handleSectionNameChange = (e, columnId) => {
    const updatedColumns = columns.map(column =>
      column.id === columnId ? { ...column, title: e.target.value } : column
    );
    setColumns(updatedColumns);
  };

  const handleSectionNameBlur = () => {
    setEditingColumnId(null);
  };

  const handleSectionNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      setEditingColumnId(null);
    }
  };

  const handleDeleteSection = (sectionId) => {
    const filteredColumns = columns.filter(column => column.id !== sectionId);
    setColumns(filteredColumns);
  };

  const handleDragStart = (e, taskId, sourceColumnId) => {
    e.dataTransfer.setData('taskId', taskId.toString());
    e.dataTransfer.setData('sourceColumnId', sourceColumnId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const sourceColumnId = parseInt(e.dataTransfer.getData('sourceColumnId'));

    if (sourceColumnId === targetColumnId) return;

    const updatedColumns = columns.map(column => {
      if (column.id === sourceColumnId) {
        // Remove task from source column
        const filteredTasks = column.tasks.filter(task => task.id !== taskId);
        return { ...column, tasks: filteredTasks };
      } else if (column.id === targetColumnId) {
        // Add task to target column
        const sourceColumn = columns.find(col => col.id === sourceColumnId);
        const movedTask = sourceColumn.tasks.find(task => task.id === taskId);
        
        // Keep the task's completion status when moving between columns
        return { ...column, tasks: [...column.tasks, movedTask] };
      }
      return column;
    });

    setColumns(updatedColumns);
  };

  return (
    <>
      <div className="h-full p-6">
        <div className="flex gap-6 h-full" style={{ minWidth: 'min-content' }}>
          {columns.map((column, index) => (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-80 animate-slide-up" 
              style={{ animationDelay: `${index * 100}ms` }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="bg-white rounded-xl h-full flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300">
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
                  <div className="flex items-center gap-2 flex-1">
                    {editingColumnId === column.id ? (
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={column.title}
                        onChange={(e) => handleSectionNameChange(e, column.id)}
                        onBlur={handleSectionNameBlur}
                        onKeyDown={handleSectionNameKeyDown}
                        className="font-semibold text-purple-700 bg-transparent border-b-2 border-purple-500 focus:outline-none w-full"
                      />
                    ) : (
                      <h3
                        className="font-semibold text-purple-700 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient"
                        onClick={() => setEditingColumnId(column.id)}
                      >
                        {column.title}
                      </h3>
                    )}
                    <span className="text-sm px-2 py-1 rounded-full bg-purple-500 text-white animate-pulse-slow">
                      {column.tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSection(column.id)}
                    className="p-1 hover:bg-red-100 rounded-lg transition-all duration-300 hover:scale-110 text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Tasks List */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {column.tasks.map((task, taskIndex) => (
                    <div 
                      key={task.id} 
                      className="relative group animate-fade-in" 
                      style={{ animationDelay: `${taskIndex * 50}ms` }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkmark Button - Toggle completion */}
                        <button
                          onClick={() => handleTaskComplete(column.id, task.id)}
                          className={`mt-4 p-1 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${
                            task.status === 'completed'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-200 hover:bg-green-200 text-gray-500 hover:text-green-600'
                          }`}
                          title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        
                        {/* Task Card */}
                        <div className="flex-1 min-w-0" onClick={() => handleTaskClick(task)}>
                          <TaskCard
                            task={task}
                            isCompleted={task.status === 'completed'}
                          />
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteTask(column.id, task.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add Task Button */}
                  <button 
                    onClick={() => handleAddTaskClick(column.id)}
                    className="w-full p-3 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 hover:scale-105 flex items-center justify-center text-purple-500 animate-pulse-slow"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Section Button */}
          <div className="flex-shrink-0 w-80 animate-slide-up" style={{ animationDelay: `${columns.length * 100}ms` }}>
            <button
              onClick={handleAddSection}
              className="w-full h-full border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 hover:scale-105 flex items-center justify-center animate-pulse-slow"
            >
              <Plus className="w-5 h-5 mr-2 text-purple-500" />
              <span className="text-purple-600 font-semibold">Add Section</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
          onSubmit={handleTaskSubmit}
        />
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          onUpdateTask={handleTaskUpdateFromModal}
        />
      )}
    </>
  );
};

export default KanbanBoard;