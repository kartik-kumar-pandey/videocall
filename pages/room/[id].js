import { useRouter } from 'next/router';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useState, useMemo } from 'react';

const Room = () => {
  const router = useRouter();
  const { id: roomId, user: userName } = router.query;
  const { 
    localVideo, 
    participants, 
    isConnected, 
    connectionStatus, 
    error,
    toggleAudio, 
    toggleVideo, 
    isAudioMuted, 
    isVideoMuted,
    participantCount 
  } = useWebRTC(roomId, userName);

  const leaveRoom = () => {
    router.push('/');
  };

  // Calculate grid layout based on participant count
  const gridLayout = useMemo(() => {
    const totalParticipants = participantCount + 1; // +1 for local user
    if (totalParticipants <= 2) return 'grid-cols-1 lg:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [participantCount]);

  // Get connection status color and text
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { color: 'text-yellow-300', bg: 'bg-yellow-400', text: 'Connecting...' };
      case 'connected':
        return { color: 'text-green-300', bg: 'bg-green-400', text: 'Connected' };
      case 'waiting':
        return { color: 'text-blue-300', bg: 'bg-blue-400', text: 'Waiting for participants' };
      case 'error':
        return { color: 'text-red-300', bg: 'bg-red-400', text: 'Connection error' };
      default:
        return { color: 'text-gray-300', bg: 'bg-gray-400', text: 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative flex flex-col h-screen text-white">
      <div className="glow-blob w-[600px] h-[600px] rounded-full bg-blue-400/20 top-[-120px] left-[-80px]"></div>
      <div className="glow-blob w-[700px] h-[700px] rounded-full bg-fuchsia-400/20 bottom-[-150px] right-[-120px]"></div>

      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${statusInfo.bg}`}></div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold">VidFlow Pro</h1>
            <p className="text-xs text-white/70">Room: {roomId}</p>
            <p className="text-xs text-white/50">{participantCount + 1} participants</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-white/70">
            <div className={`w-2 h-2 rounded-full ${statusInfo.bg}`}></div>
            <span className="text-xs">{statusInfo.text}</span>
          </div>
          <button
            onClick={leaveRoom}
            className="control-btn control-danger px-5 h-10 rounded-xl text-sm font-medium"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4">
          <div className="backdrop-glass rounded-2xl px-4 py-3 text-sm flex items-center gap-3 border-red-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div>
              <p className="font-medium text-red-300">Connection Error</p>
              <p className="text-xs text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className={`flex-1 grid ${gridLayout} gap-4 p-6`}>
        {/* Local Video */}
        <div className="video-tile elevated">
          <video 
            ref={localVideo}
            autoPlay
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
            playsInline
          />
          <div className="name-badge">
            {userName || 'You'} {isVideoMuted && '🔇'}
          </div>
          {isVideoMuted && (
            <div className="absolute inset-0 bg-gray-900/80 grid place-items-center">
              <div className="text-4xl">📷</div>
            </div>
          )}
        </div>

        {/* Remote Participants */}
        {Array.from(participants.entries()).map(([socketId, participant]) => (
          <div key={socketId} className="video-tile elevated">
            <video 
              autoPlay
              className="w-full h-full object-cover"
              playsInline
              ref={(el) => {
                if (el && participant.stream) {
                  el.srcObject = participant.stream;
                }
              }}
            />
            <div className="name-badge">
              {participant.userName || 'Unknown User'}
            </div>
          </div>
        ))}

        {/* Waiting State */}
        {participantCount === 0 && (
          <div className="video-tile elevated flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-3">👤</div>
              <p className="text-white/80">Waiting for participants to join</p>
              <p className="text-xs text-white/50 mt-2">Share room ID: {roomId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-20">
        <div className="control-dock">
          <button
            onClick={toggleAudio}
            className={`control-btn ${isAudioMuted ? 'control-danger' : 'control-primary'}`}
            aria-label="Toggle microphone"
          >
            {isAudioMuted ? '🔇' : '🎤'}
          </button>
          <button
            onClick={toggleVideo}
            className={`control-btn ${isVideoMuted ? 'control-danger' : 'control-primary'}`}
            aria-label="Toggle camera"
          >
            {isVideoMuted ? '📷❌' : '📷'}
          </button>
          <button
            onClick={leaveRoom}
            className="control-btn control-danger"
            aria-label="Leave call"
          >
            📞
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {connectionStatus === 'waiting' && (
        <div className="mx-6 mb-4 mt-2">
          <div className="backdrop-glass rounded-2xl px-4 py-3 text-sm flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></div>
            <div>
              <p className="font-medium">Ready for participants</p>
              <p className="text-xs text-white/70">Share room ID: <span className="font-semibold">{roomId}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
