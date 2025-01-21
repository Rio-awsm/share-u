import React, { useState, useEffect } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-javascript"
import "ace-builds/src-noconflict/theme-monokai"
import { ClipboardCopy, Share2, Users } from "lucide-react"

const socket = io("http://localhost:5000")

const Room = () => {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [text, setText] = useState("")
  const [users, setUsers] = useState([])
  const [copied, setCopied] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    if (!location.state?.username) {
      alert("Please enter a username")
      navigate("/")
      return
    }

    const joinData = {
      roomId,
      username: location.state.username,
    }

    if (location.state.isOwner) {
      socket.emit("create-room", joinData)
    } else {
      socket.emit("join-room", joinData)
    }

    socket.on("room-info", (roomInfo) => {
      setUsers(roomInfo.users)
    })

    socket.on("text-update", (newText) => {
      setText(newText)
    })

    socket.on("error", (error) => {
      alert(error)
      navigate("/")
    })

    return () => {
      socket.off("room-info")
      socket.off("text-update")
      socket.off("error")
    }
  }, [roomId, location.state, navigate])

  const handleTextChange = (newText) => {
    setText(newText)
    socket.emit("update-text", { roomId, text: newText })
  }

  const updateUserAccess = (userId, access) => {
    socket.emit("update-access", { roomId, userId, access })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    alert("Room link copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Share U - Room: {roomId}</h1>
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
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
            />
            <div className="bg-gray-700 p-4">
              <button
                onClick={copyToClipboard}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition duration-300 ease-in-out flex items-center"
              >
                <ClipboardCopy className="mr-2" size={18} />
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>

          {showUsers && (
            <div className="bg-white text-gray-800 p-4 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold mb-4">Users</h2>
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.id} className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{user.name}</span>
                      <select
                        value={user.access}
                        onChange={(e) => updateUserAccess(user.id, e.target.value)}
                        className="ml-2 p-1 border rounded-md bg-white"
                        disabled={!users.find((u) => u.id === socket.id)?.access === "owner"}
                      >
                        <option value="read">Read</option>
                        <option value="edit">Edit</option>
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Room

