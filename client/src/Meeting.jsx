import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useDataChannel,
  useConnectionState,
} from '@livekit/components-react';
import VideoTile from './components/VideoTile.jsx';
import BottomBar from './components/BottomBar.jsx';
import SideDrawer from './components/SideDrawer.jsx';
import { enc, dec } from './util.js';

export default function Meeting({ conn, prefs, onLeave }) {
  const [connectionError, setConnectionError] = useState(null);

  return (
    <LiveKitRoom
      token={conn.token}
      serverUrl={conn.url}
      connect
      video={prefs.videoEnabled}
      audio={prefs.audioEnabled}
      onDisconnected={onLeave}
      onError={(err) => {
        console.error('LiveKit connection error:', err);
        setConnectionError(err.message || 'Failed to connect to LiveKit');
      }}
      data-lk-theme="default"
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      <MeetingShell
        conn={conn}
        prefs={prefs}
        onLeave={onLeave}
        connectionError={connectionError}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function MeetingShell({ conn, prefs, onLeave, connectionError }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();

  const [activePanel, setActivePanel] = useState(null); // 'info' | 'people' | 'chat' | 'activities' | 'host' | null
  const [hands, setHands] = useState({});
  const [pinnedId, setPinnedId] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const roomCode = new URLSearchParams(window.location.search).get('room') || 'meeting';

  // Handle reactions data channel
  const handleIncomingReaction = (senderId, senderName, emoji) => {
    if (emoji === '✋') {
      setHands((prev) => ({ ...prev, [senderId]: !prev[senderId] }));
    }
    const id = Math.random().toString();
    setReactions((prev) => [...prev, { id, text: `${senderName || 'Someone'} ${emoji}` }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3500);
  };

  const { send: sendReactionData } = useDataChannel('react', (msg) => {
    try {
      const data = dec(msg.payload);
      handleIncomingReaction(msg.from?.identity, msg.from?.name, data.emoji);
    } catch (e) {
      console.error(e);
    }
  });

  const sendReaction = (emoji) => {
    if (!localParticipant) return;
    try {
      sendReactionData(enc({ emoji }), { reliable: true });
    } catch {}
    handleIncomingReaction(localParticipant.identity, 'You', emoji);
  };

  // Handle chat data channel
  const { send: sendChatData } = useDataChannel('chat', (msg) => {
    try {
      const data = dec(msg.payload);
      setMessages((prev) => [
        ...prev,
        {
          sender: msg.from?.name || 'Someone',
          text: data.text,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          isLocal: false,
        },
      ]);
      if (activePanel !== 'chat') {
        setUnreadCount((c) => c + 1);
      }
    } catch (e) {
      console.error(e);
    }
  });

  const sendChat = (text) => {
    if (!localParticipant) return;
    try {
      sendChatData(enc({ text }), { reliable: true });
    } catch {}
    setMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        text,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        isLocal: true,
      },
    ]);
  };

  // Toggle Controls
  const toggleMic = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  const toggleVideo = async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (localParticipant) {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    }
  };

  const toggleHand = () => {
    sendReaction('✋');
  };

  const handleTogglePanel = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
    if (panelName === 'chat') {
      setUnreadCount(0);
    }
  };

  // Screen share priority or pinned participant priority
  const screenSharer = participants.find((p) => p.isScreenShareEnabled);
  const isHandRaised = localParticipant ? !!hands[localParticipant.identity] : false;

  // Grid layout class based on participant count
  const count = participants.length;
  let gridClass = 'gm-grid-1';
  if (count === 2) gridClass = 'gm-grid-2';
  else if (count >= 3 && count <= 4) gridClass = 'gm-grid-4';
  else if (count >= 5 && count <= 6) gridClass = 'gm-grid-6';
  else if (count > 6) gridClass = 'gm-grid-many';

  return (
    <div className="gm-meeting-shell">
      {/* Alert banner if LiveKit secret mismatch / connection error */}
      {connectionError && (
        <div className="gm-connection-alert">
          <strong>Connection notice:</strong> {connectionError}
          <span> (Ensure LIVEKIT_API_SECRET in server/.env matches your LiveKit Cloud project)</span>
        </div>
      )}

      {/* Main meeting area */}
      <div className="gm-meeting-body">
        {/* Video Stage */}
        <main className={`gm-video-stage ${activePanel ? 'with-drawer' : ''}`}>
          <div className={`gm-video-grid ${gridClass}`}>
            {participants.map((p) => (
              <VideoTile
                key={p.identity}
                participant={p}
                isHandRaised={!!hands[p.identity]}
                isPinned={pinnedId === p.identity}
                onTogglePin={(id) => setPinnedId(pinnedId === id ? null : id)}
              />
            ))}
          </div>

          {/* Floating Emoji Reactions Display */}
          <div className="gm-floating-reactions">
            {reactions.map((r) => (
              <div key={r.id} className="gm-floating-reaction-bubble">
                {r.text}
              </div>
            ))}
          </div>
        </main>

        {/* Side Drawer */}
        {activePanel && (
          <SideDrawer
            activePanel={activePanel}
            onClose={() => setActivePanel(null)}
            roomCode={roomCode}
            participants={participants}
            messages={messages}
            onSendMessage={sendChat}
            conn={conn}
            hands={hands}
          />
        )}
      </div>

      {/* Bottom Control Bar */}
      <BottomBar
        roomCode={roomCode}
        isMicOn={isMicrophoneEnabled}
        isVideoOn={isCameraEnabled}
        isScreenSharing={isScreenShareEnabled}
        isHandRaised={isHandRaised}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHand={toggleHand}
        onSendReaction={sendReaction}
        onLeave={onLeave}
        activePanel={activePanel}
        onTogglePanel={handleTogglePanel}
        participantCount={participants.length}
        unreadCount={unreadCount}
        isHost={conn.host}
      />
    </div>
  );
}
