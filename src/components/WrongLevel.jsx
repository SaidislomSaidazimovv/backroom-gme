export default function WrongLevel() {
  return (
    <div id="wrongLevel" aria-hidden="true">
      <div className="osd">SIGNAL LOST // COORDINATES INVALID</div>
      <h2>YOU SHOULDN'T<br />BE HERE</h2>
      <div className="osd" id="wrongCount">RETURNING TO LEVEL 0 IN 3</div>
    </div>
  );
}
