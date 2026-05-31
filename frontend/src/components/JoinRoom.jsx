import React, { useState } from 'react';

const JoinRoom = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [maxMembers, setMaxMembers] = useState(2);
  const [theme, setTheme] = useState('classic');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      onJoin(roomId.trim(), username.trim(), mode, maxMembers, theme);
    }
  };

  return (
    <div className="join-room-container glass-panel">
      <h2>{mode === 'create' ? 'Create a Study Session' : 'Join a Study Session'}</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          className={`btn ${mode === 'join' ? 'active' : ''}`} 
          style={{ flex: 1, opacity: mode === 'join' ? 1 : 0.5 }}
          onClick={() => setMode('join')}
        >
          Join Room
        </button>
        <button 
          className={`btn ${mode === 'create' ? 'active' : ''}`} 
          style={{ flex: 1, opacity: mode === 'create' ? 1 : 0.5 }}
          onClick={() => setMode('create')}
        >
          Create Room
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Your Display Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {mode === 'create' && (
          <>
            <select
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #ffe6eb', outline: 'none', background: 'var(--bg-surface)' }}
            >
              <option value={2}>Pair (2 people)</option>
              <option value={1}>Alone (1 person)</option>
            </select>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #ffe6eb', outline: 'none', background: 'var(--bg-surface)' }}
            >
              <option value="classic">Theme: Classic</option>
              <option value="study_cafe">Theme: Study Cafe</option>
            </select>
          </>
        )}
        <button type="submit" className="btn">
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;
