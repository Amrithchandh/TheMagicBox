import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Pin, PinOff, Hand } from 'lucide-react';
import { useIsSpeaking } from '@livekit/components-react';

const AVATAR_COLORS = [
  '#1a73e8', // Google Blue
  '#ea4335', // Google Red
  '#fbbc04', // Google Yellow
  '#34a853', // Google Green
  '#9334e6', // Purple
  '#e8710a', // Orange
  '#12b5cb', // Teal
];

function getAvatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function VideoTile({
  participant,
  isHandRaised = false,
  isPinned = false,
  onTogglePin,
}) {
  const isSpeaking = useIsSpeaking(participant);
  const videoRef = useRef(null);

  const cameraPub = participant.getTrackPublication('camera');
  const cameraTrack = cameraPub?.track;
  const isCameraEnabled = participant.isCameraEnabled && cameraTrack && !cameraPub?.isMuted;
  const isMicEnabled = participant.isMicrophoneEnabled && !participant.getTrackPublication('microphone')?.isMuted;

  useEffect(() => {
    const el = videoRef.current;
    if (el && cameraTrack) {
      cameraTrack.attach(el);
      return () => {
        cameraTrack.detach(el);
      };
    }
  }, [cameraTrack, isCameraEnabled]);

  const displayName = participant.name || participant.identity || 'Participant';
  const initial = (displayName[0] || 'U').toUpperCase();
  const avatarBg = getAvatarColor(displayName);

  return (
    <div
      className={`gm-video-tile ${isSpeaking ? 'speaking' : ''} ${isPinned ? 'pinned' : ''} ${
        isHandRaised ? 'hand-raised' : ''
      }`}
    >
      {/* Video element */}
      {isCameraEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="gm-tile-video"
        />
      ) : (
        <div className="gm-tile-avatar-container">
          <div className="gm-tile-avatar" style={{ backgroundColor: avatarBg }}>
            {initial}
          </div>
        </div>
      )}

      {/* Top right badges: Mute indicator & Hand raise */}
      <div className="gm-tile-top-right">
        {isHandRaised && (
          <div className="gm-hand-badge" title="Hand raised">
            <Hand size={16} />
          </div>
        )}
        {!isMicEnabled && (
          <div className="gm-muted-badge" title="Microphone muted">
            <MicOff size={16} />
          </div>
        )}
      </div>

      {/* Bottom left label: Name + pin button */}
      <div className="gm-tile-bottom-bar">
        <span className="gm-tile-name">
          {displayName} {participant.isLocal ? '(You)' : ''}
        </span>
        {onTogglePin && (
          <button
            type="button"
            className={`gm-tile-pin-btn ${isPinned ? 'active' : ''}`}
            onClick={() => onTogglePin(participant.identity)}
            title={isPinned ? 'Unpin' : 'Pin to screen'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
