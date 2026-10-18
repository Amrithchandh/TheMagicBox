import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useDataChannel, useConnectionState } from '@livekit/components-react';
import { enc, dec } from './util.js';
import { parse } from './parse.js';
import { listen } from './voice.js';

function Shape({ shape, color, size, pos }) {
  return (
    <mesh position={pos}>
      {shape === 'cube' ? <boxGeometry args={[size * 2, size * 2, size * 2]} /> : <sphereGeometry args={[size, 32, 32]} />}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function Space3D() {
  const [shapes, setShapes] = useState([]);
  const [voice, setVoice] = useState(false);
  const [status, setStatus] = useState('Voice off');
  const [heard, setHeard] = useState('');
  const [typed, setTyped] = useState('');
  const shapesRef = useRef([]);
  shapesRef.current = shapes;
  const connection = useConnectionState();

  const apply = (m) => {
    if (m.type === 'add') setShapes((s) => (s.some((x) => x.id === m.obj.id) ? s : [...s, m.obj]));
    if (m.type === 'clear') setShapes([]);
    if (m.type === 'state') setShapes((s) => [...s, ...m.shapes.filter((n) => !s.some((x) => x.id === n.id))]);
    if (m.type === 'hello' && shapesRef.current.length) send(enc({ type: 'state', shapes: shapesRef.current }), { reliable: true });
  };

  const { send } = useDataChannel('scene', (msg) => apply(dec(msg.payload)));

  // Late joiners ask everyone for the current scene.
  useEffect(() => {
    if (connection === 'connected') send(enc({ type: 'hello' }), { reliable: true });
  }, [connection]);

  const run = (text) => {
    setHeard(text);
    const cmd = parse(text);
    if (!cmd) return;
    apply(cmd);
    send(enc(cmd), { reliable: true });
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
          <gridHelper args={[12, 12, '#6b5ca5', '#2f2750']} position={[0, -1, 0]} />
          {shapes.map((s) => <Shape key={s.id} {...s} />)}
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
      <div className="controls">
        <button className={voice ? 'on' : ''} onClick={() => setVoice(!voice)}>{voice ? 'Stop voice' : 'Start voice'}</button>
        <span className="status">{status}</span>
        {heard && <p className="heard">Heard: “{heard}”</p>}
        <form onSubmit={(e) => { e.preventDefault(); if (typed) run(typed); setTyped(''); }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type: put a red ball on the left" />
        </form>
        <button onClick={() => run('clear all')}>Clear space</button>
      </div>
    </div>
  );
}
