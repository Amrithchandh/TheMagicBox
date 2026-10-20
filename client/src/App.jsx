import React, { useState, useEffect } from 'react';
import '@livekit/components-styles';
import './styles.css';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import Meeting from './Meeting.jsx';

// Generates Google Meet format: abc-defg-hij
const generateMeetCode = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len) =>
    Array.from({ length: len }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
};

export default function App() {
  const [room, setRoom] = useState(
    new URLSearchParams(window.location.search).get('room') || ''
  );
  const [conn, setConn] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState('');

  // Synchronize browser URL bar
  useEffect(() => {
    const handlePopState = () => {
      const currentRoom = new URLSearchParams(window.location.search).get('room') || '';
      setRoom(currentRoom);
      if (!currentRoom) {
        setConn(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openRoom = (code) => {
    window.history.pushState({}, '', `?room=${code}`);
    setRoom(code);
    setError('');
  };

  const handleStartNewMeeting = () => {
    const code = generateMeetCode();
    openRoom(code);
  };

  const handleJoinMeeting = (code) => {
    openRoom(code);
  };

  const leaveMeeting = () => {
    window.history.pushState({}, '', window.location.pathname);
    setConn(null);
    setRoom('');
    setPrefs(null);
    setError('');
  };

  const joinCall = async (userPreferences) => {
    setError('');
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, name: userPreferences.username }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server token issue');
      }

      const connectionData = await res.json();
      setConn(connectionData);
      setPrefs(userPreferences);
    } catch (err) {
      console.warn('Backend /api/token error, entering local meeting mode:', err);
      // Fallback: enter local meeting directly so UI is never blocked
      setConn({
        token: 'local-offline-token',
        url: 'wss://local.mock',
        host: 'local-host',
      });
      setPrefs(userPreferences);
    }
  };

  // State 1: Active in call
  if (conn && prefs) {
    return <Meeting conn={conn} prefs={prefs} onLeave={leaveMeeting} />;
  }

  // State 2: In pre-meeting Lobby / Ready to join
  if (room) {
    return (
      <Lobby
        roomCode={room}
        onJoin={joinCall}
        onBack={leaveMeeting}
        error={error}
      />
    );
  }

  // State 3: Home / Welcome screen
  return (
    <Home
      onStartMeeting={handleStartNewMeeting}
      onJoinMeeting={handleJoinMeeting}
      error={error}
    />
  );
}
