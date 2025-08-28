import { useRef, useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

export const useWebRTC = (roomId, userName) => {
  const localVideo = useRef();
  const socket = useRef();
  const peersRef = useRef(new Map());
  const localStreamRef = useRef();
  const [participants, setParticipants] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [error, setError] = useState(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    peersRef.current.forEach(peer => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    });
    peersRef.current.clear();
    
    setParticipants(new Map());
    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  // Create peer connection
  const createPeer = useCallback((userId, initiator = false) => {
    try {
      const peer = new Peer({
        initiator,
        trickle: false,
        stream: localStreamRef.current,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      peer.on("signal", (data) => {
        if (socket.current) {
          socket.current.emit("signal", { 
            roomId, 
            data, 
            fromUser: userName,
            toUser: userId 
          });
        }
      });

      peer.on("stream", (remoteStream) => {
        setParticipants(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(userId);
          newMap.set(userId, {
            stream: remoteStream,
            userName: existing?.userName || "Unknown User"
          });
          return newMap;
        });
        setIsConnected(true);
        setConnectionStatus("connected");
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError(`Connection error: ${err.message}`);
        setConnectionStatus("error");
      });

      peer.on("close", () => {
        console.log("Peer connection closed");
        setParticipants(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        
        if (peersRef.current.has(userId)) {
          peersRef.current.delete(userId);
        }
        
        if (participants.size === 0) {
          setIsConnected(false);
          setConnectionStatus("waiting");
        }
      });

      return peer;
    } catch (error) {
      console.error("Error creating peer:", error);
      setError(`Failed to create connection: ${error.message}`);
      return null;
    }
  }, [roomId, userName]);

  // Handle incoming signals
  const handleSignal = useCallback(({ data, fromUser, toUser }) => {
    if (toUser === userName && peersRef.current.has(fromUser)) {
      const peer = peersRef.current.get(fromUser);
      if (peer && !peer.destroyed) {
        try {
          peer.signal(data);
        } catch (error) {
          console.error("Error signaling peer:", error);
        }
      }
    }
  }, [userName]);

  // Handle user joined
  const handleUserJoined = useCallback(({ userName: remoteUserName, socketId }) => {
    if (remoteUserName !== userName) {
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.set(socketId, { userName: remoteUserName, stream: null });
        return newMap;
      });
      
      // Create peer connection to new user
      const peer = createPeer(socketId, true);
      if (peer) {
        peersRef.current.set(socketId, peer);
      }
    }
  }, [userName, createPeer]);

  // Handle user left
  const handleUserLeft = useCallback(({ userName: remoteUserName, socketId }) => {
    let remaining = 0;
    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(socketId);
      remaining = newMap.size;
      return newMap;
    });
    
    if (peersRef.current.has(socketId)) {
      const peer = peersRef.current.get(socketId);
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
      peersRef.current.delete(socketId);
    }
    
    if (remaining === 0) {
      setIsConnected(false);
      setConnectionStatus("waiting");
    }
  }, []);

  useEffect(() => {
    if (!roomId || !userName) return;

    let mounted = true;

    const initializeConnection = async () => {
      try {
        setConnectionStatus("connecting");
        setError(null);

        // Get user media with fallbacks
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: "user"
            }, 
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
        } catch (mediaError) {
          console.warn("Primary media constraints failed, trying fallback:", mediaError);
          // Fallback to basic constraints
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
        }

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStreamRef.current = stream;
        
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }

        // Connect to signaling server
        const signalingServer = process.env.NEXT_PUBLIC_SIGNALING_SERVER || "http://localhost:5000";
        socket.current = io(signalingServer, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socket.current.on("connect", () => {
          console.log("Connected to signaling server");
          socket.current.emit("join-room", { roomId, userName });
        });

        socket.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setError(`Connection failed: ${error.message}`);
          setConnectionStatus("error");
        });

        socket.current.on("user-joined", handleUserJoined);
        socket.current.on("user-left", handleUserLeft);
        socket.current.on("signal", handleSignal);

        // Handle existing users in room
        socket.current.on("room-users", (users) => {
          if (mounted) {
            const newParticipants = new Map();
            users.forEach(({ socketId, userName: remoteUserName }) => {
              if (remoteUserName !== userName) {
                newParticipants.set(socketId, { userName: remoteUserName, stream: null });
                
                // Create peer connection to existing user
                const peer = createPeer(socketId, true);
                if (peer) {
                  peersRef.current.set(socketId, peer);
                }
              }
            });
            setParticipants(newParticipants);
          }
        });

        setConnectionStatus("waiting");

      } catch (error) {
        console.error("Error initializing connection:", error);
        if (mounted) {
          setError(`Failed to start: ${error.message}`);
          setConnectionStatus("error");
        }
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      cleanup();
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [roomId, userName, cleanup, handleUserJoined, handleUserLeft, handleSignal, createPeer]);

  // Toggle audio/video functions
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, []);

  // Get audio/video state
  const isAudioMuted = !localStreamRef.current?.getAudioTracks()[0]?.enabled;
  const isVideoMuted = !localStreamRef.current?.getVideoTracks()[0]?.enabled;

  return {
    localVideo,
    participants,
    isConnected,
    connectionStatus,
    error,
    toggleAudio,
    toggleVideo,
    isAudioMuted,
    isVideoMuted,
    participantCount: participants.size
  };
};
