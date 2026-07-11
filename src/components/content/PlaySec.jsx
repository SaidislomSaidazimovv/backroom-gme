export default function PlaySec({ onEnter }) {
  return (
    <section id="playsec">
      <div className="eyebrow rv">FILE 06 — SIMULATION</div>
      <h2 className="rv d1">THINK YOU'D<br />FIND THE EXIT?</h2>
      <p className="lede rv d2">Somewhere on this floor there is exactly one working door. Something patrols
        the dark between you and it, and your flashlight runs on a battery from 1996. Follow the whine,
        keep the beam on whatever moves, and do not stop walking. If you want to try it yourself —
        <em>press play.</em></p>
      <button id="startGame" className="rv d3" onClick={onEnter}>► PLAY — ENTER THE MAZE</button>
      <div className="warn rv d3">WASD MOVE · MOUSE LOOK · SHIFT RUN · F TORCH · IF IT SCREAMS, RUN</div>
    </section>
  );
}
