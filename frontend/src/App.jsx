import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import JoinRoom from './components/JoinRoom';
import StudyRoom from './components/StudyRoom';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null); // { roomId, username }

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoin = (roomId, username, mode) => {
    setSessionInfo({ roomId, username, mode });
  };

  const handleLeave = () => {
    setSessionInfo(null);
  };

  return (
    <div className="app-container">
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        Study Connect
      </h1>
      
      {!sessionInfo ? (
        <JoinRoom onJoin={handleJoin} />
      ) : (
        socket && (
          <StudyRoom 
            socket={socket} 
            roomId={sessionInfo.roomId} 
            currentUsername={sessionInfo.username}
            mode={sessionInfo.mode}
            onLeave={handleLeave}
          />
        )
      )}
    </div>
  );
}

export default App;
