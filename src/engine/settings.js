/**
 * Reactive settings store shared by the React menu (writer) and the imperative
 * engine (reader / live-applier). Persisted to localStorage. The engine
 * subscribes and applies graphics/skin changes live; per-frame values
 * (sensitivity, difficulty) are read straight from `settings.get()`.
 */

export const SKINS = [
  { id: "archivist", name: "ARCHIVIST", desc: "Standard-issue tungsten torch. Warm, familiar, dying.", torch: 0xffe2ae, fill: 0xffdba0, accent: "#e9e6dc" },
  { id: "surveyor",  name: "SURVEYOR",  desc: "Cold halogen. Clinical and far-reaching.",              torch: 0xcfe4ff, fill: 0xbcd4ff, accent: "#bcd4ff" },
  { id: "revenant",  name: "REVENANT",  desc: "Emergency red. It will see you first.",                 torch: 0xff6a4a, fill: 0xff5a3a, accent: "#ff6a4a" },
  { id: "drifter",   name: "DRIFTER",   desc: "Scavenged green LED. Night-eyes, low battery.",          torch: 0x8effa8, fill: 0x7cf29a, accent: "#8effa8" },
  { id: "void",      name: "VOID",      desc: "Failing violet bulb. Barely there at all.",              torch: 0xc9a8ff, fill: 0xb98cff, accent: "#c9a8ff" },
];

export const DIFFICULTIES = {
  easy:      { name: "EASY",      ent: 0.8, drain: 0.7,  hint: "It is slow. The battery lasts." },
  normal:    { name: "NORMAL",    ent: 1.0, drain: 1.0,  hint: "As the tape recorded it." },
  nightmare: { name: "NIGHTMARE", ent: 1.3, drain: 1.45, hint: "It is fast. The dark comes quickly." },
};

export const QUALITY = {
  low:    { name: "LOW",    ratio: 0.75, shadowMap: 512 },
  medium: { name: "MEDIUM", ratio: 1.0,  shadowMap: 1024 },
  high:   { name: "HIGH",   ratio: 1.5,  shadowMap: 1024 },
};

const KEY = "backrooms:settings";
const defaults = {
  sens: 1,          // mouse sensitivity multiplier (0.3 – 2.5)
  invertY: false,   // invert vertical look
  volume: 1,        // master volume 0 – 1
  difficulty: "normal",
  quality: "high",
  shadows: true,
  vhs: true,        // VHS overlays (scanlines / noise / vignette)
  fog: 0.088,       // fog density
  skin: "archivist",
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return { ...defaults };
}

let state = load();
const subs = new Set();

export const settings = {
  get: () => state,
  set: (patch) => {
    state = { ...state, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    subs.forEach((f) => f(state));
  },
  reset: () => settings.set({ ...defaults }),
  subscribe: (f) => { subs.add(f); return () => subs.delete(f); },
  defaults,
};
