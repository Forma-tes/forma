// Brand-inspired card looks for installment apps. Colors only — no logos are copied.
export const PROVIDER_THEMES = {
  Valu: { a: '#5b2a86', b: '#e8426f' },
  Aman: { a: '#0f7a4a', b: '#f08a1c' },
  Souhoola: { a: '#0b4f8a', b: '#19b5c9' },
  Contact: { a: '#c8102e', b: '#5a0a1a' },
  Sympl: { a: '#6d3fe0', b: '#2a1670' },
  Halan: { a: '#2f4cdd', b: '#0a1a63' },
  Forsa: { a: '#0f8f7e', b: '#0b3d52' },
  Shahry: { a: '#e0561d', b: '#7a1d0c' },
  Mogo: { a: '#0e8f5a', b: '#063b2a' },
  Klivvr: { a: '#1f1f2e', b: '#6d3fe0' },
  Seven: { a: '#d6336c', b: '#5b0f2e' },
  TRU: { a: '#0a7ea4', b: '#062c3f' },
  Mylo: { a: '#e8a317', b: '#7a4a05' },
  'Premium Card': { a: '#2a2f3d', b: '#0c0e14' },
};
const clean = s => String(s || '').trim().toLowerCase();
export function providerTheme(account) {
  const hit = Object.keys(PROVIDER_THEMES).find(k => clean(k) === clean(account?.name));
  if (hit) return { ...PROVIDER_THEMES[hit], preset: hit };
  const c = account?.color || '#3157f6';
  return { a: c, b: `color-mix(in srgb,${c} 55%,#0b1033)`, preset: null };
}
