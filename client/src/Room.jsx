import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import {
  ClipboardCopy,
  Share2,
  Users,
  Shield,
  Loader,
  MessageCircle,
} from "lucide-react";
import JoinModal from "./JoinModel";
import { ActivePoll } from "./ActivePoll";
import { PollCreator } from "./PollCreator";
import Chat from "./Chat";
import { VideoChat } from "./VideoChat";

const socket = io("https://share-u.onrender.com/");

const Room = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [activePolls, setActivePolls] = useState([]);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!location.state?.username) {
      setShowJoinModal(true);
      return;
    }

    const joinData = {
      roomId,
      username: location.state.username,
    };

    if (location.state.isOwner) {
      socket.emit("create-room", joinData);
    } else {
      socket.emit("join-room", joinData);
    }

    socket.on("room-info", (roomInfo) => {
      setUsers(roomInfo.users);
    });

    socket.on("text-update", (newText) => {
      setText(newText);
    });

    socket.on("user-typing", ({ userId, username }) => {
      setTypingUsers((prev) => new Set([...prev, username]));
    });

    socket.on("user-stopped-typing", ({ userId, username }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    });

    socket.on("error", (error) => {
      alert(error);
      navigate("/");
    });

    return () => {
      socket.off("room-info");
      socket.off("text-update");
      socket.off("error");
      socket.off("user-typing");
      socket.off("user-stopped-typing");
    };
  }, [roomId, location.state, navigate]);

  const handleJoinRoom = (username) => {
    setShowJoinModal(false);
    navigate(`/room/${roomId}`, {
      state: { username, isOwner: false },
      replace: true,
    });
  };

  const handleAiPrompt = () => {
    if (!aiPrompt.trim()) return;

    setIsAiGenerating(true);

    socket.emit("ai-prompt", {
      roomId,
      prompt: aiPrompt.trim(),
      username: location.state?.username,
    });

    setAiPrompt("");
  };

  useEffect(() => {
    socket.on("text-update", (newText) => {
      setText(newText);
      setIsAiGenerating(false);
    });

    socket.on("error", (error) => {
      alert(error);
      setIsAiGenerating(false);
      navigate("/");
    });

    return () => {
      socket.off("text-update");
      socket.off("error");
    };
  }, [navigate]);

  const handleTextChange = (newText) => {
    setText(newText);
    socket.emit("update-text", { roomId, text: newText });

    socket.emit("typing", { roomId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopped-typing", { roomId });
    }, 1000);
  };

  const isAdmin = users.find((u) => u.id === socket.id)?.access === "owner";

  const updateUserAccess = (userId, access) => {
    if (!isAdmin) return;
    socket.emit("update-access", { roomId, userId, access });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    alert("Room link copied to clipboard!");
  };

  useEffect(() => {
    socket.on("poll-created", (poll) => {
      setActivePolls((prev) => [...prev, poll]);
    });

    socket.on("poll-updated", (updatedPoll) => {
      setActivePolls((prev) =>
        prev.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll))
      );
    });

    socket.on("poll-closed", (closedPoll) => {
      setActivePolls((prev) =>
        prev.map((poll) => (poll.id === closedPoll.id ? closedPoll : poll))
      );
    });

    socket.on("active-polls", (polls) => {
      setActivePolls(polls);
    });

    return () => {
      socket.off("poll-created");
      socket.off("poll-updated");
      socket.off("poll-closed");
      socket.off("active-polls");
    };
  }, []);

  const currentUser = users.find((u) => u.id === socket.id);
  const canEdit =
    currentUser?.access === "edit" || currentUser?.access === "owner";
  const canUseAI = isAdmin || canEdit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white p-4">
      {showJoinModal && (
        <JoinModal onJoin={handleJoinRoom} onClose={() => navigate("/")} />
      )}
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Share U - Room: {roomId}</h1>
            {typingUsers.size > 0 && (
              <div className="text-sm mt-2 text-gray-200">
                {Array.from(typingUsers).join(", ")}{" "}
                {typingUsers.size === 1 ? "is" : "are"} typing...
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={copyRoomLink}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
            >
              <Share2 className="mr-2" size={18} />
              Share Room
            </button>
            <button
              onClick={() => setShowUsers(!showUsers)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
            >
              <Users className="mr-2" size={18} />
              {showUsers ? "Hide" : "Show"} Users
            </button>

            <button
              onClick={() => setShowPollCreator(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
            >
              Create Poll
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
            >
              <MessageCircle className="mr-2" size={18} />
              {showChat ? "Hide" : "Show"} Chat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <AceEditor
              mode="javascript"
              theme="monokai"
              onChange={handleTextChange}
              value={text}
              name="code-editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="calc(100vh - 200px)"
              fontSize={16}
              showPrintMargin={false}
              showGutter={true}
              highlightActiveLine={true}
              readOnly={!canEdit}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
            />
            <div className="bg-gray-700 p-4 flex justify-between items-center">
              <button
                onClick={copyToClipboard}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
              >
                <ClipboardCopy className="mr-2" size={18} />
                {copied ? "Copied!" : "Copy Text"}
              </button>
              {!canEdit && (
                <span className="text-yellow-400 flex items-center">
                  <Shield className="mr-2" size={18} />
                  Read-only mode
                </span>
              )}
            </div>

            {showAiPrompt && canUseAI && (
              <div className="bg-gray-900 p-4">
                <div className="flex flex-col space-y-2">
                  {isAiGenerating && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>AI is generating response...</span>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask the AI assistant..."
                      disabled={isAiGenerating}
                      className={`flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isAiGenerating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !isAiGenerating && handleAiPrompt()
                      }
                    />
                    <button
                      onClick={handleAiPrompt}
                      disabled={isAiGenerating}
                      className={`bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition duration-300 ease-in-out flex items-center space-x-2 ${
                        isAiGenerating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isAiGenerating ? (
                        <>
                          <Loader className="animate-spin" size={18} />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Send</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {location.state?.username && (
        <VideoChat
          socket={socket}
          roomId={roomId}
          username={location.state.username}
          canEdit={canEdit}
        />
      )}
          </div>

          {showUsers && (
            <div className="bg-white text-gray-800 p-4 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold mb-4">Users</h2>
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.id} className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium">{user.name}</span>
                        {user.access === "owner" && (
                          <Shield className="ml-2 text-purple-600" size={16} />
                        )}
                      </div>
                      {isAdmin && user.id !== socket.id && (
                        <select
                          value={user.access}
                          onChange={(e) =>
                            updateUserAccess(user.id, e.target.value)
                          }
                          className="ml-2 p-1 border rounded-md bg-white"
                        >
                          <option value="read">Read</option>
                          <option value="edit">Edit</option>
                        </select>
                      )}
                      {!isAdmin && (
                        <span className="text-sm text-gray-600">
                          {user.access === "owner" ? "Admin" : user.access}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showPollCreator && (
            <PollCreator
              socket={socket}
              roomId={roomId}
              onClose={() => setShowPollCreator(false)}
            />
          )}
          {activePolls.map((poll) => (
            <ActivePoll
              key={poll.id}
              poll={poll}
              socket={socket}
              roomId={roomId}
              currentUserId={socket.id}
            />
          ))}
        </div>
        {location.state?.username && (
          <Chat
            socket={socket}
            roomId={roomId}
            username={location.state.username}
            showChat={showChat}
            setShowChat={setShowChat}
          />
        )}
      </div>
    </div>
  );
};

export default Room;
