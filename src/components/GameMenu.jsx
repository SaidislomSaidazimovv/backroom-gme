import { useEffect, useState } from "react";
import { settings, SKINS, DIFFICULTIES, QUALITY } from "../engine/settings.js";
import { useSettings } from "../hooks/useSettings.js";

const set = settings.set;
const hex = (n) => "#" + n.toString(16).padStart(6, "0");

/**
 * Pre-game menu shown when the visitor chooses to enter the maze. Four sections:
 * PLAY (starts the game), SETTINGS, GRAPHICS, SKINS. All controls write to the
 * shared settings store, which the engine applies live.
 */
export default function GameMenu({ open, onClose, onPlay }) {
  const s = useSettings();
  const [tab, setTab] = useState("brief");

  // Esc closes the menu (only relevant pre-game; the engine's Esc handler is
  // gated on gameMode, so there's no conflict here).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const skin = SKINS.find((k) => k.id === s.skin) || SKINS[0];

  return (
    <div className={"game-menu" + (open ? " on" : "")} aria-hidden={!open}>
      <div className="gm-head">
        <div className="gm-title">LEVEL 0 <b>//</b> SIMULATION</div>
        <div className="gm-sub">CONFIGURE · THEN DESCEND</div>
      </div>

      <div className="gm-body">
        <nav className="gm-nav">
          <button className="gm-tab play" onClick={onPlay}>► PLAY</button>
          <button className={"gm-tab" + (tab === "settings" ? " active" : "")} onClick={() => setTab("settings")}>SETTINGS</button>
          <button className={"gm-tab" + (tab === "graphics" ? " active" : "")} onClick={() => setTab("graphics")}>GRAPHICS</button>
          <button className={"gm-tab" + (tab === "skins" ? " active" : "")} onClick={() => setTab("skins")}>SKINS</button>
        </nav>

        <section className="gm-panel">
          {tab === "brief" && (
            <>
              <h3>Objective — Find the Exit</h3>
              <p className="desc">
                Somewhere on this floor there is exactly one working door. Something patrols the dark between
                you and it, and your flashlight runs on a battery from 1996. Follow the whine, keep the beam on
                whatever moves, and do not stop walking.
              </p>
              <div className="gm-row"><span className="lbl">CONTROLS</span><span className="gm-hint">WASD MOVE · MOUSE LOOK · SHIFT RUN · F TORCH</span></div>
              <div className="gm-row"><span className="lbl">LOADOUT</span><span className="gm-val" style={{ color: skin.accent }}>{skin.name}</span></div>
              <div className="gm-row"><span className="lbl">DIFFICULTY</span><span className="gm-val">{DIFFICULTIES[s.difficulty].name}</span></div>
              <button className="gm-play-btn" onClick={onPlay}>► DESCEND INTO LEVEL 0</button>
            </>
          )}

          {tab === "settings" && (
            <>
              <h3>Settings</h3>
              <p className="desc">Tune the feel. Saved to this browser automatically.</p>
              <div className="gm-row">
                <span className="lbl">MOUSE SENSITIVITY</span>
                <div className="gm-ctrl">
                  <input type="range" className="gm-slider" min="0.3" max="2.5" step="0.05" value={s.sens} onChange={(e) => set({ sens: +e.target.value })} />
                  <span className="gm-val">{s.sens.toFixed(2)}</span>
                </div>
              </div>
              <div className="gm-row">
                <span className="lbl">INVERT Y-AXIS<small>flip vertical look</small></span>
                <button className={"gm-toggle" + (s.invertY ? " on" : "")} onClick={() => set({ invertY: !s.invertY })}>{s.invertY ? "ON" : "OFF"}</button>
              </div>
              <div className="gm-row">
                <span className="lbl">MASTER VOLUME</span>
                <div className="gm-ctrl">
                  <input type="range" className="gm-slider" min="0" max="1" step="0.01" value={s.volume} onChange={(e) => set({ volume: +e.target.value })} />
                  <span className="gm-val">{Math.round(s.volume * 100)}</span>
                </div>
              </div>
              <div className="gm-row">
                <span className="lbl">DIFFICULTY<small>{DIFFICULTIES[s.difficulty].hint}</small></span>
                <div className="gm-seg">
                  {Object.entries(DIFFICULTIES).map(([k, v]) => (
                    <button key={k} className={s.difficulty === k ? "on" : ""} onClick={() => set({ difficulty: k })}>{v.name}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "graphics" && (
            <>
              <h3>Graphics</h3>
              <p className="desc">Applies live to the render — no restart needed.</p>
              <div className="gm-row">
                <span className="lbl">QUALITY<small>resolution + shadow detail</small></span>
                <div className="gm-seg">
                  {Object.entries(QUALITY).map(([k, v]) => (
                    <button key={k} className={s.quality === k ? "on" : ""} onClick={() => set({ quality: k })}>{v.name}</button>
                  ))}
                </div>
              </div>
              <div className="gm-row">
                <span className="lbl">SHADOWS</span>
                <button className={"gm-toggle" + (s.shadows ? " on" : "")} onClick={() => set({ shadows: !s.shadows })}>{s.shadows ? "ON" : "OFF"}</button>
              </div>
              <div className="gm-row">
                <span className="lbl">VHS EFFECTS<small>scanlines · noise · vignette</small></span>
                <button className={"gm-toggle" + (s.vhs ? " on" : "")} onClick={() => set({ vhs: !s.vhs })}>{s.vhs ? "ON" : "OFF"}</button>
              </div>
              <div className="gm-row">
                <span className="lbl">FOG DENSITY</span>
                <div className="gm-ctrl">
                  <input type="range" className="gm-slider" min="0.02" max="0.16" step="0.004" value={s.fog} onChange={(e) => set({ fog: +e.target.value })} />
                  <span className="gm-val">{Math.round(s.fog * 1000)}</span>
                </div>
              </div>
            </>
          )}

          {tab === "skins" && (
            <>
              <h3>Skins</h3>
              <p className="desc">You never see your own body down here — your only visible gear is the torch. Pick your light.</p>
              <div className="gm-skins">
                {SKINS.map((k) => (
                  <button
                    key={k.id}
                    className={"gm-skin" + (s.skin === k.id ? " on" : "")}
                    style={{ "--sc": hex(k.torch) }}
                    onClick={() => set({ skin: k.id })}
                  >
                    <div className="swatch"></div>
                    <div className="nm">{k.name}</div>
                    <div className="ds">{k.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="gm-foot">
        <button className="gm-back" onClick={onClose}>◄ BACK TO TAPE</button>
        <span className="gm-hint">ESC TO EXIT · SETTINGS SAVE AUTOMATICALLY</span>
      </div>
    </div>
  );
}
