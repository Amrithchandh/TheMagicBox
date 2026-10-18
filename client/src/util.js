export const enc = (o) => new TextEncoder().encode(JSON.stringify(o));
export const dec = (p) => JSON.parse(new TextDecoder().decode(p));
