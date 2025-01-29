import React, { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, GripHorizontal } from 'lucide-react';
import Draggable from 'react-draggable';

export const VideoChat = ({ socket, roomId, username, canEdit }) => {
  const [peers, setPeers] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 400 });
  const localVideoRef = useRef();
  const peerConnections = useRef(new Map());
  const screenStream = useRef(null);
  useEffect(() => {
    if (!canEdit) return;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        socket.emit("video-join", { roomId });
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      screenStream.current?.getTracks().forEach((track) => track.stop());
      peerConnections.current.forEach((connection) => connection.close());
    };
  }, [canEdit]);

  useEffect(() => {
    if (!canEdit) return;

    socket.on("video-user-joined", async ({ userId }) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      });

      localStream?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.ontrack = (event) => {
        setPeers((prevPeers) => {
          const newPeers = new Map(prevPeers);
          newPeers.set(userId, event.streams[0]);
          return newPeers;
        });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("video-ice-candidate", {
            roomId,
            candidate: event.candidate,
            toUserId: userId,
          });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("video-offer", {
        roomId,
        offer,
        toUserId: userId,
      });

      peerConnections.current.set(userId, peerConnection);
    });

    socket.on("video-offer", async ({ fromUserId, offer }) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      });

      localStream?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.ontrack = (event) => {
        setPeers((prevPeers) => {
          const newPeers = new Map(prevPeers);
          newPeers.set(fromUserId, event.streams[0]);
          return newPeers;
        });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("video-ice-candidate", {
            roomId,
            candidate: event.candidate,
            toUserId: fromUserId,
          });
        }
      };

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("video-answer", {
        roomId,
        answer,
        toUserId: fromUserId,
      });

      peerConnections.current.set(fromUserId, peerConnection);
    });

    socket.on("video-answer", async ({ fromUserId, answer }) => {
      const peerConnection = peerConnections.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    });

    socket.on("video-ice-candidate", async ({ fromUserId, candidate }) => {
      const peerConnection = peerConnections.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    });

    socket.on("video-user-left", ({ userId }) => {
      setPeers((prevPeers) => {
        const newPeers = new Map(prevPeers);
        newPeers.delete(userId);
        return newPeers;
      });

      const peerConnection = peerConnections.current.get(userId);
      if (peerConnection) {
        peerConnection.close();
        peerConnections.current.delete(userId);
      }
    });

    return () => {
      socket.off("video-user-joined");
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("video-ice-candidate");
      socket.off("video-user-left");
    };
  }, [canEdit, localStream]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStream.current = stream;

        peerConnections.current.forEach((peerConnection) => {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };
      } else {
        stopScreenSharing();
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const stopScreenSharing = () => {
    screenStream.current?.getTracks().forEach((track) => track.stop());

    peerConnections.current.forEach((peerConnection) => {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnection
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (e, data) => {
    setIsDragging(false);
    setPosition({ x: data.x, y: data.y });
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 rounded-lg shadow-xl p-4 w-64">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg bg-gray-800"
        />
        {Array.from(peers.entries()).map(([userId, stream]) => (
          <video
            key={userId}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-gray-800"
            ref={(el) => {
              if (el) el.srcObject = stream;
            }}
          />
        ))}
      </div>

      <div className="flex justify-center space-x-2">
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-full ${
            isAudioEnabled ? "bg-gray-700" : "bg-red-600"
          }`}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-full ${
            isVideoEnabled ? "bg-gray-700" : "bg-red-600"
          }`}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-2 rounded-full ${
            isScreenSharing ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          <Monitor size={20} />
        </button>
      </div>
    </div>
  );
};
