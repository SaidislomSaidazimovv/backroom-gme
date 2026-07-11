import * as THREE from "three";

/**
 * Canonical Level 0 surfaces, drawn once to offscreen canvases and wrapped as
 * repeating THREE.CanvasTextures:
 *
 *  - wallpaper: mono-yellow with a low-contrast damask/floral motif, vertical
 *    paper seams, water damage and mould near the skirting
 *  - carpet:    worn, damp brown commercial office carpet
 *  - ceiling:   off-white acoustic drop-ceiling tiles in a T-bar grid
 */

// Build the tex(draw, w, h) helper, bound to a renderer for max anisotropy.
export function makeTex(renderer) {
  return function tex(draw, w = 256, h = 256) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
}

// one damask motif — a stylised four-petal flower inside a diamond frame
function damask(g, x, y, r, col) {
  g.save(); g.translate(x, y);
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(1, r * 0.1);
  for (let k = 0; k < 4; k++) {
    g.rotate(Math.PI / 2);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(r * 0.55, -r * 0.28, 0, -r * 0.85);
    g.quadraticCurveTo(-r * 0.55, -r * 0.28, 0, 0);
    g.fill();
  }
  g.beginPath(); g.arc(0, 0, r * 0.16, 0, 7); g.fill();
  g.beginPath();
  g.moveTo(0, -r * 1.25); g.lineTo(r * 1.25, 0); g.lineTo(0, r * 1.25); g.lineTo(-r * 1.25, 0);
  g.closePath(); g.stroke();
  g.restore();
}

export function createWorldTextures(tex) {
  /* ---------------- yellow damask wallpaper ---------------- */
  const wallTex = tex((g, w, h) => {
    g.fillStyle = "#bfa951"; g.fillRect(0, 0, w, h);            // the mono-yellow

    const step = w / 4;                                          // staggered damask grid
    for (let row = -1; row <= 4; row++) {
      for (let col = -1; col <= 4; col++) {
        const x = col * step + (row % 2 ? step / 2 : 0), y = row * step;
        damask(g, x, y, step * 0.34, "rgba(139,116,44,0.80)");
        damask(g, x + step / 2, y + step / 2, step * 0.13, "rgba(222,206,142,0.55)");
      }
    }

    for (let x = 0; x <= w; x += w / 2) {                        // wallpaper strip seams
      g.fillStyle = "rgba(90,78,40,.16)"; g.fillRect(x - 1, 0, 2, h);
      g.fillStyle = "rgba(228,214,156,.10)"; g.fillRect(x + 1, 0, 1, h);
    }

    for (let i = 0; i < 14000; i++) {                            // paper grain
      g.fillStyle = `rgba(72,62,28,${Math.random() * 0.09})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }

    const gr = g.createLinearGradient(0, 0, 0, h);               // grime top and bottom
    gr.addColorStop(0, "rgba(46,38,14,.26)"); gr.addColorStop(.18, "rgba(46,38,14,0)");
    gr.addColorStop(.80, "rgba(34,28,10,0)"); gr.addColorStop(1, "rgba(34,28,10,.38)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);

    for (let i = 0; i < 9; i++) {                                // water running down the paper
      const x = Math.random() * w, y0 = Math.random() * h * .3, len = 70 + Math.random() * 240;
      const dg = g.createLinearGradient(0, y0, 0, y0 + len);
      dg.addColorStop(0, "rgba(96,78,30,.30)"); dg.addColorStop(1, "rgba(96,78,30,0)");
      g.fillStyle = dg; g.fillRect(x, y0, 5 + Math.random() * 11, len);
    }
    for (let i = 0; i < 6; i++) {                                // mould blooms low down
      const x = Math.random() * w, y = h * .66 + Math.random() * h * .34, r = 26 + Math.random() * 62;
      const bg = g.createRadialGradient(x, y, 2, x, y, r);
      bg.addColorStop(0, "rgba(58,58,34,.30)"); bg.addColorStop(1, "rgba(58,58,34,0)");
      g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }, 512, 512);

  const wallBump = tex((g, w, h) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
    const step = w / 4;
    for (let row = -1; row <= 4; row++)
      for (let col = -1; col <= 4; col++)
        damask(g, col * step + (row % 2 ? step / 2 : 0), row * step, step * 0.34, "rgba(150,150,150,0.7)");
    for (let x = 0; x <= w; x += w / 2) { g.fillStyle = "#6b6b6b"; g.fillRect(x - 1, 0, 2, h); }
    for (let i = 0; i < 16000; i++) {
      const v = 112 + Math.random() * 56 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  }, 512, 512);

  /* ---------------- worn, damp office carpet ---------------- */
  const carpetTex = tex((g, w, h) => {
    g.fillStyle = "#6a5836"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30000; i++) {
      const t2 = Math.random();
      g.fillStyle = `rgba(${52 + t2 * 78 | 0},${43 + t2 * 64 | 0},${22 + t2 * 38 | 0},.55)`;
      g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3);
    }
    for (let i = 0; i < 10; i++) {                               // damp / traffic-worn patches
      const x = Math.random() * w, y = Math.random() * h, r = 28 + Math.random() * 70;
      const gr2 = g.createRadialGradient(x, y, 3, x, y, r);
      gr2.addColorStop(0, "rgba(24,19,8,.42)"); gr2.addColorStop(1, "rgba(24,19,8,0)");
      g.fillStyle = gr2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }, 512, 512);

  const carpetBump = tex((g, w, h) => {
    g.fillStyle = "#7a7a7a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 32000; i++) {
      const v = 84 + Math.random() * 106 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 2);
    }
  }, 512, 512);

  /* ---------------- acoustic drop-ceiling tiles ---------------- */
  const ceilTex = tex((g, w, h) => {
    g.fillStyle = "#c4bfae"; g.fillRect(0, 0, w, h);             // mineral-fibre panel
    for (let i = 0; i < 22000; i++) {                            // speckled perforations
      g.fillStyle = `rgba(120,114,96,${.1 + Math.random() * .2})`;
      const r = Math.random() < .85 ? 1 : 2;
      g.fillRect(Math.random() * w, Math.random() * h, r, r);
    }
    for (let i = 0; i < 4; i++) {                                // brown leak stains
      const x = Math.random() * w, y = Math.random() * h, r = 16 + Math.random() * 40;
      g.strokeStyle = "rgba(120,86,34,.35)"; g.lineWidth = 2 + Math.random() * 3;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
      const sg = g.createRadialGradient(x, y, 2, x, y, r);
      sg.addColorStop(0, "rgba(120,86,34,.16)"); sg.addColorStop(1, "rgba(120,86,34,0)");
      g.fillStyle = sg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    for (let x = 0; x <= w; x += w / 2) {                        // T-bar grid
      g.fillStyle = "rgba(150,146,134,1)"; g.fillRect(x - 2, 0, 4, h);
      g.fillStyle = "rgba(90,86,76,.55)"; g.fillRect(x + 2, 0, 1, h);
    }
    for (let y = 0; y <= h; y += h / 2) {
      g.fillStyle = "rgba(150,146,134,1)"; g.fillRect(0, y - 2, w, 4);
      g.fillStyle = "rgba(90,86,76,.55)"; g.fillRect(0, y + 2, w, 1);
    }
  }, 512, 512);

  const ceilBump = tex((g, w, h) => {
    g.fillStyle = "#8a8a8a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 20000; i++) {
      const v = 62 + Math.random() * 88 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
    }
    for (let x = 0; x <= w; x += w / 2) { g.fillStyle = "#d0d0d0"; g.fillRect(x - 2, 0, 4, h); }
    for (let y = 0; y <= h; y += h / 2) { g.fillStyle = "#d0d0d0"; g.fillRect(0, y - 2, w, 4); }
  }, 512, 512);

  return { wallTex, wallBump, carpetTex, carpetBump, ceilTex, ceilBump };
}
