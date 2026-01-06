import React from 'react';
import { Calendar, Clock, Users, Video, Folder, User } from 'lucide-react';
import Button from '../ui/Button';

const MeetingCard = ({ meeting, onJoin, onDelete }) => {
  const statusColors = {
    'Upcoming': 'bg-blue-100 text-blue-800',
    'Ongoing': 'bg-green-100 text-green-800',
    'Completed': 'bg-gray-100 text-gray-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[meeting.status] || 'bg-gray-100'}`}>
          {meeting.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{meeting.date} at {meeting.time}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{meeting.duration}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{meeting.attendees || 0} Attendees</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{meeting.project || 'No Project'}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
            {getInitials(meeting.host)}
          </div>
          <span className="text-sm">Host: {meeting.host}</span>
        </div>
      </div>

      {meeting.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{meeting.description}</p>
      )}

      <div className="flex justify-between items-center">
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
        
        {meeting.status === 'Upcoming' || meeting.status === 'Ongoing' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onJoin}
            className="flex items-center"
          >
            <Video className="w-4 h-4 mr-1" />
            {meeting.status === 'Ongoing' ? 'Join Now' : 'Join'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
          >
            Meeting Ended
          </Button>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;