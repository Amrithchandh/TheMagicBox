import React, { useState } from 'react';
import { Video, Keyboard, Link as LinkIcon, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import GoogleMeetHeader from './GoogleMeetHeader.jsx';

export default function Home({ onStartMeeting, onJoinMeeting, error }) {
  const [code, setCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    // Extract room code if full URL was pasted
    let clean = code.trim();
    if (clean.includes('room=')) {
      clean = new URL(clean, window.location.origin).searchParams.get('room') || clean;
    } else if (clean.includes('/')) {
      clean = clean.split('/').pop();
    }
    onJoinMeeting(clean);
  };

  return (
    <div className="gm-home-page">
      <GoogleMeetHeader />

      {error && (
        <div className="gm-global-error">
          <span>{error}</span>
        </div>
      )}

      <main className="gm-home-main">
        <section className="gm-home-left">
          <h1 className="gm-home-title">
            Video calls and meetings for everyone
          </h1>
          <p className="gm-home-subtitle">
            Connect, collaborate, and celebrate from anywhere with Magic Box. Enjoy secure Google Meet-style video calls and collaborative voice-controlled 3D activities.
          </p>

          <div className="gm-home-actions">
            <button className="gm-btn-primary gm-btn-new-meeting" onClick={onStartMeeting}>
              <Video size={20} className="gm-btn-icon" />
              <span>New meeting</span>
            </button>

            <form className="gm-home-join-form" onSubmit={handleJoin}>
              <div className="gm-input-wrapper">
                <Keyboard size={20} className="gm-input-icon" />
                <input
                  type="text"
                  className="gm-input-code"
                  placeholder="Enter a code or link"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className={`gm-btn-join ${code.trim() ? 'active' : ''}`}
                disabled={!code.trim()}
              >
                Join
              </button>
            </form>
          </div>

          <div className="gm-home-divider" />

          <div className="gm-home-footer-links">
            <a href="https://support.google.com/meet" target="_blank" rel="noreferrer" className="gm-link">
              Learn more about Google Meet
            </a>
          </div>
        </section>

        <section className="gm-home-right">
          <div className="gm-carousel-card">
            <div className="gm-carousel-illustration">
              <div className="gm-illustration-circle gm-circle-blue">
                <Video size={48} />
              </div>
              <div className="gm-illustration-tag">
                <Sparkles size={16} /> 3D Activities Built-in
              </div>
            </div>
            <h2 className="gm-carousel-title">Get a link you can share</h2>
            <p className="gm-carousel-desc">
              Click <strong>New meeting</strong> to generate a link you can send to people you want to meet with.
            </p>
            <div className="gm-carousel-dots">
              <span className="gm-dot active"></span>
              <span className="gm-dot"></span>
              <span className="gm-dot"></span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
