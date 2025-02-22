import React, { useState } from "react";
import { Plus, X } from "lucide-react";

export const PollCreator = ({ socket, roomId, onClose }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleCreatePoll = () => {
    if (question.trim() && options.every((opt) => opt.trim())) {
      socket.emit("create-poll", {
        roomId,
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
      });
      onClose();
    }
  };

  return (
    <div className="w-[402px] z-10 bg-black text-white rounded-3xl border-[6px] border-[#5E5A5A] p-4">
      {/* Question Input */}
      <div className="border-[4px] border-[#5E5A5A] rounded-2xl p-4 mb-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Text here...."
          className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none"
          rows={3}
        />
      </div>

      {/* Options List */}
      {options.map((option, index) => (
        <div
          key={index}
          className="w-full bg-[#222222] border-[3px] border-[#5E5A5A] rounded-2xl p-3 mb-2 text-white flex items-center"
        >
          <input
            type="text"
            value={option}
            onChange={(e) => {
              const newOptions = [...options];
              newOptions[index] = e.target.value;
              setOptions(newOptions);
            }}
            placeholder={`Option ${index + 1}`}
            className="w-full bg-transparent placeholder-gray-400 focus:outline-none"
          />
          {options.length > 2 && (
            <button
              onClick={() => handleRemoveOption(index)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              <X size={20} />
            </button>
          )}
        </div>
      ))}

      {/* Add Option Button */}
      {options.length < 5 && (
        <button
          onClick={handleAddOption}
          className="flex items-center text-blue-400 hover:text-blue-300 mt-2"
        >
          <Plus size={20} className="mr-1" /> Add Option
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex z-10 justify-end mt-4 space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreatePoll}
          className="px-4 py-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
          disabled={!question.trim() || !options.every((opt) => opt.trim())}
        >
          Create Poll
        </button>
      </div>
    </div>
  );
};
