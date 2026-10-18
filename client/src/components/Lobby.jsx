import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Sparkles, MonitorUp, ArrowLeft, Volume2, AlertCircle } from 'lucide-react';
import GoogleMeetHeader from './GoogleMeetHeader.jsx';

export default function Lobby({ roomCode, onJoin, onBack, error }) {
  const [name, setName] = useState(localStorage.getItem('gm_username') || '');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize camera & mic preview
  useEffect(() => {
    let activeStream = null;

    async function setupPreview() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        activeStream = s;
        setStream(s);
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }

        // Setup audio level visualizer
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;
            const srcNode = ctx.createMediaStreamSource(s);
            srcNode.connect(analyser);

            const checkAudio = () => {
              if (!analyserRef.current) return;
              const data = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(data);
              const avg = data.reduce((a, b) => a + b, 0) / data.length;
              setIsSpeaking(avg > 15);
              animFrameRef.current = requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        } catch {
          // Audio context might fail or be blocked by browser policy
        }
      } catch (err) {
        console.warn('Could not access camera/mic preview:', err);
        // Fallback: try audio only
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          activeStream = s;
          setStream(s);
          setIsVideoEnabled(false);
        } catch {
          setHasPermission(false);
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
        }
      }
    }

    setupPreview();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update track enabled states
  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoEnabled));
    }
  }, [isVideoEnabled, stream]);

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = isAudioEnabled));
    }
  }, [isAudioEnabled, stream]);

  const toggleMic = () => {
    setIsAudioEnabled((prev) => !prev);
  };

  const toggleCam = () => {
    setIsVideoEnabled((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const finalName = name.trim() || 'Guest';
    localStorage.setItem('gm_username', finalName);

    // Stop local preview tracks so LiveKit can bind them cleanly
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    onJoin({
      username: finalName,
      videoEnabled: isVideoEnabled,
      audioEnabled: isAudioEnabled,
    });
  };

  return (
    <div className="gm-lobby-page">
      <GoogleMeetHeader user={name || 'You'} />

      <main className="gm-lobby-main">
        {/* Left Side: Video Preview Card */}
        <div className="gm-preview-container">
          <div className="gm-preview-card">
            {isVideoEnabled && hasPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="gm-preview-video"
              />
            ) : (
              <div className="gm-preview-avatar-wrap">
                <div className="gm-preview-avatar">
                  {((name && name[0]) || 'U').toUpperCase()}
                </div>
                <span className="gm-preview-muted-text">Camera is off</span>
              </div>
            )}

            {/* Audio Wave Indicator */}
            {isAudioEnabled && (
              <div className={`gm-audio-wave ${isSpeaking ? 'speaking' : ''}`} title="Microphone active">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            {/* Floating Preview Controls */}
            <div className="gm-preview-controls">
              <button
                type="button"
                className={`gm-circle-btn ${!isAudioEnabled ? 'danger' : ''}`}
                onClick={toggleMic}
                title={isAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                type="button"
                className={`gm-circle-btn ${!isVideoEnabled ? 'danger' : ''}`}
                onClick={toggleCam}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                type="button"
                className="gm-circle-btn"
                title="Visual effects"
              >
                <Sparkles size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Join Info & Action Card */}
        <div className="gm-join-container">
          <div className="gm-join-card">
            <h1 className="gm-join-title">Ready to join?</h1>
            <p className="gm-join-room-code">Meeting code: <strong>{roomCode}</strong></p>
            <p className="gm-join-status">No one else is in the call</p>

            {error && (
              <div className="gm-error-box">
                <AlertCircle size={20} className="gm-error-icon" />
                <div className="gm-error-text">
                  <strong>Failed to join meeting</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="gm-join-form">
              <div className="gm-textfield">
                <input
                  type="text"
                  id="username"
                  className="gm-text-input"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
                <label htmlFor="username" className="gm-floating-label">Your name</label>
              </div>

              <div className="gm-join-buttons">
                <button type="submit" className="gm-btn-primary gm-btn-join-now">
                  Join now
                </button>
                <button
                  type="button"
                  className="gm-btn-secondary"
                  onClick={handleSubmit}
                  title="Present directly"
                >
                  <MonitorUp size={18} />
                  <span>Present</span>
                </button>
              </div>
            </form>

            <button type="button" className="gm-btn-back" onClick={onBack}>
              <ArrowLeft size={16} /> Back to home screen
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
