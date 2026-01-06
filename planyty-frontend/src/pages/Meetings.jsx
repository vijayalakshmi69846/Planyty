import React, { useState, useEffect } from 'react';
import ScheduleMeetingForm from '../components/meetings/ScheduleMeetingForm';
import MeetingCard from '../components/meetings/MeetingCard';
import JitsiMeeting from '../components/meetings/JitsiMeeting';
import Button from '../components/ui/Button';
import ScheduleButton from '../components/ui/ScheduleButton';
import { useToast } from '../components/ui/Toast';
import { meetingService } from '../services/meetingService';
import { Calendar, Video, Clock, AlertCircle, CalendarPlus } from 'lucide-react';

const Meetings = ({ workspaceId: propWorkspaceId }) => {
  // Use prop workspaceId or get from localStorage
  const [workspaceId, setWorkspaceId] = useState(() => {
    return propWorkspaceId || 
           localStorage.getItem('currentWorkspaceId') || 
           1; // Default to 1
  });
  const [meetings, setMeetings] = useState([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', or 'all'
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);

  // Initialize toast
  const toast = useToast();

  useEffect(() => {    
    if (!workspaceId) {
      setError('No workspace selected. Please select a workspace first.');
      setLoading(false);
      return;
    }

    fetchMeetings();
  }, [workspaceId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching meetings...');
      
      // Always fetch all meetings, we'll filter on frontend
      const response = await meetingService.getWorkspaceMeetings(workspaceId, {});
      console.log('Meetings response:', response);
      setMeetings(response.data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      const errorMessage = error.message || 'Failed to load meetings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter meetings based on current time
  const getFilteredMeetings = () => {
    const now = new Date();
    
    switch(filter) {
      case 'upcoming':
        return meetings.filter(meeting => {
          const startTime = new Date(meeting.start_time);
          return startTime > now;
        });
      case 'past':
        return meetings.filter(meeting => {
          const endTime = new Date(meeting.end_time);
          return endTime < now;
        });
      case 'all':
      default:
        return meetings;
    }
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      setShowMeetingForm(false);
      toast.success('Meeting created successfully! Invitations have been sent.');
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting: ' + (error.message || 'Unknown error'));
    }
  };

  const handleJoinMeeting = (meeting) => {
    setActiveMeeting(meeting);
    toast.info('Joining meeting...');
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      setDeletingMeetingId(meetingId);
      
      // Show confirmation modal instead of browser alert
      const confirmed = await new Promise((resolve) => {
        // You could use a custom modal component here
        // For now, using browser confirm but styled nicely
        const result = window.confirm(
          '⚠️ Are you sure you want to delete this meeting?\n\n' +
          'This action cannot be undone and all meeting data will be permanently deleted.'
        );
        resolve(result);
      });

      if (!confirmed) {
        toast.info('Meeting deletion cancelled');
        return;
      }

      await meetingService.deleteMeeting(meetingId);
      
      // Remove the meeting from state immediately for better UX
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      
      toast.success('Meeting deleted successfully');
      
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting: ' + (error.message || 'Unknown error'));
      
      // Refresh meetings list to ensure consistency
      fetchMeetings();
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const formatMeetingData = (meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    
    let status = meeting.status;
    
    // Calculate status based on current time if needed
    if (meeting.status === 'scheduled') {
      if (now > endTime) {
        status = 'Completed';
      } else if (now >= startTime && now <= endTime) {
        status = 'Ongoing';
      } else {
        status = 'Upcoming';
      }
    }
    
    return {
      id: meeting.id,
      title: meeting.title,
      date: startTime.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: startTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      duration: calculateDuration(startTime, endTime),
      project: meeting.project?.name || 'No Project',
      host: meeting.creator?.name || 'Unknown',
      attendees: meeting.attendees?.length || 0,
      status: status,
      meeting_link: meeting.meeting_link,
      description: meeting.description,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      isDeleting: deletingMeetingId === meeting.id
    };
  };

  const calculateDuration = (start, end) => {
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Show error if no workspaceId
  if (!workspaceId) {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-500 mr-4 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Workspace Required</h3>
              <div className="text-yellow-700 space-y-2">
                <p>Please select a workspace to view and schedule meetings.</p>
                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={() => window.location.href = '/workspaces'}
                    variant="primary"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Select Workspace
                  </Button>
                  <Button 
                    onClick={() => setWorkspaceId(1)}
                    variant="secondary"
                  >
                    Use Default Workspace
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredMeetings = getFilteredMeetings();

  return (
    <div className="p-6">
      {/* Render Toast Container */}
      <toast.ToastContainer />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Meetings
          </h1>
          <p className="text-gray-600 mt-2">Schedule, manage, and join team meetings</p>
        </div>
        <div className="flex items-center gap-4">
          <ScheduleButton 
            onClick={() => setShowMeetingForm(true)}
            size="md"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Meetings</p>
              <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {meetings.filter(m => new Date(m.start_time) > new Date()).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-xl border border-green-100 shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <Video className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {meetings.filter(m => new Date(m.end_time) < new Date()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8">
        {['upcoming', 'past', 'all'].map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'primary' : 'secondary'}
            onClick={() => setFilter(filterType)}
            className="capitalize rounded-lg"
          >
            {filterType === 'all' && <Calendar className="w-4 h-4 mr-2" />}
            {filterType === 'upcoming' && <Clock className="w-4 h-4 mr-2" />}
            {filterType === 'past' && <Video className="w-4 h-4 mr-2" />}
            {filterType}
            {filter === filterType && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {filterType === 'all' ? meetings.length : 
                 filterType === 'upcoming' ? meetings.filter(m => new Date(m.start_time) > new Date()).length :
                 meetings.filter(m => new Date(m.end_time) < new Date()).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Meetings Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading meetings...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your meetings</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-6">
            <CalendarPlus className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {filter === 'upcoming' ? 'No upcoming meetings scheduled' : 
             filter === 'past' ? 'No past meetings yet' : 
             'No meetings scheduled'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            {filter === 'upcoming' 
              ? 'Start collaborating with your team by scheduling your first meeting.'
              : filter === 'past'
              ? 'Completed meetings will appear here once they conclude.'
              : 'Get started by scheduling your first team meeting.'}
          </p>
          <ScheduleButton 
            onClick={() => setShowMeetingForm(true)}
            size="lg"
          />
        </div>
      ) : (
        <>
          <div className="mb-6 px-4 py-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Showing {filteredMeetings.length} {filter} meeting{filteredMeetings.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button 
                variant="ghost" 
                onClick={fetchMeetings}
                className="text-sm"
              >
                Refresh
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={formatMeetingData(meeting)}
                onJoin={() => handleJoinMeeting(meeting)}
                onDelete={() => handleDeleteMeeting(meeting.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Meeting Form Modal */}
      {workspaceId && (
        <ScheduleMeetingForm
          isOpen={showMeetingForm}
          onClose={() => setShowMeetingForm(false)}
          onSubmit={handleCreateMeeting}
          workspaceId={workspaceId}
        />
      )}

      {/* Jitsi Meeting */}
      {activeMeeting && (
        <JitsiMeeting
          meetingId={activeMeeting.meeting_link.split('/').pop()}
          user={{ name: 'User Name', email: 'user@example.com' }}
          onClose={() => {
            setActiveMeeting(null);
            toast.info('Meeting ended');
          }}
        />
      )}
    </div>
  );
};

export default Meetings;