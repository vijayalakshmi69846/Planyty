import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import MeetingCard from '../components/meetings/MeetingCard';
import ScheduleMeetingForm from '../components/meetings/ScheduleMeetingForm';

// Mock data - moved inside component or can be initial state
const initialMeetings = [
  {
    id: 1,
    title: 'Sprint Planning',
    date: 'Tomorrow, 10:00 AM',
    duration: '1 hour',
    attendees: 5,
    link: '#',
    status: 'Upcoming',
    project: 'Website Redesign',
    host: 'John Doe',
  },
  {
    id: 2,
    title: 'Design Review',
    date: 'Today, 2:00 PM',
    duration: '30 minutes',
    attendees: 3,
    link: '#',
    status: 'Upcoming',
    project: 'Mobile App',
    host: 'Jane Smith',
  },
  {
    id: 3,
    title: 'Project Kickoff',
    date: 'Yesterday, 9:00 AM',
    duration: '1.5 hours',
    attendees: 7,
    link: '#',
    status: 'Completed',
    project: 'API Development',
    host: 'Mike Johnson',
  },
];

const Meetings = () => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [meetings, setMeetings] = useState(initialMeetings);

  const sendNotification = (title, message, type = 'meeting') => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: new Date().toLocaleDateString(),
      read: false,
      type
    };

    // Get existing notifications from localStorage
    const existingNotifications = JSON.parse(localStorage.getItem('planyty_notifications') || '[]');
    
    // Add new notification
    const updatedNotifications = [newNotification, ...existingNotifications];
    
    // Save to localStorage
    localStorage.setItem('planyty_notifications', JSON.stringify(updatedNotifications));
    
    // Dispatch custom event to notify the NotificationsModule
    window.dispatchEvent(new CustomEvent('notificationUpdate', {
      detail: updatedNotifications
    }));

    // Optional: Show desktop notification if browser supports it
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const handleScheduleMeeting = (meetingData) => {
    console.log('Scheduling meeting:', meetingData);
    
    // Format date for display
    const meetingDate = new Date(`${meetingData.date}T${meetingData.time}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let displayDate = '';
    if (meetingDate.toDateString() === today.toDateString()) {
      displayDate = `Today, ${meetingDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (meetingDate.toDateString() === tomorrow.toDateString()) {
      displayDate = `Tomorrow, ${meetingDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      displayDate = meetingDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Format duration
    const durationHours = Math.floor(meetingData.duration / 60);
    const durationMinutes = meetingData.duration % 60;
    let durationDisplay = '';
    if (durationHours > 0 && durationMinutes > 0) {
      durationDisplay = `${durationHours} hour${durationHours > 1 ? 's' : ''} ${durationMinutes} minutes`;
    } else if (durationHours > 0) {
      durationDisplay = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
    } else {
      durationDisplay = `${durationMinutes} minutes`;
    }
    
    // Create new meeting object
    const newMeeting = {
      id: meetings.length + 1,
      title: meetingData.title,
      date: displayDate,
      duration: durationDisplay,
      attendees: meetingData.selectedAttendees?.length || 0,
      link: meetingData.meetingLink || '#',
      status: 'Upcoming',
      project: meetingData.project,
      host: meetingData.host,
    };
    
    // Add new meeting to the list
    setMeetings(prev => [newMeeting, ...prev]);
    
    // Send notification instead of alert
    sendNotification(
      'Meeting Scheduled',
      `"${meetingData.title}" has been scheduled for ${displayDate}`,
      'meeting'
    );

    // Send invitation notifications if attendees are selected
    if (meetingData.selectedAttendees && meetingData.selectedAttendees.length > 0) {
      const attendeeCount = meetingData.selectedAttendees.length;
      sendNotification(
        'Invitations Sent',
        `Meeting invitations sent to ${attendeeCount} team member${attendeeCount > 1 ? 's' : ''}`,
        'invite'
      );
    }

    // Close the form
    setShowScheduleForm(false);
    
    // Request notification permission if not already granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendNotification(
            'Notifications Enabled',
            'You will now receive desktop notifications for new meetings',
            'system'
          );
        }
      });
    }
  };

  const handleJoinMeeting = (meeting) => {
    // Simulate joining meeting
    sendNotification(
      'Meeting Joined',
      `You joined "${meeting.title}"`,
      'meeting'
    );
  };

  const handleMeetingCompleted = (meeting) => {
    // Simulate meeting completion
    sendNotification(
      'Meeting Completed',
      `"${meeting.title}" has been completed`,
      'meeting'
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden">
      {/* REDUCED HEADER */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Meetings Schedule</h1>
          <Button 
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Schedule New
          </Button>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting} 
              onJoinMeeting={() => handleJoinMeeting(meeting)}
              onCompleteMeeting={() => handleMeetingCompleted(meeting)}
            />
          ))}
        </div>
        
        {/* Empty state */}
        {meetings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No meetings scheduled</h3>
            <p className="text-gray-500 mb-4">Schedule your first meeting to get started!</p>
            <Button 
              onClick={() => setShowScheduleForm(true)}
              className="flex items-center mx-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-1" />
              Schedule New Meeting
            </Button>
          </div>
        )}
      </div>

      {/* Schedule Meeting Form Modal */}
      <ScheduleMeetingForm
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        onSubmit={handleScheduleMeeting}
      />
    </div>
  );
};

export default Meetings;