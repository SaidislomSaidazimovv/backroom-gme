/**
 * On-screen-display chrome: the slowly draining top battery meter, the ticking
 * "SEP 23 1996" VHS clock, and the scroll-driven tape position counter.
 * Returns a cleanup that stops the timers and removes the scroll listener.
 */
export function startOsd() {
  const clock = document.getElementById("clock");
  const battery = document.getElementById("battery");
  let bat = 87;
  const batIv = setInterval(() => {
    bat = Math.max(9, bat - 1);
    const seg = "▮".repeat(Math.ceil(bat / 25)) + "▯".repeat(4 - Math.ceil(bat / 25));
    battery.textContent = `BAT ${seg} ${bat}%`;
    battery.style.color = bat < 25 ? "var(--blood)" : "";
  }, 45000);

  const tapePos = document.getElementById("tapePos");
  let secs = 0, frames = 0;
  const clockIv = setInterval(() => {
    frames++; if (frames >= 30) { frames = 0; secs++; }
    const s = 47 * 60 + secs, mm = String(Math.floor(s / 60) % 60).padStart(2, "0"), ss = String(s % 60).padStart(2, "0");
    clock.textContent = `SEP 23 1996   PM 11:${mm}:${ss}`;
  }, 33);

  const onScroll = () => {
    const p = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
    const tot = p * 3600 | 0;
    tapePos.textContent = `SP ${Math.floor(tot / 3600)}:${String(Math.floor(tot / 60) % 60).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
  };
  addEventListener("scroll", onScroll, { passive: true });

  return () => { clearInterval(batIv); clearInterval(clockIv); removeEventListener("scroll", onScroll); };
}
