import { useState } from "react"
import { useNavigate } from "react-router-dom"
import GlobeComponent from "./components/GlobeComponent"
import Clock from "./components/Clock"
import logo from "/logo.svg"


const Home = () => {
  const [username, setUsername] = useState("")
  const [roomId, setRoomId] = useState("")
  const navigate = useNavigate()

  const generateRoomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const createRoom = () => {
    if (!username) {
      alert("Please enter your name")
      return
    }
    const newRoomId = generateRoomCode()
    navigate(`/room/${newRoomId}`, { state: { username, isOwner: true } })
  }

  const joinRoom = () => {
    if (!username) {
      alert("Please enter your name")
      return
    }
    if (!roomId) {
      alert("Please enter a room code")
      return
    }
    navigate(`/room/${roomId.toUpperCase()}`, { state: { username, isOwner: false } })
  }

  const handleRoomIdChange = (e) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4)
    setRoomId(value)
  }

  return (
    <section className=" bg-black text-white relative bg-[url('/bg.svg')] -mt-2 lg:mt-0 bg-center bg-no-repeat ">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        

        {/* Top Bar with Logo and Clock */}
        <div className="absolute top-0 left-0 right-0 flex lg:justify-between justify-evenly lg:mx-16 items-center p p-4 sm:p-6">
          <img src={logo || "/placeholder.svg"} alt="Logo" className="h-8 sm:h-10 md:h-12" />
          <div className="bg- text-white border border-gray-500 px-4 py-1  rounded-full text-xs sm:text-sm">
            <Clock />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-sans md:text-5xl lg:text-6xl font-bold text-center mb-6 sm:mb-8 mt-16 sm:mt-20">
          Connects you with | <span className="text-blue-400">yours</span>
        </h1>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10 w-full max-w-5xl">
          {/* Form Section */}
          <div className="bg-gradient-to-br from-[#0D0D2B] to-black border border-gray-500 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">

            <input
              type="text"
              placeholder="Your Name"
              className="w-full bg-transparent text-white border border-gray-500 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 placeholder-gray-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={createRoom}
              className="w-full bg-black text-white font-semibold rounded-lg py-2 sm:py-3 mb-3 sm:mb-4 border border-gray-500 hover:text-blue-400 transition-colors"
            >
              Create a new room
            </button>
            <p className="text-center text-gray-500 mb-3 sm:mb-4">OR</p>
            <input
              type="text"
              placeholder="Room Code (4 CHARACTERS)"
              className="w-full bg-transparent text-white border border-gray-500 rounded-lg p-2 sm:p-3 text-center uppercase"
              value={roomId}
              onChange={handleRoomIdChange}
            />
            <button
              onClick={joinRoom}
              className="w-full bg-black text-white font-semibold rounded-lg py-2 sm:py-3 mt-3 sm:mt-4 border border-gray-500 hover:text-blue-400 transition-colors"
            >
              Join Room
            </button>
          </div>

          {/* Globe Section */}
          <div className="flex justify-center  items-center w-full max-w-md lg:max-w-lg xl:max-w-xl">
            <GlobeComponent />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home

