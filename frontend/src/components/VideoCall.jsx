import React, { useEffect, useRef, useState } from 'react';

const RemoteVideo = ({ stream, username }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Connecting...
        </div>
      )}
      <div className="video-label">{username}</div>
    </div>
  );
};

const VideoCall = ({ socket, roomId, currentUsername, peers }) => {
  const localVideoRef = useRef(null);
  const peerConnections = useRef({}); // { [socketId]: RTCPeerConnection }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [socketId]: MediaStream }

  useEffect(() => {
    // 1. Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error('Error accessing media devices:', err));

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, []); // Only on mount

  useEffect(() => {
    if (!localStream || !socket) return;

    // Configuration for WebRTC
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free openrelay TURN server for better NAT traversal
        { 
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        { 
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    };

    const getOrCreatePeerConnection = (targetSocketId) => {
      if (peerConnections.current[targetSocketId]) {
        return peerConnections.current[targetSocketId];
      }

      const pc = new RTCPeerConnection(configuration);
      peerConnections.current[targetSocketId] = pc;

      // Add local stream tracks to the connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [targetSocketId]: event.streams[0]
        }));
      };

      // Send ICE candidates to the remote peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', roomId, event.candidate, targetSocketId);
        }
      };

      return pc;
    };

    // When another user joins, create an offer
    const handleUserJoined = async (socketId, username) => {
      console.log('User joined, initiating call to:', username);
      const pc = getOrCreatePeerConnection(socketId);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', roomId, offer, socketId);
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    };

    // When receiving an offer, create an answer
    const handleReceiveOffer = async (senderSocketId, offer) => {
      console.log('Received offer from', senderSocketId);
      const pc = getOrCreatePeerConnection(senderSocketId);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', roomId, answer, senderSocketId);
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    // When receiving an answer
    const handleReceiveAnswer = async (senderSocketId, answer) => {
      console.log('Received answer from', senderSocketId);
      const pc = peerConnections.current[senderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description from answer:', err);
        }
      }
    };

    // When receiving an ICE candidate
    const handleReceiveIceCandidate = async (senderSocketId, candidate) => {
      const pc = peerConnections.current[senderSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    const handleUserLeft = (socketId) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleReceiveIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleReceiveOffer);
      socket.off('answer', handleReceiveAnswer);
      socket.off('ice-candidate', handleReceiveIceCandidate);
      socket.off('user-left', handleUserLeft);
    };
  }, [localStream, socket, roomId]);

  // Determine remote peers
  const otherPeers = Object.keys(peers).filter(id => id !== socket?.id);
  const hasPartners = otherPeers.length > 0;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Study Session: {roomId}</h3>
        <div className="status-indicator">
          <div className={`status-dot ${hasPartners ? '' : 'offline'}`}></div>
          {hasPartners ? `Connected (${otherPeers.length} partner${otherPeers.length > 1 ? 's' : ''})` : 'Waiting for partner'}
        </div>
      </div>
      
      <div className="video-grid">
        <div className="video-container">
          <video ref={localVideoRef} autoPlay playsInline muted />
          <div className="video-label">{currentUsername} (You)</div>
        </div>
        
        {otherPeers.map(id => (
          <RemoteVideo 
            key={id} 
            stream={remoteStreams[id]} 
            username={peers[id] || 'Partner'} 
          />
        ))}

        {!hasPartners && (
          <div className="video-container">
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Waiting for someone to join...
            </div>
            <div className="video-label">Partner</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
