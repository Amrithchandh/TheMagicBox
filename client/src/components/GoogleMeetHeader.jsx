import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquareWarning, Settings, Grid, Video } from 'lucide-react';

export default function GoogleMeetHeader({ user = 'You' }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) +
          ' • ' +
          now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="gm-header">
      <div className="gm-header-left">
        <div className="gm-logo">
          <svg className="gm-logo-icon" viewBox="0 0 48 48" width="36" height="36">
            <path fill="#00832d" d="M37 24.5V13c0-1.66-1.34-3-3-3H7c-1.66 0-3 1.34-3 3v22c0 1.66 1.34 3 3 3h27c1.66 0 3-1.34 3-3V23.5l7 6v-11l-7 6z" />
            <path fill="#0066da" d="M34 10H7c-1.66 0-3 1.34-3 3v9h33v-9c0-1.66-1.34-3-3-3z" />
            <path fill="#e94235" d="M34 38H7c-1.66 0-3-1.34-3-3v-9h33v9c0 1.66-1.34 3-3 3z" />
            <path fill="#2684fc" d="M34 10H20v28h14c1.66 0 3-1.34 3-3V13c0-1.66-1.34-3-3-3z" />
            <path fill="#00ac47" d="M20 10H7c-1.66 0-3 1.34-3 3v22c0 1.66 1.34 3 3 3h13V10z" />
            <path fill="#ea4335" d="M44 18.5l-7 5.5 7 5.5V18.5z" />
            <path fill="#ffba00" d="M37 29.5l7 5.5V35c0 1.66-1.34 3-3 3h-4v-8.5z" />
          </svg>
          <span className="gm-logo-text">Magic <b>Box</b></span>
        </div>
      </div>

      <div className="gm-header-right">
        <span className="gm-header-time">{time}</span>
        <button className="gm-icon-btn" title="Support" aria-label="Support">
          <HelpCircle size={20} />
        </button>
        <button className="gm-icon-btn" title="Feedback" aria-label="Feedback">
          <MessageSquareWarning size={20} />
        </button>
        <button className="gm-icon-btn" title="Settings" aria-label="Settings">
          <Settings size={20} />
        </button>
        <button className="gm-icon-btn" title="Google apps" aria-label="Google apps">
          <Grid size={20} />
        </button>
        <div className="gm-user-avatar" title={`Signed in as ${user}`}>
          {(user[0] || 'U').toUpperCase()}
        </div>
      </div>
    </header>
  );
}
