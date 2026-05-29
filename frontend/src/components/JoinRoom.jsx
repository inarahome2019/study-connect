import React, { useState } from 'react';

const JoinRoom = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'create'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      onJoin(roomId.trim(), username.trim(), mode);
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
        <button type="submit" className="btn">
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;
