import React from 'react';
import { Calendar, Clock, Users, Video, Folder, User } from 'lucide-react';
import Button from '../ui/Button';

const MeetingCard = ({ meeting }) => {
  const statusColor = meeting.status === 'Upcoming' 
    ? 'bg-purple-100 text-purple-800' 
    : 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-800">{meeting.title}</h3>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
          {meeting.status}
        </span>
      </div>
      
      <div className="space-y-2 text-gray-600 mb-4">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gray-500" />
          <span>{meeting.date}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500" />
          <span>{meeting.duration}</span>
        </div>
        <div className="flex items-center">
          <Users className="w-5 h-5 mr-2 text-gray-500" />
          <span>{meeting.attendees} Attendees</span>
        </div>
        <div className="flex items-center">
          <Folder className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-sm">{meeting.project}</span>
        </div>
        <div className="flex items-center">
          <User className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-sm">Host: {meeting.host}</span>
        </div>
      </div>

      <div className="flex justify-end">
        {meeting.status === 'Upcoming' ? (
          <Button 
            className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Video className="w-5 h-5 mr-2" />
            Join Meeting
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105"
          >
            View Summary
          </Button>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;