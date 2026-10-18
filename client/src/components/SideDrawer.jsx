import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Search,
  Mic,
  MicOff,
  UserX,
  Send,
  Boxes,
  ArrowLeft,
  Sparkles,
  BarChart2,
  FileText,
  Lock,
} from 'lucide-react';
import Space3D from '../Space3D.jsx';

export default function SideDrawer({
  activePanel,
  onClose,
  roomCode,
  participants = [],
  messages = [],
  onSendMessage,
  conn,
  hands = {},
}) {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeActivity, setActiveActivity] = useState('magic-box'); // default to magic-box for immediate access

  if (!activePanel) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const callHostApi = (path, identity) => {
    fetch(`/api/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${conn.token}`,
      },
      body: JSON.stringify({ identity }),
    });
  };

  const filteredPeople = participants.filter((p) =>
    (p.name || p.identity || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="gm-drawer">
      {/* Drawer Header */}
      <div className="gm-drawer-header">
        <h2 className="gm-drawer-title">
          {activePanel === 'info' && 'Meeting details'}
          {activePanel === 'people' && 'People'}
          {activePanel === 'chat' && 'In-call messages'}
          {activePanel === 'activities' && (activeActivity ? 'Magic Box 3D' : 'Activities')}
          {activePanel === 'host' && 'Host controls'}
        </h2>
        <div className="gm-drawer-header-actions">
          {activePanel === 'activities' && activeActivity && (
            <button
              type="button"
              className="gm-icon-btn"
              onClick={() => setActiveActivity(null)}
              title="All activities"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <button type="button" className="gm-icon-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="gm-drawer-content">
        {/* PANEL 1: MEETING DETAILS */}
        {activePanel === 'info' && (
          <div className="gm-info-panel">
            <div className="gm-info-section">
              <h3>Joining info</h3>
              <p className="gm-info-url">{window.location.href}</p>
              <button type="button" className="gm-btn-copy" onClick={handleCopy}>
                {copied ? <Check size={18} className="gm-text-green" /> : <Copy size={18} />}
                <span>{copied ? 'Link copied' : 'Copy joining info'}</span>
              </button>
            </div>
            <div className="gm-info-divider" />
            <div className="gm-info-section">
              <span className="gm-label">Meeting code</span>
              <p className="gm-code-display">{roomCode}</p>
            </div>
          </div>
        )}

        {/* PANEL 2: PEOPLE */}
        {activePanel === 'people' && (
          <div className="gm-people-panel">
            <div className="gm-search-box">
              <Search size={18} className="gm-search-icon" />
              <input
                type="text"
                placeholder="Search for people"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="gm-search-input"
              />
            </div>

            <div className="gm-people-count">IN CALL ({filteredPeople.length})</div>

            <ul className="gm-people-list">
              {filteredPeople.map((p) => {
                const name = p.name || p.identity || 'Participant';
                const initial = (name[0] || 'U').toUpperCase();
                const isMuted = !p.isMicrophoneEnabled;
                return (
                  <li key={p.identity} className="gm-person-row">
                    <div className="gm-person-left">
                      <div className="gm-person-avatar">{initial}</div>
                      <div className="gm-person-meta">
                        <span className="gm-person-name">
                          {hands[p.identity] ? '✋ ' : ''}
                          {name}
                          {p.isLocal ? ' (You)' : ''}
                        </span>
                        {p.identity === conn.host && (
                          <span className="gm-host-tag">Meeting host</span>
                        )}
                      </div>
                    </div>

                    <div className="gm-person-actions">
                      {isMuted ? (
                        <MicOff size={16} className="gm-text-muted" title="Muted" />
                      ) : (
                        <Mic size={16} className="gm-text-active" title="Microphone on" />
                      )}

                      {conn.host && !p.isLocal && (
                        <>
                          <button
                            type="button"
                            className="gm-person-btn"
                            onClick={() => callHostApi('mute', p.identity)}
                            title="Mute participant"
                          >
                            <MicOff size={15} />
                          </button>
                          <button
                            type="button"
                            className="gm-person-btn danger"
                            onClick={() => callHostApi('remove', p.identity)}
                            title="Remove from call"
                          >
                            <UserX size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* PANEL 3: CHAT */}
        {activePanel === 'chat' && (
          <div className="gm-chat-panel">
            <div className="gm-chat-disclaimer">
              Messages can only be seen by people in the call and are deleted when the call ends.
            </div>

            <div className="gm-chat-messages">
              {messages.length === 0 ? (
                <div className="gm-chat-empty">
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`gm-chat-item ${m.isLocal ? 'local' : ''}`}>
                    <div className="gm-chat-meta">
                      <span className="gm-chat-sender">{m.sender}</span>
                      <span className="gm-chat-time">{m.time}</span>
                    </div>
                    <div className="gm-chat-text">{m.text}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="gm-chat-input-form">
              <input
                type="text"
                placeholder="Send a message to everyone"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="gm-chat-input"
              />
              <button
                type="submit"
                className="gm-chat-send-btn"
                disabled={!chatInput.trim()}
                title="Send"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* PANEL 4: ACTIVITIES */}
        {activePanel === 'activities' && (
          <div className="gm-activities-panel">
            {!activeActivity ? (
              <div className="gm-activities-list">
                <div
                  className="gm-activity-card active-card"
                  onClick={() => setActiveActivity('magic-box')}
                >
                  <div className="gm-activity-icon">
                    <Boxes size={28} />
                  </div>
                  <div className="gm-activity-info">
                    <h4>Magic Box 3D Space</h4>
                    <p>Voice-controlled shared 3D collaborative environment.</p>
                  </div>
                </div>

                <div className="gm-activity-card disabled">
                  <div className="gm-activity-icon grey">
                    <FileText size={28} />
                  </div>
                  <div className="gm-activity-info">
                    <h4>Whiteboarding</h4>
                    <p>Collaborative whiteboard canvas (Coming soon).</p>
                  </div>
                </div>

                <div className="gm-activity-card disabled">
                  <div className="gm-activity-icon grey">
                    <BarChart2 size={28} />
                  </div>
                  <div className="gm-activity-info">
                    <h4>Polls</h4>
                    <p>Conduct live attendee polls (Coming soon).</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="gm-activity-embed">
                <Space3D />
              </div>
            )}
          </div>
        )}

        {/* PANEL 5: HOST CONTROLS */}
        {activePanel === 'host' && (
          <div className="gm-host-panel">
            <div className="gm-host-card">
              <div className="gm-host-card-header">
                <Lock size={20} />
                <h3>Meeting moderation</h3>
              </div>
              <p className="gm-host-card-desc">
                Let everyone:
              </p>
              <div className="gm-host-row">
                <span>Share their screen</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="gm-host-row">
                <span>Send chat messages</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="gm-host-row">
                <span>Turn on their microphone</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="gm-host-row">
                <span>Turn on their video</span>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
