import React, { useEffect, useState } from 'react';
import VideoCall from './VideoCall';
import Tasks from './Tasks';
import Timer from './Timer';
import CafeMenu from './CafeMenu';
import { LogOut, Check, X, Coffee, CheckSquare } from 'lucide-react';

const StudyRoom = ({ socket, roomId, currentUsername, mode, maxMembers, theme, onLeave }) => {
  const [roomState, setRoomState] = useState(null); // null means pending or not joined yet
  const [joinStatus, setJoinStatus] = useState('connecting'); // 'connecting', 'pending', 'denied', 'joined', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  
  const [joinRequests, setJoinRequests] = useState([]); // [{ socketId, username }]
  const isCreator = roomState && roomState.creatorId === socket.id;

  const [peers, setPeers] = useState({});
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [timerState, setTimerState] = useState({
    isRunning: false,
    mode: 'work',
    duration: 25 * 60,
    remaining: 25 * 60,
    lastUpdateTime: Date.now()
  });

  useEffect(() => {
    if (mode === 'create') {
      socket.emit('create-room', roomId, currentUsername, maxMembers, theme);
    } else {
      socket.emit('join-room', roomId, currentUsername);
    }

    socket.on('join-pending', () => {
      setJoinStatus('pending');
    });

    socket.on('join-denied', () => {
      setJoinStatus('denied');
    });

    socket.on('join-error', (msg) => {
      setJoinStatus('error');
      setErrorMsg(msg);
    });

    socket.on('join-request', (request) => {
      setJoinRequests(prev => [...prev, request]);
    });

    socket.on('room-state', (state) => {
      setJoinStatus('joined');
      setRoomState(state);
      setPeers(state.users);
      setTasks(state.tasks);
      setTimerState(state.timerState);
    });

    socket.on('user-joined', (socketId, username) => {
      setPeers(prev => ({ ...prev, [socketId]: username }));
    });

    socket.on('user-left', (socketId) => {
      setPeers(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on('task-added', (task) => {
      setTasks(prev => [...prev, task]);
    });

    socket.on('task-updated', (updatedTask, details) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      
      if (details.isCompleted && details.userWhoToggled !== currentUsername) {
        import('../utils/audio').then(({ playDing }) => playDing());
      }
    });

    socket.on('timer-synced', (newTimerState) => {
      setTimerState(newTimerState);
    });

    return () => {
      socket.emit('leave-room', roomId);
      socket.off('join-pending');
      socket.off('join-denied');
      socket.off('join-error');
      socket.off('join-request');
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('task-added');
      socket.off('task-updated');
      socket.off('timer-synced');
    };
  }, [socket, roomId, currentUsername]);

  const handleAcceptJoin = (request) => {
    socket.emit('accept-join', roomId, request.socketId, request.username);
    setJoinRequests(prev => prev.filter(r => r.socketId !== request.socketId));
  };

  const handleDenyJoin = (request) => {
    socket.emit('deny-join', roomId, request.socketId);
    setJoinRequests(prev => prev.filter(r => r.socketId !== request.socketId));
  };

  const handleAddTask = (task) => {
    socket.emit('add-task', roomId, task);
  };

  const handleToggleTask = (taskId, isCompleted) => {
    socket.emit('toggle-task', roomId, taskId, currentUsername, isCompleted);
  };

  const handleSyncTimer = (newTimerState) => {
    setTimerState({ ...newTimerState, lastUpdateTime: Date.now() });
    socket.emit('sync-timer', roomId, newTimerState);
  };

  const handleCafeOrder = (timeInMins, itemName) => {
    const duration = timeInMins * 60;
    const newTimerState = {
      isRunning: true,
      mode: 'work',
      duration: duration,
      remaining: duration,
      lastUpdateTime: Date.now()
    };
    handleSyncTimer(newTimerState);
  };

  if (joinStatus === 'connecting') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px' }}>
        <h2>Connecting to room...</h2>
      </div>
    );
  }

  if (joinStatus === 'pending') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px' }}>
        <h2>Waiting for Approval</h2>
        <p>The room creator has been notified and needs to accept your request.</p>
        <button className="btn" onClick={onLeave} style={{ marginTop: '1rem' }}>Cancel</button>
      </div>
    );
  }

  if (joinStatus === 'denied') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px' }}>
        <h2 style={{ color: '#ff6b6b' }}>Access Denied</h2>
        <p>The room creator declined your join request.</p>
        <button className="btn" onClick={onLeave} style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  if (joinStatus === 'error') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px' }}>
        <h2 style={{ color: '#ff6b6b' }}>Error</h2>
        <p>{errorMsg}</p>
        <button className="btn" onClick={onLeave} style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="study-room" style={{ position: 'relative' }}>
      {/* Join Requests Overlay */}
      {isCreator && joinRequests.length > 0 && (
        <div style={{ position: 'absolute', top: '-1rem', right: 0, zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {joinRequests.map(req => (
            <div key={req.socketId} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.8)' }}>
              <span><strong>{req.username}</strong> wants to join</span>
              <button onClick={() => handleAcceptJoin(req)} style={{ background: '#4ECDC4', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'white' }} title="Accept">
                <Check size={16} />
              </button>
              <button onClick={() => handleDenyJoin(req)} style={{ background: '#ff6b6b', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'white' }} title="Deny">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="main-content">
        <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
          <h3 style={{ margin: 0 }}>Study Session: {roomId}</h3>
          {roomState && roomState.maxMembers === 1 ? (
            <div className="status-indicator">
              <div className="status-dot"></div>
              Solo Session
            </div>
          ) : (
            <div className="status-indicator">
              <div className={`status-dot ${Object.keys(peers).filter(id => id !== socket?.id).length > 0 ? '' : 'offline'}`}></div>
              {Object.keys(peers).filter(id => id !== socket?.id).length > 0 
                ? `Connected (${Object.keys(peers).filter(id => id !== socket?.id).length} partner${Object.keys(peers).filter(id => id !== socket?.id).length > 1 ? 's' : ''})` 
                : 'Waiting for partner'}
            </div>
          )}
        </div>

        {roomState && roomState.maxMembers === 2 && (
          <VideoCall 
            socket={socket} 
            roomId={roomId} 
            currentUsername={currentUsername} 
            peers={peers}
          />
        )}
        
        {roomState && roomState.theme === 'study_cafe' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              className={`btn ${activeTab === 'tasks' ? 'active' : ''}`}
              style={{ flex: 1, opacity: activeTab === 'tasks' ? 1 : 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setActiveTab('tasks')}
            >
              <CheckSquare size={18} /> Tasks
            </button>
            <button 
              className={`btn ${activeTab === 'cafe' ? 'active' : ''}`}
              style={{ flex: 1, opacity: activeTab === 'cafe' ? 1 : 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setActiveTab('cafe')}
            >
              <Coffee size={18} /> Cafe Menu
            </button>
          </div>
        )}

        <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
          <Tasks 
            tasks={tasks} 
            onAddTask={handleAddTask} 
            onToggleTask={handleToggleTask} 
            currentUsername={currentUsername}
          />
        </div>

        {roomState && roomState.theme === 'study_cafe' && activeTab === 'cafe' && (
          <CafeMenu onOrder={handleCafeOrder} />
        )}
      </div>
      
      <div className="side-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Timer 
          timerState={timerState} 
          onSyncTimer={handleSyncTimer}
          isCreator={isCreator}
        />
        
        <button onClick={onLeave} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <LogOut size={20} /> Leave Session
        </button>
      </div>
    </div>
  );
};

export default StudyRoom;
