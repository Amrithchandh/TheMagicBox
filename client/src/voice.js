// Free browser speech recognition (Chrome / Edge). Returns a stop function.
export function listen(onText, onStatus) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onStatus('Voice commands need Chrome or Edge'); return () => {}; }
  const r = new SR();
  r.continuous = true;
  r.interimResults = false;
  r.lang = 'en-US';
  let stopped = false;
  r.onresult = (e) => {
    const res = e.results[e.results.length - 1];
    if (res.isFinal) onText(res[0].transcript.trim());
  };
  r.onend = () => { if (!stopped) try { r.start(); } catch {} };
  r.onerror = (e) => onStatus(`Voice error: ${e.error}`);
  r.start();
  onStatus('Listening');
  return () => { stopped = true; r.stop(); onStatus('Voice off'); };
}
