import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export const ActivePoll = ({ poll, socket, roomId, currentUserId }) => {
  const handleVote = (optionIndex) => {
    if (poll.active) {
      socket.emit('vote-poll', { roomId, pollId: poll.id, optionIndex });
    }
  };

  const handleClosePoll = () => {
    socket.emit('close-poll', { roomId, pollId: poll.id });
  };

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold">{poll.question}</h4>
          <p className="text-sm text-gray-400">Created by {poll.createdBy}</p>
        </div>
        {!poll.active && (
          <span className="bg-gray-600 text-white text-sm px-2 py-1 rounded">
            Closed
          </span>
        )}
      </div>
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = totalVotes > 0 
            ? Math.round((option.votes / totalVotes) * 100) 
            : 0;
          const hasVoted = option.voters.includes(currentUserId);

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={!poll.active}
              className={`w-full p-2 rounded relative overflow-hidden ${
                poll.active 
                  ? 'hover:bg-gray-700 cursor-pointer' 
                  : 'cursor-default'
              }`}
            >
              <div
                className="absolute top-0 left-0 bottom-0 bg-blue-600 opacity-20"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex justify-between items-center">
                <span>{option.text}</span>
                <div className="flex items-center space-x-2">
                  {hasVoted && (
                    <CheckCircle size={16} className="text-green-400" />
                  )}
                  <span>{option.votes} votes ({percentage}%)</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {poll.active && (
        <div className="mt-4 text-right">
          <button
            onClick={handleClosePoll}
            className="text-red-400 hover:text-red-300 flex items-center justify-end ml-auto"
          >
            <XCircle size={16} className="mr-1" /> Close Poll
          </button>
        </div>
      )}
    </div>
  );
};