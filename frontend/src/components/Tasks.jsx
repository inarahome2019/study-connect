import React, { useState } from 'react';
import { playDing } from '../utils/audio';

const Tasks = ({ tasks, onAddTask, onToggleTask, currentUsername }) => {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask({
        id: Date.now().toString(),
        text: newTask.trim(),
        completedBy: []
      });
      setNewTask('');
    }
  };

  const handleToggle = (taskId, isCompleted) => {
    onToggleTask(taskId, isCompleted);
    if (isCompleted) {
      playDing();
    }
  };

  return (
    <div className="glass-panel" style={{ flexGrow: 1 }}>
      <h3>Shared Tasks</h3>
      <form onSubmit={handleSubmit} className="add-task-form">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button type="submit" className="btn">Add</button>
      </form>

      <div className="task-list">
        {tasks.map(task => {
          const isCompletedByMe = task.completedBy.includes(currentUsername);
          return (
            <div key={task.id} className="task-item">
              <input
                type="checkbox"
                className="task-checkbox"
                checked={isCompletedByMe}
                onChange={(e) => handleToggle(task.id, e.target.checked)}
              />
              <span className={`task-text ${isCompletedByMe ? 'task-completed' : ''}`}>
                {task.text}
              </span>
              {task.completedBy.length > 0 && (
                <div className="user-progress">
                  {task.completedBy.map(u => (
                    <span key={u} className="user-badge">{u} ✓</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
