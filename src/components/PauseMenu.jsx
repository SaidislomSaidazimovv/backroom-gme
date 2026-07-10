import { settings } from "../engine/settings.js";
import { useSettings } from "../hooks/useSettings.js";

const set = settings.set;
const fire = (name) => dispatchEvent(new CustomEvent(name));

/**
 * In-game pause overlay (Esc). Shows quick live settings plus resume / restart /
 * quit. The engine owns the paused state and toggles this via the
 * "backrooms:pausestate" event; the buttons fire events the engine listens for.
 */
export default function PauseMenu({ open }) {
  const s = useSettings();
  if (!open) return null;
  return (
    <div className="pause-menu">
      <div className="pm-box">
        <h2 className="pm-title">PAUSED</h2>
        <div className="pm-quick">
          <div className="gm-row">
            <span className="lbl">MOUSE SENSITIVITY</span>
            <div className="gm-ctrl">
              <input type="range" className="gm-slider" min="0.3" max="2.5" step="0.05" value={s.sens} onChange={(e) => set({ sens: +e.target.value })} />
              <span className="gm-val">{s.sens.toFixed(2)}</span>
            </div>
          </div>
          <div className="gm-row">
            <span className="lbl">MASTER VOLUME</span>
            <div className="gm-ctrl">
              <input type="range" className="gm-slider" min="0" max="1" step="0.01" value={s.volume} onChange={(e) => set({ volume: +e.target.value })} />
              <span className="gm-val">{Math.round(s.volume * 100)}</span>
            </div>
          </div>
          <div className="gm-row">
            <span className="lbl">INVERT Y-AXIS</span>
            <button className={"gm-toggle" + (s.invertY ? " on" : "")} onClick={() => set({ invertY: !s.invertY })}>{s.invertY ? "ON" : "OFF"}</button>
          </div>
        </div>
        <div className="pm-btns">
          <button className="pm-btn primary" onClick={() => fire("backrooms:resume")}>► RESUME</button>
          <button className="pm-btn" onClick={() => fire("backrooms:start")}>↻ RESTART</button>
          <button className="pm-btn" onClick={() => fire("backrooms:quit")}>■ QUIT TO TAPE</button>
        </div>
        <div className="gm-hint">ESC TO RESUME · SETTINGS SAVE AUTOMATICALLY</div>
      </div>
    </div>
  );
}
