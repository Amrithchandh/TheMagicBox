import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  Smile,
  Subtitles,
  MoreVertical,
  PhoneOff,
  Info,
  Users,
  MessageSquare,
  Shapes,
  ShieldCheck,
} from 'lucide-react';

const REACTION_EMOJIS = ['💖', '👍', '🎉', '👏', '🤔', '😢'];

export default function BottomBar({
  roomCode,
  isMicOn,
  isVideoOn,
  isScreenSharing,
  isHandRaised,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onSendReaction,
  onLeave,
  activePanel,
  onTogglePanel,
  participantCount = 1,
  unreadCount = 0,
  isHost = false,
}) {
  const [time, setTime] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEmojiClick = (emoji) => {
    onSendReaction(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <footer className="gm-bottom-bar">
      {/* Left: Time and Meeting Code */}
      <div className="gm-bar-left">
        <span className="gm-bar-time">{time}</span>
        <span className="gm-bar-divider">|</span>
        <span className="gm-bar-code" title="Meeting code">{roomCode}</span>
      </div>

      {/* Center: Main Call Controls */}
      <div className="gm-bar-center">
        {/* Microphone */}
        <button
          type="button"
          className={`gm-ctrl-btn ${!isMicOn ? 'off-danger' : ''}`}
          onClick={onToggleMic}
          title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
          aria-label={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Video / Camera */}
        <button
          type="button"
          className={`gm-ctrl-btn ${!isVideoOn ? 'off-danger' : ''}`}
          onClick={onToggleVideo}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Captions */}
        <button
          type="button"
          className={`gm-ctrl-btn ${captionsOn ? 'active-blue' : ''}`}
          onClick={() => setCaptionsOn(!captionsOn)}
          title={captionsOn ? 'Turn off captions' : 'Turn on captions'}
        >
          <Subtitles size={20} />
        </button>

        {/* Emoji Reactions */}
        <div className="gm-reaction-wrapper">
          {showEmojiPicker && (
            <div className="gm-emoji-popup">
              {REACTION_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="gm-emoji-item"
                  onClick={() => handleEmojiClick(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`gm-ctrl-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Send a reaction"
          >
            <Smile size={20} />
          </button>
        </div>

        {/* Screen Share */}
        <button
          type="button"
          className={`gm-ctrl-btn ${isScreenSharing ? 'active-blue' : ''}`}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop presenting' : 'Present now'}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
        </button>

        {/* Raise Hand */}
        <button
          type="button"
          className={`gm-ctrl-btn ${isHandRaised ? 'active-yellow' : ''}`}
          onClick={onToggleHand}
          title={isHandRaised ? 'Lower hand' : 'Raise hand'}
        >
          <Hand size={20} />
        </button>

        {/* More Options */}
        <button
          type="button"
          className="gm-ctrl-btn"
          title="More options"
        >
          <MoreVertical size={20} />
        </button>

        {/* Leave Call */}
        <button
          type="button"
          className="gm-leave-btn"
          onClick={onLeave}
          title="Leave call"
        >
          <PhoneOff size={22} />
        </button>
      </div>

      {/* Right: Panels & Drawer Toggles */}
      <div className="gm-bar-right">
        {/* Info */}
        <button
          type="button"
          className={`gm-panel-btn ${activePanel === 'info' ? 'active' : ''}`}
          onClick={() => onTogglePanel('info')}
          title="Meeting details"
        >
          <Info size={20} />
        </button>

        {/* People */}
        <button
          type="button"
          className={`gm-panel-btn ${activePanel === 'people' ? 'active' : ''}`}
          onClick={() => onTogglePanel('people')}
          title="People"
        >
          <Users size={20} />
          <span className="gm-badge">{participantCount}</span>
        </button>

        {/* Chat */}
        <button
          type="button"
          className={`gm-panel-btn ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => onTogglePanel('chat')}
          title="Chat with everyone"
        >
          <MessageSquare size={20} />
          {unreadCount > 0 && <span className="gm-badge-dot"></span>}
        </button>

        {/* Activities (Magic Box 3D Space) */}
        <button
          type="button"
          className={`gm-panel-btn ${activePanel === 'activities' ? 'active' : ''}`}
          onClick={() => onTogglePanel('activities')}
          title="Activities"
        >
          <Shapes size={20} />
        </button>

        {/* Host Controls (if host) */}
        {isHost && (
          <button
            type="button"
            className={`gm-panel-btn ${activePanel === 'host' ? 'active' : ''}`}
            onClick={() => onTogglePanel('host')}
            title="Host controls"
          >
            <ShieldCheck size={20} />
          </button>
        )}
      </div>
    </footer>
  );
}
