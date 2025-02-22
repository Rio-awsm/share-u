import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-tomorrow_night_blue";
import logo from "/logo.svg"
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
import GenerateButton from "./components/GenerateButton";
import Copy from "./components/Copy";

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
    <div className="min-h-screen bg-black justify-center text-white p-4">
      {showJoinModal && (
        <JoinModal onJoin={handleJoinRoom} onClose={() => navigate("/")} />
      )}
      <div className="container mx-auto">
        <div className="my-4">
        <img src={logo} alt="" />
        </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 px-[5%] py-4  justify-center">
  {/* Code Editor Section */}
  <div className="lg:col-span-3 bg-gray-900 lg:w-[983px]  rounded-lg shadow-xl overflow-hidden">
    <div className="relative flex flex-col lg:flex-row lg:pt-16 pt-12">
      <AceEditor
        mode="javascript"
        theme="tomorrow_night_blue"
        onChange={handleTextChange}
        value={text}
        name="code-editor"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        height="calc(90vh - 200px)"
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

      <div className="absolute lg:top-12 top-0 lg:right-10 right-2 flex justify-between items-center">
        <button
          onClick={copyToClipboard}
          className="text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
        >
          <Copy />
        </button>
        {!canEdit && (
          <span className="text-yellow-400 flex items-center">
            <Shield className="mr-2" size={18} />
          </span>
        )}
      </div>
    </div>

    {showAiPrompt && canUseAI && (
      <div className="bg-black py-4">
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
              className="flex-1 px-4 py-2 rounded-xl bg-black text-white border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && !isAiGenerating && handleAiPrompt()}
            />
            <button
              onClick={handleAiPrompt}
              disabled={isAiGenerating}
              className="text-white pl-2  rounded-3xl transition duration-300 ease-in-out flex items-center space-x-2"
            >
              {isAiGenerating ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Generating...</span>
                </>
              ) : (
                <span>
                  <GenerateButton/>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Side Panel */}
  {location.state?.username && (
    <div className="  flex flex-col items-center space-y-4">
      <VideoChat socket={socket} roomId={roomId} username={location.state.username} canEdit={canEdit} />
      {showUsers && (
        <div className="bg-black rounded-[32px] shadow-lg border-8 border-[#5E5A5A] w-[402px] text-gray-400 p-4 ">
          <h2 className="text-xl p-4  text-center uppercase rounded-[32px] shadow-lg border-8 border-[#5E5A5A] font-bold  mb-4">Users</h2>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                <span className="font-medium">{user.name}</span>
                {user.access === "owner" && <Shield className="text-purple-600" size={16} />}
                {isAdmin && user.id !== socket.id ? (
                  <select
                    value={user.access}
                    onChange={(e) => updateUserAccess(user.id, e.target.value)}
                    className="p-1 border rounded-md bg-white"
                  >
                    <option value="read">Read</option>
                    <option value="edit">Edit</option>
                  </select>
                ) : (
                  <span className="text-sm text-gray-600">{user.access === "owner" ? "Admin" : user.access}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {showPollCreator && <PollCreator socket={socket} roomId={roomId} onClose={() => setShowPollCreator(false)} />}
      {activePolls.map((poll) => (
        <ActivePoll key={poll.id} poll={poll} socket={socket} roomId={roomId} currentUserId={socket.id} />
      ))}
      {location.state?.username && (
        <Chat socket={socket} roomId={roomId} username={location.state.username} showChat={showChat} setShowChat={setShowChat} />
      )}
    </div>
  )}
</div>



      </div>
    </div>
  );
};

export default Room;
