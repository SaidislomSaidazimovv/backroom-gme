export default function GameHud() {
  return (
    <div id="gameHud" aria-hidden="true">
      <div className="gh-top">
        <span className="osd">OBJECTIVE: FIND THE EXIT DOOR</span>
        <span className="osd" id="gTime">T+ 0:00</span>
        <button id="gQuit" className="osd">✕ QUIT</button>
      </div>
      <div className="xh"></div>
      <div className="gh-bottom">
        <div className="gbat"><span className="osd">TORCH</span><div className="gbar"><div id="gBatFill"></div></div></div>
        <span className="osd" id="gHint"></span>
      </div>
    </div>
  );
}
