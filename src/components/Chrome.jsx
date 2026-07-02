export default function Chrome() {
  return (
    <>
      <nav>
        <div className="osd">▲ BCKRMS_96</div>
        <div className="osd hide-m" id="tapePos">SP 0:00:00</div>
        <div className="rec osd"><i></i>REC</div>
      </nav>
      <div className="hud-b">
        <div className="osd" id="clock">SEP 23 1996 &nbsp; PM 11:47:00</div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="osd" id="battery">BAT ▮▮▮▯ 87%</span>
          <button id="torchBtn" className="osd" aria-pressed="true">TORCH: ON</button>
          <button id="soundBtn" className="osd" aria-pressed="false">HUM: OFF</button>
        </div>
      </div>
    </>
  );
}
