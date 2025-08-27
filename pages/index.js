import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [serverStatus, setServerStatus] = useState('unknown');
  const [deviceSupport, setDeviceSupport] = useState({ camera: false, microphone: false });
  const [isChecking, setIsChecking] = useState(false);

  // Check device compatibility on mount
  useEffect(() => {
    checkDeviceSupport();
  }, []);

  const checkDeviceSupport = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDeviceSupport({ camera: false, microphone: false });
        return;
      }

      // Check camera support
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach(track => track.stop());
        setDeviceSupport(prev => ({ ...prev, camera: true }));
      } catch (error) {
        console.warn('Camera not accessible:', error.message);
        setDeviceSupport(prev => ({ ...prev, camera: false }));
      }

      // Check microphone support
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(track => track.stop());
        setDeviceSupport(prev => ({ ...prev, microphone: true }));
      } catch (error) {
        console.warn('Microphone not accessible:', error.message);
        setDeviceSupport(prev => ({ ...prev, microphone: false }));
      }
    } catch (error) {
      console.error('Error checking device support:', error);
    }
  };

  const joinRoom = () => {
    if (!deviceSupport.camera && !deviceSupport.microphone) {
      alert('Camera and microphone access is required for video calls. Please allow access and try again.');
      return;
    }
    
    const roomId = roomName || Math.random().toString(36).slice(2);
    router.push(`/room/${roomId}?user=${encodeURIComponent(userName)}`);
  };

  const checkServerStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const data = await response.json();
        setServerStatus('online');
        console.log('Server status:', data);
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
      console.error('Server check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const canJoinRoom = userName.trim() && (deviceSupport.camera || deviceSupport.microphone);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="glow-blob w-[600px] h-[600px] rounded-full bg-blue-400/30 top-[-100px] left-[-100px]"></div>
      <div className="glow-blob w-[700px] h-[700px] rounded-full bg-fuchsia-400/20 bottom-[-120px] right-[-120px]"></div>

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="backdrop-glass elevated w-full max-w-2xl rounded-3xl p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">VidFlow Pro</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Professional video calls that flow seamlessly.</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              serverStatus === 'online' ? 'bg-green-500/20 text-green-300' :
              serverStatus === 'offline' ? 'bg-red-500/20 text-red-300' :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {serverStatus.toUpperCase()}
            </span>
          </div>

          {/* Device Support Status */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Device Support</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deviceSupport.camera ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Camera</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deviceSupport.microphone ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Microphone</span>
              </div>
            </div>
            {(!deviceSupport.camera || !deviceSupport.microphone) && (
              <p className="text-xs text-red-500 mt-2">
                Please allow camera and microphone access for the best experience.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="userName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Your name</label>
              <input
                id="userName"
                type="text"
                placeholder="Jane Doe"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="roomName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Room name (optional)</label>
              <input
                id="roomName"
                type="text"
                placeholder="Design Sync"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 text-gray-900 dark:text-white"
              />
              <p className="text-[11px] mt-2 text-gray-600 dark:text-gray-400">Leave empty to create a random room.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex gap-3">
              <button
                onClick={checkDeviceSupport}
                className="px-4 py-2 rounded-xl control-muted text-sm"
              >
                Check devices
              </button>
              <button
                onClick={checkServerStatus}
                disabled={isChecking}
                className="px-4 py-2 rounded-xl control-muted text-sm disabled:opacity-50"
              >
                {isChecking ? 'Checking...' : 'Check server'}
              </button>
              <button
                onClick={joinRoom}
                disabled={!canJoinRoom}
                className={`px-6 py-3 rounded-xl text-sm font-semibold shadow-lg ${
                  canJoinRoom ? 'control-primary' : 'bg-gray-400/50 cursor-not-allowed text-white'
                }`}
              >
                Join room
              </button>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Start the server with <code className="px-1 rounded bg-black/20">node server.js</code>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Getting Started:</h3>
            <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>1. Start the signaling server: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">node server.js</code></li>
              <li>2. Allow camera and microphone access when prompted</li>
              <li>3. Enter your name and join a room to start video calling</li>
              <li>4. Share the room ID with others to invite them</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
