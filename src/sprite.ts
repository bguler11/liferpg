import { tierOf } from './logic';

const R = (x: number, y: number, w: number, h: number, c: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

/** Seviyeye göre değişen pixel karakter (SVG metni). Kullanıcı girdisi içermez. */
export function spriteSvg(level: number, cape: boolean, size: number): string {
  const t = tierOf(level);
  const body = ['#6b6b7a', '#3b6fd4', '#9fb4c9', '#ffc933'][t];
  const body2 = ['#55556a', '#2b57b0', '#7c93ab', '#c99400'][t];
  let s = `<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">`;
  if (cape) s += R(3, 7, 10, 7, '#b3263e') + R(3, 13, 10, 1, '#7d1a2b');
  s += R(5, 12, 2, 2, '#3a2f7a') + R(9, 12, 2, 2, '#3a2f7a') + R(5, 14, 2, 1, '#8a5a2b') + R(9, 14, 2, 1, '#8a5a2b');
  s += R(4, 7, 8, 5, body) + R(4, 11, 8, 1, body2);
  s += R(6, 7, 4, 1, t < 2 ? '#f4ecd8' : '#e8f4ff') + R(4, 10, 8, 1, '#ffc933');
  s += R(3, 7, 1, 3, body) + R(12, 7, 1, 3, body) + R(3, 10, 1, 1, '#f2c9a0') + R(12, 10, 1, 1, '#f2c9a0');
  s += R(5, 4, 6, 3, '#f2c9a0') + R(6, 5, 1, 1, '#120e26') + R(9, 5, 1, 1, '#120e26');
  s += R(5, 2, 6, 1, '#5b3a29') + R(4, 3, 8, 1, '#5b3a29') + R(4, 4, 1, 2, '#5b3a29') + R(11, 4, 1, 2, '#5b3a29');
  if (t >= 2) {
    const hm = t === 3 ? '#ffc933' : '#9fb4c9';
    s += R(4, 2, 8, 2, hm) + R(4, 4, 1, 2, hm) + R(11, 4, 1, 2, hm);
    if (t === 3) s += R(7, 0, 2, 2, '#b3263e');
  }
  if (t === 0) s += R(14, 5, 1, 6, '#8a5a2b');
  else {
    s += R(14, 3, 1, 7, t === 3 ? '#e8f4ff' : '#d8e4f0') + R(13, 10, 3, 1, '#ffc933') + R(14, 11, 1, 1, '#8a5a2b');
    if (t === 3) s += R(15, 2, 1, 1, '#ffc933');
  }
  if (t >= 2) s += R(1, 8, 2, 4, '#b3263e') + R(1, 8, 2, 1, '#ffc933') + R(1, 11, 2, 1, '#ffc933');
  return s + '</svg>';
}
