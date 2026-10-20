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
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState(null);

  // If LiveKit fails or token is invalid, fallback smoothly to local mode
  const handleLiveKitError = (err) => {
    console.warn('LiveKit Cloud connection unavailable, falling back to Local Mode:', err);
    setConnectionNotice(
      'LiveKit Cloud secret is not configured in server/.env. Running in Local Mode with full UI, camera/mic, 3D space, and controls!'
    );
    setUseLocalFallback(true);
  };

  if (useLocalFallback) {
    return (
      <LocalMeeting
        conn={conn}
        prefs={prefs}
        onLeave={onLeave}
        notice={connectionNotice}
      />
    );
  }

  return (
    <LiveKitRoom
      token={conn.token}
      serverUrl={conn.url}
      connect
      video={prefs.videoEnabled}
      audio={prefs.audioEnabled}
      onError={handleLiveKitError}
      onDisconnected={(reason) => {
        // Only trigger fallback if disconnected unexpectedly during setup
        if (!useLocalFallback) {
          handleLiveKitError(new Error('Disconnected from LiveKit Cloud'));
        }
      }}
      data-lk-theme="default"
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      <LiveKitShell
        conn={conn}
        prefs={prefs}
        onLeave={onLeave}
        onErrorFallback={() => setUseLocalFallback(true)}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// -------------------------------------------------------------
// 1. LIVEKIT CLOUD SHELL (Active when LiveKit Cloud is connected)
// -------------------------------------------------------------
function LiveKitShell({ conn, prefs, onLeave, onErrorFallback }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();

  const [activePanel, setActivePanel] = useState(null);
  const [hands, setHands] = useState({});
  const [pinnedId, setPinnedId] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [incomingScene, setIncomingScene] = useState(null);

  const roomCode = new URLSearchParams(window.location.search).get('room') || 'meeting';

  // Fallback if connection fails
  useEffect(() => {
    const timer = setTimeout(() => {
      if (connectionState === 'disconnected') {
        onErrorFallback();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [connectionState, onErrorFallback]);

  // Reactions data channel
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
    } catch {}
  });

  const sendReaction = (emoji) => {
    if (!localParticipant) return;
    try {
      sendReactionData(enc({ emoji }), { reliable: true });
    } catch {}
    handleIncomingReaction(localParticipant.identity, 'You', emoji);
  };

  // Chat data channel
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
    } catch {}
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

  // 3D Scene data channel
  const { send: sendSceneData } = useDataChannel('scene', (msg) => {
    try {
      setIncomingScene(dec(msg.payload));
    } catch {}
  });

  const broadcastScene = (data) => {
    try {
      sendSceneData(enc(data), { reliable: true });
    } catch {}
  };

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

  const isHandRaised = localParticipant ? !!hands[localParticipant.identity] : false;

  const count = participants.length || 1;
  let gridClass = 'gm-grid-1';
  if (count === 2) gridClass = 'gm-grid-2';
  else if (count >= 3 && count <= 4) gridClass = 'gm-grid-4';
  else if (count >= 5 && count <= 6) gridClass = 'gm-grid-6';
  else if (count > 6) gridClass = 'gm-grid-many';

  return (
    <div className="gm-meeting-shell">
      <div className="gm-meeting-body">
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

          <div className="gm-floating-reactions">
            {reactions.map((r) => (
              <div key={r.id} className="gm-floating-reaction-bubble">
                {r.text}
              </div>
            ))}
          </div>
        </main>

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
            onBroadcastScene={broadcastScene}
            incomingSceneMessage={incomingScene}
          />
        )}
      </div>

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

// -------------------------------------------------------------
// 2. LOCAL MEETING (Resilient Google Meet UI with local media & BroadcastChannel)
// -------------------------------------------------------------
function LocalMeeting({ conn, prefs, onLeave, notice }) {
  const roomCode = new URLSearchParams(window.location.search).get('room') || 'meeting';
  const username = prefs?.username || localStorage.getItem('gm_username') || 'You';

  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(prefs?.audioEnabled !== false);
  const [isVideoOn, setIsVideoOn] = useState(prefs?.videoEnabled !== false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [activePanel, setActivePanel] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissNotice, setDismissNotice] = useState(false);

  // Simulated & cross-tab participants
  const [extraParticipants, setExtraParticipants] = useState([]);
  const [pinnedId, setPinnedId] = useState(null);

  const broadcastChannelRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Setup camera & mic stream
  useEffect(() => {
    let localMedia = null;

    async function initMedia() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localMedia = s;
        setStream(s);

        // Audio wave analysis for speaking indicator
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;
            const src = ctx.createMediaStreamSource(s);
            src.connect(analyser);

            const check = () => {
              if (!analyserRef.current) return;
              const data = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(data);
              const avg = data.reduce((a, b) => a + b, 0) / data.length;
              setIsSpeaking(avg > 18);
              requestAnimationFrame(check);
            };
            check();
          }
        } catch {}
      } catch (err) {
        console.warn('Could not access full media in local mode:', err);
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localMedia = s;
          setStream(s);
          setIsVideoOn(false);
        } catch {}
      }
    }

    initMedia();

    return () => {
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (localMedia) {
        localMedia.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Sync mic & video track states
  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOn));
    }
  }, [isVideoOn, stream]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = isMicOn));
    }
  }, [isMicOn, stream]);

  // Setup BroadcastChannel for cross-tab local communication
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`magic-box-room-${roomCode}`);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'chat') {
          setMessages((prev) => [...prev, payload]);
          if (activePanel !== 'chat') setUnreadCount((c) => c + 1);
        } else if (type === 'reaction') {
          triggerReaction(payload.name, payload.emoji);
        } else if (type === 'presence') {
          // Add peer if not present
          setExtraParticipants((prev) => {
            if (prev.some((p) => p.identity === payload.identity)) return prev;
            return [...prev, payload];
          });
        }
      };

      // Announce presence to other local tabs
      channel.postMessage({
        type: 'presence',
        payload: {
          identity: `peer-${Math.random().toString(36).slice(2, 6)}`,
          name: username,
          isCameraEnabled: false,
          isMicrophoneEnabled: true,
          isLocal: false,
        },
      });

      return () => channel.close();
    }
  }, [roomCode, username, activePanel]);

  const triggerReaction = (senderName, emoji) => {
    const id = Math.random().toString();
    setReactions((prev) => [...prev, { id, text: `${senderName || 'Someone'} ${emoji}` }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3500);
  };

  const handleSendReaction = (emoji) => {
    if (emoji === '✋') {
      setIsHandRaised(!isHandRaised);
    }
    triggerReaction('You', emoji);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'reaction',
        payload: { name: username, emoji },
      });
    }
  };

  const handleSendChat = (text) => {
    const msg = {
      sender: 'You',
      text,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      isLocal: true,
    };
    setMessages((prev) => [...prev, msg]);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'chat',
        payload: { ...msg, sender: username, isLocal: false },
      });
    }
  };

  const toggleMic = () => setIsMicOn(!isMicOn);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(s);
        setIsScreenSharing(true);
        s.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch {
        setIsScreenSharing(false);
      }
    }
  };

  const addSimulatedParticipant = () => {
    const names = ['Alex Rivera', 'Sarah Chen', 'Jordan Smith', 'Devin Taylor'];
    const randomName = names[extraParticipants.length % names.length];
    const newPeer = {
      identity: `sim-${Date.now()}`,
      name: `${randomName}`,
      isCameraEnabled: false,
      isMicrophoneEnabled: true,
      isLocal: false,
    };
    setExtraParticipants((prev) => [...prev, newPeer]);
  };

  const handleTogglePanel = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
    if (panelName === 'chat') setUnreadCount(0);
  };

  // Compile participants list
  const localParticipantObj = {
    identity: 'local-user',
    name: username,
    isLocal: true,
    stream: isScreenSharing && screenStream ? screenStream : stream,
    isCameraEnabled: isScreenSharing ? true : isVideoOn,
    isMicrophoneEnabled: isMicOn,
    isSpeaking,
  };

  const allParticipants = [localParticipantObj, ...extraParticipants];
  const count = allParticipants.length;

  let gridClass = 'gm-grid-1';
  if (count === 2) gridClass = 'gm-grid-2';
  else if (count >= 3 && count <= 4) gridClass = 'gm-grid-4';
  else if (count >= 5 && count <= 6) gridClass = 'gm-grid-6';
  else if (count > 6) gridClass = 'gm-grid-many';

  return (
    <div className="gm-meeting-shell">
      {/* Notice Banner */}
      {notice && !dismissNotice && (
        <div className="gm-connection-alert">
          <span>{notice}</span>
          <button
            type="button"
            className="gm-alert-dismiss"
            onClick={() => setDismissNotice(true)}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="gm-meeting-body">
        <main className={`gm-video-stage ${activePanel ? 'with-drawer' : ''}`}>
          <div className={`gm-video-grid ${gridClass}`}>
            {allParticipants.map((p) => (
              <VideoTile
                key={p.identity}
                participant={p}
                isHandRaised={p.isLocal ? isHandRaised : false}
                isPinned={pinnedId === p.identity}
                onTogglePin={(id) => setPinnedId(pinnedId === id ? null : id)}
              />
            ))}
          </div>

          <div className="gm-floating-reactions">
            {reactions.map((r) => (
              <div key={r.id} className="gm-floating-reaction-bubble">
                {r.text}
              </div>
            ))}
          </div>
        </main>

        {activePanel && (
          <SideDrawer
            activePanel={activePanel}
            onClose={() => setActivePanel(null)}
            roomCode={roomCode}
            participants={allParticipants}
            messages={messages}
            onSendMessage={handleSendChat}
            conn={{ host: 'local-user', token: 'local-token' }}
            hands={{ 'local-user': isHandRaised }}
            onAddParticipant={addSimulatedParticipant}
          />
        )}
      </div>

      <BottomBar
        roomCode={roomCode}
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHand={() => handleSendReaction('✋')}
        onSendReaction={handleSendReaction}
        onLeave={onLeave}
        activePanel={activePanel}
        onTogglePanel={handleTogglePanel}
        participantCount={allParticipants.length}
        unreadCount={unreadCount}
        isHost={true}
      />
    </div>
  );
}
