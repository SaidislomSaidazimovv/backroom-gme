import * as THREE from "three";

/**
 * Procedural Level 0 surfaces, drawn once to offscreen canvases and wrapped as
 * repeating THREE.CanvasTextures. Ported verbatim from the original engine.
 */

// Build the tex(draw, w, h) helper, bound to a renderer for max anisotropy.
export function makeTex(renderer) {
  return function tex(draw, w=256, h=256){
  const c = document.createElement("canvas"); c.width=w; c.height=h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
};
}

// The six procedural maps: colour + bump for wall, carpet and drop-ceiling.
export function createWorldTextures(tex) {
  // classic backrooms wallpaper: wide two-tone bands, paper grain, aging, water damage
const wallTex = tex((g,w,h)=>{
  g.fillStyle="#b0a05f"; g.fillRect(0,0,w,h);
  const bw = 44;
  for(let x=0;x<w;x+=bw*2){ g.fillStyle="rgba(0,0,0,.075)"; g.fillRect(x,0,bw,h); }
  for(let x=0;x<w;x+=bw){ g.fillStyle="rgba(255,242,190,.06)"; g.fillRect(x,0,3,h); }
  for(let i=0;i<12000;i++){ g.fillStyle=`rgba(28,22,8,${Math.random()*0.1})`;
    g.fillRect(Math.random()*w, Math.random()*h, 1.5, 1.5); }
  let gr = g.createLinearGradient(0,0,0,h);
  gr.addColorStop(0,"rgba(38,30,10,.24)"); gr.addColorStop(.16,"rgba(38,30,10,0)");
  gr.addColorStop(.84,"rgba(26,20,7,0)");  gr.addColorStop(1,"rgba(26,20,7,.34)");
  g.fillStyle=gr; g.fillRect(0,0,w,h);
  for(let i=0;i<10;i++){ // dripping water stains
    const x=Math.random()*w, y0=Math.random()*h*.35, len=60+Math.random()*220;
    const dg=g.createLinearGradient(0,y0,0,y0+len);
    dg.addColorStop(0,"rgba(50,40,13,.3)"); dg.addColorStop(1,"rgba(50,40,13,0)");
    g.fillStyle=dg; g.fillRect(x,y0,4+Math.random()*9,len);
  }
  for(let i=0;i<5;i++){ // moisture blotches
    const x=Math.random()*w, y=h*.6+Math.random()*h*.4, r=30+Math.random()*70;
    const bg=g.createRadialGradient(x,y,3,x,y,r);
    bg.addColorStop(0,"rgba(44,34,10,.22)"); bg.addColorStop(1,"rgba(44,34,10,0)");
    g.fillStyle=bg; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  }
}, 512, 512);
const wallBump = tex((g,w,h)=>{
  g.fillStyle="#808080"; g.fillRect(0,0,w,h);
  const bw = 44;
  for(let x=0;x<w;x+=bw){ g.fillStyle="#6f6f6f"; g.fillRect(x,0,3,h); }
  for(let i=0;i<16000;i++){ const v=110+Math.random()*60|0;
    g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(Math.random()*w, Math.random()*h, 1.5, 1.5); }
}, 512, 512);
// worn office carpet: directional fibre strokes, traffic wear, damp patches
const carpetTex = tex((g,w,h)=>{
  g.fillStyle="#57492c"; g.fillRect(0,0,w,h);
  for(let i=0;i<26000;i++){
    const t2=Math.random();
    g.fillStyle=`rgba(${38+t2*70|0},${32+t2*58|0},${14+t2*30|0},.55)`;
    g.fillRect(Math.random()*w, Math.random()*h, 1, 2+Math.random()*3);
  }
  for(let i=0;i<8;i++){ // damp / worn patches
    const x=Math.random()*w, y=Math.random()*h, r=25+Math.random()*65;
    const gr2=g.createRadialGradient(x,y,3,x,y,r);
    gr2.addColorStop(0,"rgba(18,14,5,.42)"); gr2.addColorStop(1,"rgba(18,14,5,0)");
    g.fillStyle=gr2; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  }
}, 512, 512);
const carpetBump = tex((g,w,h)=>{
  g.fillStyle="#7a7a7a"; g.fillRect(0,0,w,h);
  for(let i=0;i<30000;i++){ const v=80+Math.random()*110|0;
    g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(Math.random()*w, Math.random()*h, 1, 2+Math.random()*2); }
}, 512, 512);
// drop ceiling: acoustic tiles with speckle holes, bevelled T-grid, stain rings
const ceilTex = tex((g,w,h)=>{
  g.fillStyle="#8d835c"; g.fillRect(0,0,w,h);
  for(let i=0;i<14000;i++){ g.fillStyle=`rgba(30,25,10,${.08+Math.random()*.16})`;
    const r=Math.random()<.85?1:2; g.fillRect(Math.random()*w, Math.random()*h, r, r); }
  for(let i=0;i<5;i++){ // brown stain rings from leaks
    const x=Math.random()*w, y=Math.random()*h, r=18+Math.random()*40;
    g.strokeStyle="rgba(96,66,22,.4)"; g.lineWidth=2+Math.random()*3;
    g.beginPath(); g.arc(x,y,r,0,7); g.stroke();
    const sg=g.createRadialGradient(x,y,2,x,y,r);
    sg.addColorStop(0,"rgba(96,66,22,.14)"); sg.addColorStop(1,"rgba(96,66,22,0)");
    g.fillStyle=sg; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  }
  for(let x=0;x<=w;x+=128){ g.fillStyle="rgba(28,22,9,.65)"; g.fillRect(x-2,0,4,h);
    g.fillStyle="rgba(220,205,150,.16)"; g.fillRect(x+2,0,1,h); }
  for(let y=0;y<=h;y+=128){ g.fillStyle="rgba(28,22,9,.65)"; g.fillRect(0,y-2,w,4);
    g.fillStyle="rgba(220,205,150,.16)"; g.fillRect(0,y+2,w,1); }
}, 512, 512);
const ceilBump = tex((g,w,h)=>{
  g.fillStyle="#8a8a8a"; g.fillRect(0,0,w,h);
  for(let i=0;i<16000;i++){ const v=60+Math.random()*90|0;
    g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(Math.random()*w, Math.random()*h, 1.5, 1.5); }
  for(let x=0;x<=w;x+=128){ g.fillStyle="#4a4a4a"; g.fillRect(x-2,0,4,h); }
  for(let y=0;y<=h;y+=128){ g.fillStyle="#4a4a4a"; g.fillRect(0,y-2,w,4); }
}, 512, 512);

  return { wallTex, wallBump, carpetTex, carpetBump, ceilTex, ceilBump };
}
