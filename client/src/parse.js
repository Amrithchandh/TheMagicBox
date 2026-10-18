// Turns "put a big red ball on the left" into a scene command.
const COLORS = {
  red: '#e63946', blue: '#3a86ff', green: '#2a9d8f', yellow: '#ffb703', orange: '#fb8500',
  purple: '#8338ec', pink: '#ff5da2', white: '#f1f1f1', black: '#2b2b2b', gray: '#8d99ae', grey: '#8d99ae',
};
const SIZES = { tiny: 0.3, small: 0.5, little: 0.5, big: 1.2, large: 1.2, huge: 1.8, giant: 1.8 };
const rand = (a, b) => a + Math.random() * (b - a);

export function parse(text) {
  const t = text.toLowerCase();
  if (/\b(clear|reset|remove|delete)\b.*\b(all|everything|space)\b|^clear\b/.test(t)) return { type: 'clear' };

  const shape = /\b(ball|sphere|globe)\b/.test(t) ? 'ball' : /\b(cube|block)\b/.test(t) ? 'cube' : null;
  if (!shape) return null;

  const color = Object.keys(COLORS).find((c) => t.includes(c));
  const size = Object.keys(SIZES).find((s) => t.includes(s));

  let [x, y, z] = [0, 1, 0];
  let placed = /\b(center|middle)\b/.test(t);
  if (/\bleft\b/.test(t)) { x = -2.5; placed = true; }
  if (/\bright\b/.test(t)) { x = 2.5; placed = true; }
  if (/\b(up|top|higher|above)\b/.test(t)) { y = 3; placed = true; }
  if (/\b(down|bottom|lower|below)\b/.test(t)) { y = 0; placed = true; }
  if (/\b(front|near|closer)\b/.test(t)) { z = 2.5; placed = true; }
  if (/\b(back|behind|far)\b/.test(t)) { z = -2.5; placed = true; }
  if (!placed) { x = rand(-3, 3); z = rand(-3, 3); }

  return {
    type: 'add',
    obj: {
      id: crypto.randomUUID(),
      shape,
      color: COLORS[color] || '#ffb703',
      size: SIZES[size] || 0.8,
      pos: [x, y, z],
    },
  };
}
