/**
 * Non-simulation DOM behaviors: the loader PLAY gate, the custom crosshair
 * cursor, the scroll-reveal IntersectionObserver, and the word-by-word whisper
 * lighting. `onPlay` fires when the visitor presses PLAY (used to start the hum).
 * Returns a cleanup that removes listeners and disconnects the observer.
 */
export function startUi({ onPlay }) {
  // loader
  const loader = document.getElementById("loader");
  const playBtn = document.getElementById("playBtn");
  const onPlayClick = () => { loader.classList.add("done"); onPlay(); };
  playBtn.addEventListener("click", onPlayClick);

  // custom cursor
  const cur = document.getElementById("cursor");
  const onMove = (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; };
  addEventListener("pointermove", onMove);
  document.querySelectorAll("button,a,.tape").forEach((el) => {
    el.addEventListener("pointerenter", () => cur.classList.add("hover"));
    el.addEventListener("pointerleave", () => cur.classList.remove("hover"));
  });

  // scroll reveals
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .18 });
  document.querySelectorAll(".rv").forEach((el) => io.observe(el));

  // whisper text lights word-by-word on scroll
  const wh = document.getElementById("whisper");
  wh.innerHTML = wh.textContent.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ");
  const ws = [...wh.querySelectorAll(".w")];
  const onWhisper = () => {
    const r = wh.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.9)));
    const lit = Math.floor(p * ws.length * 1.4);
    ws.forEach((s, i) => s.classList.toggle("lit", i < lit));
  };
  addEventListener("scroll", onWhisper, { passive: true });

  return () => {
    playBtn.removeEventListener("click", onPlayClick);
    removeEventListener("pointermove", onMove);
    io.disconnect();
    removeEventListener("scroll", onWhisper);
  };
}
