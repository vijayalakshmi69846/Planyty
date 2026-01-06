import React, { useEffect, useRef } from 'react';

const JitsiMeeting = ({ meetingId, user, onClose }) => {
  const jitsiContainer = useRef(null);

  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      loadJitsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = loadJitsi;
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup
    };
  }, []);

  const loadJitsi = () => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: meetingId,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: {
        displayName: user.name,
        email: user.email
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        enableWelcomePage: false,
        prejoinPageEnabled: false
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#f0f0f0',
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ]
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    // Event handlers
    api.addEventListeners({
      readyToClose: () => {
        if (onClose) onClose();
      },
      participantJoined: (participant) => {
        console.log('Participant joined:', participant);
      },
      participantLeft: (participant) => {
        console.log('Participant left:', participant);
      },
      videoConferenceJoined: (conference) => {
        console.log('Conference joined:', conference);
      },
      videoConferenceLeft: () => {
        if (onClose) onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full">
        <div ref={jitsiContainer} className="w-full h-full" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 z-10"
        >
          Leave Meeting
        </button>
      </div>
    </div>
  );
};

export default JitsiMeeting;