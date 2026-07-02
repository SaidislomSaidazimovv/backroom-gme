/**
 * VHS post-processing that lives in the DOM (not WebGL): the animated grey
 * noise canvas (#noise) and the occasional tracking-bar sweep (#track).
 * Returns a cleanup that stops both timers.
 */
export function startVhs({ reduceMotion }) {
  const nz = document.getElementById("noise"), ng = nz.getContext("2d");
  nz.width = 220; nz.height = 140;
  nz.style.width = "100vw"; nz.style.height = "100vh";
  const noiseIv = setInterval(() => {
    if (reduceMotion) return;
    const img = ng.createImageData(nz.width, nz.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    ng.putImageData(img, 0, 0);
  }, 66);

  const track = document.getElementById("track");
  const trackIv = setInterval(() => {
    if (reduceMotion || Math.random() > .3) return;
    track.style.transition = "none"; track.style.top = "-90px"; track.style.opacity = 1;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      track.style.transition = "top 1.6s linear, opacity .3s 1.4s";
      track.style.top = "100vh"; track.style.opacity = 0;
    }));
  }, 5000);

  return () => { clearInterval(noiseIv); clearInterval(trackIv); };
}
