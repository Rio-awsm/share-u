const SegmentedControl = ({ activeTab, setActiveTab }) => {
    const tabs = ["Room", "Users", "Poll", "Chat"];
  
    return (
      <div className="flex items-center justify-center space-x-1 bg-black p-1 rounded-full border border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}  // <-- Ensure the state updates correctly
            className={`px-4 py-2 rounded-full transition duration-300 ease-in-out 
              ${
                activeTab === tab
                  ? "text-white border border-blue-400 shadow-lg"
                  : "text-gray-400 hover:text-white"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>
    );
  };
  
  export default SegmentedControl;
  