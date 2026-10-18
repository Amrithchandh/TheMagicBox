# Magic Box

> Google Meet-styled video conferencing platform with a shared, voice-controlled 3D collaborative space.

Say *"put a big red ball on the left"* or *"add a blue cube in the center"* and 3D objects appear in real-time for everyone in the call.

---

## Features

- **Google Meet Experience**:
  - Full Google Meet dark UI with responsive video grid, participant tiles, active speaker highlights, and avatar fallbacks.
  - Pre-join **Lobby** with real-time camera/microphone preview, audio waveform indicator, and device toggles.
  - Google Meet **Bottom Control Bar**: Microphone, Camera, Captions, Emoji reactions, Screen sharing, Hand raising, and Call termination.
  - Side Panels: **Meeting details** (copy link), **People** (search and host mute/remove), and **In-call messages** (real-time chat).
  - Floating emoji reactions that animate upwards on the screen.
- **Magic Box 3D Collaborative Space**:
  - Embedded inside the **Activities** panel.
  - Interactive Three.js / React Three Fiber 3D canvas synchronized across all participants using LiveKit Data Channels.
  - Voice-controlled object creation using the browser Web Speech API (Chrome/Edge).
  - Text command fallback (e.g. `put a red ball in the center`, `clear all`).

---

## Project Structure

```
magic-box/
├── client/          # React + Vite frontend (Google Meet UI + Three.js 3D space)
│   ├── src/
│   │   ├── components/
│   │   │   ├── GoogleMeetHeader.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── VideoTile.jsx
│   │   │   ├── BottomBar.jsx
│   │   │   └── SideDrawer.jsx
│   │   ├── App.jsx
│   │   ├── Meeting.jsx
│   │   ├── Space3D.jsx
│   │   ├── parse.js
│   │   ├── voice.js
│   │   └── styles.css
│   └── package.json
└── server/          # Node + Express token issuer & host moderation
    ├── index.js
    ├── .env.example
    └── package.json
```

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A free [LiveKit Cloud](https://cloud.livekit.io) account

### 2. Configure Environment Variables
Copy `server/.env.example` to `server/.env` and insert your LiveKit credentials from **Project Settings > Keys**:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
PORT=3001
```

### 3. Run the Backend Server
```bash
cd server
npm install
npm run dev
```

### 4. Run the Client
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Voice Commands
Inside the 3D space, toggle **Start voice** and speak:
- `"put a red ball in the center"`
- `"add a small blue cube on the left higher"`
- `"add another green ball at the back"`
- `"clear all"`

---

## License
MIT
