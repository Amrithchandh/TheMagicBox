import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { parse } from './parse.js';
import { listen } from './voice.js';

function Shape({ shape, color, size, pos }) {
  return (
    <mesh position={pos}>
      {shape === 'cube' ? (
        <boxGeometry args={[size * 2, size * 2, size * 2]} />
      ) : (
        <sphereGeometry args={[size, 32, 32]} />
      )}
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

export default function Space3D({ onBroadcastScene, incomingSceneMessage }) {
  const [shapes, setShapes] = useState([
    { id: 'initial-ball', shape: 'ball', color: '#ffb703', size: 0.8, pos: [0, 1, 0] },
  ]);
  const [voice, setVoice] = useState(false);
  const [status, setStatus] = useState('Voice off');
  const [heard, setHeard] = useState('');
  const [typed, setTyped] = useState('');

  const shapesRef = useRef([]);
  shapesRef.current = shapes;

  const broadcastChannelRef = useRef(null);

  const apply = (m) => {
    if (!m) return;
    if (m.type === 'add' && m.obj) {
      setShapes((s) => (s.some((x) => x.id === m.obj.id) ? s : [...s, m.obj]));
    }
    if (m.type === 'clear') {
      setShapes([]);
    }
    if (m.type === 'state' && Array.isArray(m.shapes)) {
      setShapes((s) => [...s, ...m.shapes.filter((n) => !s.some((x) => x.id === n.id))]);
    }
    if (m.type === 'hello' && shapesRef.current.length) {
      broadcast({ type: 'state', shapes: shapesRef.current });
    }
  };

  const broadcast = (data) => {
    // 1. Send via local BroadcastChannel for cross-tab local communication
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage(data);
      }
    } catch {}

    // 2. Send via parent callback (LiveKit data channel if connected)
    if (typeof onBroadcastScene === 'function') {
      try {
        onBroadcastScene(data);
      } catch {}
    }
  };

  // Setup BroadcastChannel for cross-tab communication
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('magic-box-3d-scene');
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => {
        apply(event.data);
      };

      // Ask existing peers for current scene state
      channel.postMessage({ type: 'hello' });

      return () => {
        channel.close();
      };
    }
  }, []);

  // Listen to incoming messages from parent (LiveKit)
  useEffect(() => {
    if (incomingSceneMessage) {
      apply(incomingSceneMessage);
    }
  }, [incomingSceneMessage]);

  const run = (text) => {
    setHeard(text);
    const cmd = parse(text);
    if (!cmd) return;
    apply(cmd);
    broadcast(cmd);
  };

  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!voice) return;
    return listen((t) => runRef.current(t), setStatus);
  }, [voice]);

  return (
    <div className="space">
      <div className="canvas">
        <Canvas camera={{ position: [0, 3, 9], fov: 50 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <gridHelper args={[12, 12, '#4285f4', '#3c4043']} position={[0, -1, 0]} />
          {shapes.map((s) => (
            <Shape key={s.id} {...s} />
          ))}
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>

      <div className="controls">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={voice ? 'on' : ''}
            onClick={() => setVoice(!voice)}
          >
            {voice ? 'Stop voice' : 'Start voice'}
          </button>
          <span className="status">{status}</span>
        </div>

        {heard && <p className="heard">Heard: “{heard}”</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) run(typed.trim());
            setTyped('');
          }}
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Try: put a red ball on the left"
          />
        </form>

        <button type="button" onClick={() => run('clear all')}>
          Clear space
        </button>
      </div>
    </div>
  );
}
