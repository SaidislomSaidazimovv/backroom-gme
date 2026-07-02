export default function GameEnd() {
  return (
    <div id="gameEnd">
      <h2 id="gEndTitle">IT FOUND YOU</h2>
      <div className="osd" id="gEndSub"></div>
      <div className="gend-btns">
        <button id="gRetry" className="osd">► TRY AGAIN</button>
        <button id="gReturn" className="osd">■ RETURN TO TAPE</button>
      </div>
    </div>
  );
}
