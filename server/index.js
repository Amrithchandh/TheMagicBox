import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AccessToken, RoomServiceClient, TokenVerifier } from 'livekit-server-sdk';

const { LIVEKIT_URL: url, LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = process.env;
const rooms = new RoomServiceClient(url, key, secret);
const verifier = new TokenVerifier(key, secret);
const hosts = new Map(); // room -> host identity

const hostIsPresent = async (room) => {
  try {
    const people = await rooms.listParticipants(room);
    return people.some((p) => p.identity === hosts.get(room));
  } catch { return false; }
};

const app = express();
app.use(cors(), express.json());

// Join: the first person in an empty room becomes host.
app.post('/api/token', async (req, res) => {
  const { room, name } = req.body;
  if (!room || !name) return res.status(400).json({ error: 'room and name are required' });
  const identity = `${name}-${Math.random().toString(36).slice(2, 7)}`;
  const host = !(hosts.has(room) && (await hostIsPresent(room)));
  if (host) hosts.set(room, identity);
  const at = new AccessToken(key, secret, { identity, name, ttl: '4h' });
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, roomAdmin: host });
  res.json({ token: await at.toJwt(), url, host });
});

// Host-only actions: the caller proves they are host with their meeting token.
const hostOnly = async (req, res, next) => {
  try {
    const claims = await verifier.verify((req.headers.authorization || '').replace('Bearer ', ''));
    if (!claims.video?.roomAdmin) return res.status(403).json({ error: 'host only' });
    req.room = claims.video.room;
    next();
  } catch { res.status(401).json({ error: 'invalid token' }); }
};

app.post('/api/mute', hostOnly, async (req, res) => {
  const { identity } = req.body;
  const p = await rooms.getParticipant(req.room, identity);
  for (const t of p.tracks) if (t.type === 0) await rooms.mutePublishedTrack(req.room, identity, t.sid, true); // 0 = audio
  res.json({ ok: true });
});

app.post('/api/remove', hostOnly, async (req, res) => {
  await rooms.removeParticipant(req.room, req.body.identity);
  res.json({ ok: true });
});

app.listen(process.env.PORT || 3001, () => console.log('Magic Box server running'));
