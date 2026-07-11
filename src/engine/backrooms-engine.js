import * as THREE from "three";
import { startVhs } from "./vhs.js";
import { startOsd } from "./osd.js";
import { startUi } from "./ui.js";
import { makeTex, createWorldTextures } from "./textures.js";
import { createAudio } from "./audio.js";
import { settings, SKINS, DIFFICULTIES, QUALITY } from "./settings.js";
import { createViewmodel, createSmiler, loadEntityRig } from "./models.js";

/**
 * THE BACKROOMS engine — ported verbatim from the original single-file
 * backrooms.html <script> IIFE. Behavior is unchanged; only the module
 * wrapper, the npm three import, and a start guard + cleanup were added.
 *
 * Relies on the DOM ids/classes rendered by the React components
 * (Loader, Chrome, VhsOverlays, Cursor, GameHud, GameEnd, WrongLevel, content/*).
 * Call once after those elements are in the DOM.
 */

let started = false;

export function initBackrooms() {
  if (started) return () => {};
  started = true;

  // --- teardown registry (added for React lifecycle safety) ---
  // Global event listeners are left verbatim: App is the root and never
  // unmounts, StrictMode is off, and the original page also kept them for its
  // whole lifetime. Only the render loop + persistent timers are registered so
  // a (rare) cleanup can stop them.
  const __intervals = [];
  const __cleanups = [];
  let __rafId = 0;
  const __setInterval = (fn, ms) => { const id = setInterval(fn, ms); __intervals.push(id); return id; };

"use strict";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const audio = createAudio();

/* ================= THREE — LEVEL 0 / FLASHLIGHT WALKER ================= */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:"high-performance"});
const COARSE = matchMedia("(pointer: coarse)").matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, COARSE ? 1.1 : 1.5));
renderer.shadowMap.enabled = !COARSE;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050402, 0.088);
scene.background = new THREE.Color(0x030302);
const camera = new THREE.PerspectiveCamera(74, 1, 0.1, 100);
camera.rotation.order = "YXZ";
camera.position.set(0, 1.62, 0);

/* --- procedural textures --- */
const tex = makeTex(renderer);
const { wallTex, wallBump, carpetTex, carpetBump, ceilTex, ceilBump } = createWorldTextures(tex);

const S = 7, RANGE = 5, H = 3.1;
const world = new THREE.Group(); scene.add(world);

/* --- lighting: near-darkness + handheld flashlight --- */
scene.add(new THREE.HemisphereLight(0x201a0c, 0x040302, 0.22));
const torch = new THREE.SpotLight(0xffe2ae, 0, 26, 0.47, 0.45, 1.35);
torch.castShadow = !COARSE;
torch.shadow.mapSize.set(1024, 1024);
torch.shadow.camera.near = 0.4;
torch.shadow.camera.far = 26;
torch.shadow.bias = -0.0006;
const torchTarget = new THREE.Object3D();
scene.add(torch, torchTarget);
torch.target = torchTarget;
const fill = new THREE.PointLight(0xffdba0, 0.16, 5.5, 1.6); // faint spill around the hand
scene.add(fill);

/* --- first-person arm + flashlight viewmodel (what "you" are holding) --- */
scene.add(camera); // parent the viewmodel to the camera so it renders in-view
const vm = createViewmodel(tex);
const viewmodel = vm.group, vmLens = vm.lens, vmLight = vm.light;
camera.add(viewmodel);

/* --- geometry --- */
carpetTex.repeat.set(24,24); carpetBump.repeat.set(24,24);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(120,120),
  new THREE.MeshPhongMaterial({map:carpetTex, bumpMap:carpetBump, bumpScale:0.02,
    shininess:5, specular:0x191408}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
ceilTex.repeat.set(24,24); ceilBump.repeat.set(24,24);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(120,120),
  new THREE.MeshPhongMaterial({map:ceilTex, bumpMap:ceilBump, bumpScale:0.015,
    shininess:8, specular:0x1e1a0e}));
ceil.rotation.x = Math.PI/2; ceil.position.y = H; ceil.receiveShadow = true; scene.add(ceil);

wallTex.repeat.set(1.6,1.6); wallBump.repeat.set(1.6,1.6);
const pillarGeo = new THREE.BoxGeometry(1.7, H, 1.7);
const pillarMat = new THREE.MeshPhongMaterial({map:wallTex, bumpMap:wallBump, bumpScale:0.012,
  shininess:4, specular:0x141008});
const baseMat = new THREE.MeshPhongMaterial({color:0x2a2113, shininess:14, specular:0x2a2416});
const baseGeo = new THREE.BoxGeometry(1.78, 0.15, 1.78);
function cellHash(i,j){ const s = Math.sin(i*127.1 + j*311.7)*43758.5453; return s - Math.floor(s); }
const pillars = [];
for(let i=-RANGE;i<=RANGE;i++) for(let j=-RANGE;j<=RANGE;j++){
  const m = new THREE.Mesh(pillarGeo, pillarMat);
  m.userData = {i,j}; m.position.y = H/2;
  m.castShadow = m.receiveShadow = !COARSE;
  const bb = new THREE.Mesh(baseGeo, baseMat); // skirting board
  bb.position.y = -H/2 + 0.075; m.add(bb);
  world.add(m); pillars.push(m);
}
// fluorescent fixtures — dark housings; most tubes are dead, survivors buzz dimly
const lightGeo = new THREE.PlaneGeometry(1.42, 0.52);
const frameGeo = new THREE.BoxGeometry(1.58, 0.08, 0.68);
const frameMat = new THREE.MeshPhongMaterial({color:0x1c160b, shininess:20, specular:0x2b2515});
const lights = [];
for(let i=-RANGE;i<=RANGE;i++) for(let j=-RANGE;j<=RANGE;j++){
  const g2 = new THREE.Group(); g2.position.y = H - 0.045;
  const fr = new THREE.Mesh(frameGeo, frameMat); g2.add(fr);
  const mat = new THREE.MeshBasicMaterial({color:0x000000});
  const p = new THREE.Mesh(lightGeo, mat);
  p.rotation.x = Math.PI/2; p.position.y = -0.05; g2.add(p);
  world.add(g2);
  lights.push({g:g2, mat, userData:{i, j, phase:Math.random()*10}});
}

// dust motes drifting through the beam
const dustN = 260, dustPos = new Float32Array(dustN*3), dustVel = [];
for(let i=0;i<dustN;i++){
  dustPos[i*3]   = (Math.random()-.5)*12;
  dustPos[i*3+1] = Math.random()*H;
  dustPos[i*3+2] = (Math.random()-.5)*12;
  dustVel.push({x:(Math.random()-.5)*.06, y:-.01-Math.random()*.03, z:(Math.random()-.5)*.06});
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos,3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color:0xffe9c2, size:0.028, transparent:true, opacity:0.4,
  depthWrite:false, blending:THREE.AdditiveBlending}));
scene.add(dust);

/* --- world placement (2D periodic wrap → free roaming) --- */
let px = 3.5, pz = 3.5; // start in an open cell corner
function pillarExists(gi,gj){ return cellHash(gi,gj) >= 0.28; }
function placeWorld(){
  const ci = Math.round(px/S), cj = Math.round(pz/S);
  for(const p of pillars){
    const gi = p.userData.i + ci, gj = p.userData.j + cj;
    p.visible = pillarExists(gi,gj);
    if(!p.visible) continue;
    const w = 1.2 + cellHash(gi+11,gj+7)*2.6;
    const d = 1.2 + cellHash(gi+5,gj+13)*2.6;
    p.scale.set(w/1.7, 1, d/1.7);
    p.position.x = gi*S + (cellHash(gi+2,gj+9)-0.5)*2.2 - px;
    p.position.z = gj*S + (cellHash(gi+8,gj+3)-0.5)*2.2 - pz;
  }
  for(const l of lights){
    const gi = l.userData.i + ci, gj = l.userData.j + cj;
    l.g.position.x = gi*S + S/2 - px;
    l.g.position.z = gj*S + S/2 - pz;
    l.userData.alive = cellHash(gi*3+7, gj*5+1) < 0.16; // few survivors
    l.userData.gi = gi; l.userData.gj = gj;
  }
  // floor/ceiling jump in whole-tile steps so the pattern stays world-fixed
  const tile = 120/24;
  floor.position.x = ceil.position.x = Math.round(px/tile)*tile - px;
  floor.position.z = ceil.position.z = Math.round(pz/tile)*tile - pz;
}
// approximate pillar footprint test for steering
function blockedAt(wx, wz){
  const gi = Math.round(wx/S), gj = Math.round(wz/S);
  if(!pillarExists(gi,gj)) return false;
  const cx = gi*S + (cellHash(gi+2,gj+9)-0.5)*2.2;
  const cz = gj*S + (cellHash(gi+8,gj+3)-0.5)*2.2;
  const hw = (1.2 + cellHash(gi+11,gj+7)*2.6)/2 + 0.55;
  const hd = (1.2 + cellHash(gi+5,gj+13)*2.6)/2 + 0.55;
  return Math.abs(wx-cx) < hw && Math.abs(wz-cz) < hd;
}

/* --- the walker: someone searching for a way out --- */
let heading = 0, headTarget = 0, sweep = 0, sweepDir = 1;
let mode = "walk", modeT = 6, modeDur = 6;
let speed = 0, speedT = 1.0, stepPhase = 0, lastStep = 0, gaitBob = 0;
let mx=0, my=0, yawM=0, pitchM=0;
addEventListener("pointermove", e=>{
  mx = (e.clientX/innerWidth - .5)*2;
  my = (e.clientY/innerHeight - .5)*2;
});
let scrollV = 0;
addEventListener("scroll", ()=>{ scrollV = scrollY; }, {passive:true});

/* --- flashlight state --- */
let torchOn = true, torchI = 0, torchFlick = 0;
let lagYaw = 0, lagPitch = 0;
const torchBtn = document.getElementById("torchBtn");
function setTorch(on){
  torchOn = on;
  torchBtn.textContent = "TORCH: " + (on?"ON":"OFF");
  torchBtn.setAttribute("aria-pressed", on);
}
torchBtn.addEventListener("click", ()=> setTorch(!torchOn));
addEventListener("keydown", e=>{ if(e.key==="f"||e.key==="F") setTorch(!torchOn); });

/* --- ambient fluorescent behaviour --- */
const flickEl = document.getElementById("flick");
function fluorescents(t){
  for(const l of lights){
    const d = l.userData;
    let b;
    if(!d.alive){ b = 0.015; }
    else {
      b = 0.16 + Math.sin(t*23 + d.phase)*0.05;               // sick dim buzz
      const surge = cellHash(d.gi + (t*0.11|0), d.gj);          // rare far surge
      if(surge > 0.985) b = 0.75;
      if(!reduceMotion && Math.random() < 0.002) b *= 0.1;      // stutter
    }
    l.mat.color.setRGB(b, b*0.94, b*0.72);
  }
}

/* --- noclip fall --- */
let falling = 0;
const veil = document.getElementById("glitchveil");
const wrong = document.getElementById("wrongLevel");
const wrongCount = document.getElementById("wrongCount");
document.getElementById("noclipBtn").addEventListener("click", ()=>{
  if(falling) return;
  falling = 1; document.body.classList.add("falling");
  veil.classList.remove("on"); void veil.offsetWidth; veil.classList.add("on");
  audio.playGlitchSfx();
  setTimeout(()=>{ wrong.classList.add("on");
    let n = 3;
    const iv = __setInterval(()=>{ n--; wrongCount.textContent = "RETURNING TO LEVEL 0 IN " + n;
      if(n<=0){ clearInterval(iv); wrong.classList.remove("on");
        camera.position.y = 1.62; camera.rotation.z = 0; falling = 0;
        document.body.classList.remove("falling");
        wrongCount.textContent = "RETURNING TO LEVEL 0 IN 3";
      }}, 900);
  }, 2100);
});

function resize(){
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

/* --- main loop --- */
let last = performance.now();
function loop(now){
  __rafId = requestAnimationFrame(loop);
  const dt = Math.min((now-last)/1000, .05); last = now;
  const t = now/1000;

  if(gameMode){
    if(!paused) updateGame(dt, t);
  } else {
    /* decide what the walker does */
  if(!reduceMotion){
    modeT -= dt;
    if(modeT <= 0){
      if(mode === "walk"){
        mode = "pause"; modeDur = modeT = 1.9 + Math.random()*2.4;
        speedT = 0; sweepDir = Math.random()<.5 ? -1 : 1;
      } else {
        mode = "walk"; modeDur = modeT = 6 + Math.random()*9;
        speedT = 0.95 + Math.random()*0.35 + Math.min(scrollV/4000, .5);
        const turns = [0, 0, 0, Math.PI/2, -Math.PI/2, Math.PI/4, -Math.PI/4];
        headTarget += turns[Math.random()*turns.length|0];
      }
    }
    // scan left-right while paused, like checking corridors for an exit
    if(mode === "pause"){
      const pp = 1 - modeT/modeDur;
      sweep += (Math.sin(pp*Math.PI*2)*0.7*sweepDir - sweep)*Math.min(1, dt*4);
    } else {
      sweep += (0 - sweep)*Math.min(1, dt*3);
    }
    // steer around pillars ahead
    const probe = 2.0;
    const fx = px - Math.sin(heading)*probe, fz = pz - Math.cos(heading)*probe;
    if(blockedAt(fx,fz)){
      const lx = px - Math.sin(heading-0.7)*probe, lz = pz - Math.cos(heading-0.7)*probe;
      headTarget += blockedAt(lx,lz) ? 1.6*dt*3 : -1.6*dt*3;
    }
  }
  speed += (speedT - speed)*Math.min(1, dt*2.0);
  heading += (headTarget - heading)*Math.min(1, dt*1.5);

  /* advance through the maze */
  px += -Math.sin(heading)*speed*dt;
  pz += -Math.cos(heading)*speed*dt;

  /* gait: footsteps, bob, breath */
  stepPhase += speed*dt*0.92;
  const stride = Math.floor(stepPhase*2);
  if(stride !== lastStep && speed > 0.3){ lastStep = stride; audio.stepSfx(); }
  const bob = Math.sin(stepPhase*Math.PI*2)*0.05*Math.min(speed,1);
  const breath = Math.sin(t*1.35)*0.013;
  const roll = Math.sin(stepPhase*Math.PI)*0.010*Math.min(speed,1);

  yawM   += ((-mx*0.42) - yawM)*0.045;
  pitchM += ((-my*0.22) - pitchM)*0.045;

  if(falling){
    camera.position.y -= dt*3.2;
    camera.rotation.z += dt*0.5;
    if(camera.position.y < -20) camera.position.y = -20;
  } else {
    camera.rotation.y = heading + sweep + yawM;
    camera.rotation.x = pitchM + Math.cos(stepPhase*Math.PI*2)*0.006*speed;
    camera.rotation.z = roll;
    camera.position.y = 1.62 + bob + breath;
  }

  }

  /* flashlight: lags behind the look direction, sways with the hand */
  const lookYaw = camera.rotation.y, lookPitch = camera.rotation.x;
  lagYaw   += (lookYaw - lagYaw)*Math.min(1, dt*5.5);
  lagPitch += (lookPitch - lagPitch)*Math.min(1, dt*5.5);
  const swayX = Math.sin(t*1.25)*0.045 + Math.sin(stepPhase*Math.PI*2)*0.05*speed;
  const swayY = Math.cos(t*0.9)*0.035 + Math.abs(Math.sin(stepPhase*Math.PI))*0.04*speed;
  const hy = falling ? camera.position.y - 0.15 : 1.42 + gaitBob*0.6;
  torch.position.set(Math.cos(lookYaw)*0.24, hy, -Math.sin(lookYaw)*0.24);
  const R = 9;
  torchTarget.position.set(
    -Math.sin(lagYaw + swayX)*R*Math.cos(lagPitch),
    hy + Math.sin(lagPitch + swayY*0.4)*R,
    -Math.cos(lagYaw + swayX)*R*Math.cos(lagPitch));
  fill.position.copy(torch.position);

  // torch intensity: ease on/off + battery stutter
  if(!reduceMotion && torchOn && torchFlick <= 0 && Math.random() < 0.0035) torchFlick = 0.25 + Math.random()*0.35;
  let ti = torchOn ? 3.2 : 0;
  if(torchFlick > 0){ torchFlick -= dt; ti *= (Math.random() < .5 ? 0.15 : 0.75); }
  torchI += (ti - torchI)*Math.min(1, dt*(torchFlick>0 ? 30 : 6));
  torch.intensity = torchI;
  fill.intensity = 0.05 + torchI*0.075;
  flickEl.style.opacity = torchFlick > 0 ? 0.02 : 0;

  /* first-person viewmodel: only in-game, bobs with the gait + breath */
  viewmodel.visible = gameMode;
  if(gameMode){
    const runv = (keys["ShiftLeft"]||keys["ShiftRight"]) ? 1 : 0;
    const amp = (0.014 + runv*0.02) * Math.min(1, speed);
    const sp = stepPhase;
    viewmodel.position.x = 0.33 + Math.sin(sp*Math.PI*2)*amp*0.6 + Math.sin(t*1.3)*0.004;
    viewmodel.position.y = -0.30 - Math.abs(Math.sin(sp*Math.PI))*amp + Math.sin(t*1.6)*0.004 - breath*0.02;
    viewmodel.position.z = -0.5 + Math.sin(sp*Math.PI*2)*amp*0.3;
    viewmodel.rotation.z = 0.05 + Math.sin(sp*Math.PI*2)*0.03*(0.5+runv);
    viewmodel.rotation.x = 0.05 + Math.sin(sp*Math.PI)*0.02*Math.min(1, speed);
  }

  /* dust drifts and wraps around the player */
  if(!reduceMotion){
    const dp = dust.geometry.attributes.position.array;
    for(let i=0;i<dustN;i++){
      dp[i*3]   += dustVel[i].x*dt + Math.sin(t+i)*0.0015;
      dp[i*3+1] += dustVel[i].y*dt;
      dp[i*3+2] += dustVel[i].z*dt + speed*dt*Math.sin(heading); // relative drift
      if(dp[i*3+1] < 0) dp[i*3+1] = H;
      if(dp[i*3]   >  6) dp[i*3]   = -6; if(dp[i*3]   < -6) dp[i*3]   = 6;
      if(dp[i*3+2] >  6) dp[i*3+2] = -6; if(dp[i*3+2] < -6) dp[i*3+2] = 6;
    }
    dust.geometry.attributes.position.needsUpdate = true;
  }

  placeWorld();
  fluorescents(t);
  renderer.render(scene, camera);
}
__rafId = requestAnimationFrame(loop);

/* ================= GAME — PLAYABLE LEVEL 0 ================= */
let gameMode = false, gYaw = 0, gPitch = 0, gBattery = 100, gStart = 0;
let breath = 0, breathPhase = 0;
let stamina = 100, exhausted = false, fear = 0, heartPhase = 0;
let calm = 0, scareT = 8, paused = false, runBats = 0, runAlmonds = 0, entWalk = 0;
const keys = {};
let exitW = {x:0, z:0}, entW = {x:0, z:0}, bats = [];
const isTouch = matchMedia("(pointer:coarse)").matches;
const gameHud = document.getElementById("gameHud");
const gTime = document.getElementById("gTime");
const gBatFill = document.getElementById("gBatFill");
const gStaFill = document.getElementById("gStaFill");
const gSanFill = document.getElementById("gSanFill");
const fearVig = document.getElementById("fearVig");
const gHint = document.getElementById("gHint");
const gameEnd = document.getElementById("gameEnd");
const gEndTitle = document.getElementById("gEndTitle");
const gEndSub = document.getElementById("gEndSub");
const noiseEl = document.getElementById("noise");

function normA(a){ return ((a + Math.PI) % (Math.PI*2) + Math.PI*2) % (Math.PI*2) - Math.PI; }
function openCellNear(wx, wz){
  const gi0 = Math.round(wx/S), gj0 = Math.round(wz/S);
  for(let r=0; r<9; r++){
    const steps = Math.max(1, r*8);
    for(let a=0; a<steps; a++){
      const th = a/steps * Math.PI*2;
      const gi = gi0 + Math.round(Math.cos(th)*r), gj = gj0 + Math.round(Math.sin(th)*r);
      if(!pillarExists(gi, gj)) return {x: gi*S, z: gj*S};
    }
  }
  return {x: gi0*S, z: gj0*S};
}

/* --- exit door --- */
const exitG = new THREE.Group();
const jambMat = new THREE.MeshLambertMaterial({color:0x2b2417});
[[-0.62],[0.62]].forEach(([x])=>{
  const j = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.2), jambMat);
  j.position.set(x, 1.2, 0); exitG.add(j);
});
const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.2, 0.2), jambMat);
lintel.position.set(0, 2.4, 0); exitG.add(lintel);
const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 2.3),
  new THREE.MeshBasicMaterial({color:0xd9ffe9, side:THREE.DoubleSide}));
doorGlow.position.set(0, 1.15, 0); exitG.add(doorGlow);
const signTex = tex((g,w,h)=>{
  g.fillStyle="#062d16"; g.fillRect(0,0,w,h);
  g.fillStyle="#7dffb0"; g.font="bold 34px monospace"; g.textAlign="center"; g.textBaseline="middle";
  g.fillText("EXIT", w/2, h/2+2);
}, 128, 48);
const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3),
  new THREE.MeshBasicMaterial({map:signTex, side:THREE.DoubleSide}));
sign.position.set(0, 2.62, 0); exitG.add(sign);
const exitLight = new THREE.PointLight(0xaef7c9, 1.0, 11, 1.5);
exitLight.position.set(0, 1.6, 0.5); exitG.add(exitLight);
exitG.traverse(o=>{ if(o.isMesh && o.material === jambMat) o.castShadow = true; });
exitG.visible = false; scene.add(exitG);

/* --- the entity: a walking "Smiler" (organic model + gait, see models.js) --- */
const smiler = createSmiler(tex);
const entG = smiler.group;
const entGrinMat = smiler.grinMat, entEyeMat = smiler.eyeMat;
scene.add(entG);

/* Upgrade the entity to the real rigged human once /models/entity.glb loads.
   The procedural body above is the fallback if it never does. */
let entMixer = null, entActions = null, entHeadBone = null, entRigged = false;
const _headPos = new THREE.Vector3();
loadEntityRig("/models/entity.glb", smiler.flesh).then((rig) => {
  if (!rig) return;
  entG.traverse(o => { if (o.isMesh && !o.userData.glow) o.visible = false; });  // retire the placeholder
  rig.root.rotation.y = Math.PI;               // the rig walks down -z; entG's +z faces the player
  entG.add(rig.root);
  entG.add(smiler.face);                       // re-parent the glow off the procedural head
  smiler.face.scale.setScalar(0.85);
  entMixer = rig.mixer; entActions = rig.actions; entHeadBone = rig.headBone; entRigged = true;
});
function fadeAction(a, want, dt){
  if(!a) return;
  const w = a.getEffectiveWeight();
  a.setEffectiveWeight(w + (want - w) * Math.min(1, dt * 6));
}

/* --- battery pickups --- */
const batMat = new THREE.MeshBasicMaterial({color:0x38c874});
for(let i=0;i<6;i++){
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.13), batMat);
  m.visible = false; scene.add(m);
  bats.push({m, x:0, z:0, taken:true});
}

/* --- almond water pickups (calm your nerve) --- */
const almondMat = new THREE.MeshBasicMaterial({ color: 0xf3efce });
const almonds = [];
for(let i=0;i<4;i++){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 8), almondMat);
  m.visible = false; scene.add(m);
  almonds.push({ m, x:0, z:0, taken:true });
}

/* --- input --- */
addEventListener("keydown", e=>{
  keys[e.code] = true;
  if(gameMode && ["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
});
addEventListener("keyup", e=>{ keys[e.code] = false; });
let plActive = false, dragLook = null;
function tryPointerLock(){
  if(isTouch || plActive) return;
  try{
    const r = canvas.requestPointerLock();
    if(r && r.catch) r.catch(()=>{});
  }catch(err){ /* sandboxed context: drag-look takes over */ }
}
document.addEventListener("pointerlockchange", ()=>{
  plActive = document.pointerLockElement === canvas;
  if(gameMode && !plActive && !paused) setPausedState(true);   // Esc released the lock → pause
});
document.addEventListener("pointerlockerror", ()=>{ plActive = false; });
addEventListener("mousemove", e=>{
  if(!gameMode) return;
  const st = settings.get(); const iy = st.invertY ? -1 : 1;
  if(plActive){
    gYaw -= e.movementX * 0.0022 * st.sens;
    gPitch = Math.max(-1.25, Math.min(1.25, gPitch - e.movementY * 0.002 * st.sens * iy));
  } else if(dragLook){
    gYaw -= (e.clientX - dragLook.x) * 0.0036 * st.sens;
    gPitch = Math.max(-1.25, Math.min(1.25, gPitch - (e.clientY - dragLook.y) * 0.003 * st.sens * iy));
    dragLook = {x: e.clientX, y: e.clientY};
  }
});
addEventListener("mousedown", e=>{
  if(!gameMode || e.button !== 0) return;
  if(e.target && e.target.closest && e.target.closest("button")) return;
  dragLook = {x: e.clientX, y: e.clientY};
  tryPointerLock(); // retry lock on each click; drag keeps working meanwhile
});
addEventListener("mouseup", ()=>{ dragLook = null; });
addEventListener("keydown", e=>{
  if(gameMode && e.code === "Escape" && !plActive && !document.pointerLockElement) setPausedState(!paused);
});
/* touch: left half = move stick, right half = look */
let tMove = null, tLook = null;
addEventListener("touchstart", e=>{
  if(!gameMode) return;
  if(e.target && e.target.closest && e.target.closest("button")) return;
  for(const t of e.changedTouches){
    if(t.clientX < innerWidth/2 && !tMove) tMove = {id:t.identifier, x0:t.clientX, y0:t.clientY, dx:0, dy:0};
    else if(!tLook) tLook = {id:t.identifier, px:t.clientX, py:t.clientY};
  }
}, {passive:true});
addEventListener("touchmove", e=>{
  if(!gameMode) return;
  for(const t of e.changedTouches){
    if(tMove && t.identifier === tMove.id){
      tMove.dx = Math.max(-1, Math.min(1, (t.clientX - tMove.x0)/45));
      tMove.dy = Math.max(-1, Math.min(1, (t.clientY - tMove.y0)/45));
    } else if(tLook && t.identifier === tLook.id){
      const st = settings.get(); const iy = st.invertY ? -1 : 1;
      gYaw -= (t.clientX - tLook.px) * 0.005 * st.sens;
      gPitch = Math.max(-1.25, Math.min(1.25, gPitch - (t.clientY - tLook.py) * 0.004 * st.sens * iy));
      tLook.px = t.clientX; tLook.py = t.clientY;
    }
  }
}, {passive:true});
addEventListener("touchend", e=>{
  for(const t of e.changedTouches){
    if(tMove && t.identifier === tMove.id) tMove = null;
    if(tLook && t.identifier === tLook.id) tLook = null;
  }
});

/* --- lifecycle --- */
function startGame(){
  const pc = openCellNear(px, pz); px = pc.x; pz = pc.z;
  gYaw = heading; gPitch = 0; gBattery = 100; gStart = performance.now();
  const exA = Math.random()*Math.PI*2, exD = 66 + Math.random()*20;
  const ec = openCellNear(px - Math.sin(exA)*exD, pz - Math.cos(exA)*exD);
  exitW = ec; exitG.rotation.y = Math.round(Math.random()*4) * Math.PI/2;
  const enA = exA + Math.PI + (Math.random()-.5);
  const en = openCellNear(px - Math.sin(enA)*36, pz - Math.cos(enA)*36);
  entW = {x:en.x, z:en.z};
  for(const b of bats){
    const a = Math.random()*Math.PI*2, d = 12 + Math.random()*44;
    const c = openCellNear(px - Math.sin(a)*d, pz - Math.cos(a)*d);
    b.x = c.x + (Math.random()-.5)*2; b.z = c.z + (Math.random()-.5)*2;
    b.taken = false; b.m.visible = true;
  }
  for(const a of almonds){
    const ang = Math.random()*Math.PI*2, d = 16 + Math.random()*38;
    const c = openCellNear(px - Math.sin(ang)*d, pz - Math.cos(ang)*d);
    a.x = c.x + (Math.random()-.5)*2; a.z = c.z + (Math.random()-.5)*2;
    a.taken = false; a.m.visible = true;
  }
  exitG.visible = entG.visible = true;
  setTorch(true);
  if(!audio.AC){ audio.buildHum(); } audio.setHum(true); audio.buildGameAudio(); audio.buildBreathing(); audio.buildHeart();
  breathPhase = 0; heartPhase = 0; stamina = 100; exhausted = false; fear = 0; calm = 0; scareT = 8;
  runBats = 0; runAlmonds = 0; setPausedState(false);
  document.body.classList.add("in-game");
  gameHud.classList.add("on"); gameEnd.classList.remove("on");
  gHint.textContent = isTouch
    ? "LEFT: MOVE · RIGHT: LOOK · FOLLOW THE WHINE · LIGHT FREEZES IT"
    : "WASD MOVE · MOUSE / HOLD+DRAG TO LOOK · SHIFT RUN · F TORCH · FOLLOW THE WHINE · LIGHT FREEZES IT";
  gHint.style.opacity = 1;
  setTimeout(()=>{ gHint.style.opacity = 0; }, 9000);
  tryPointerLock();
  gameMode = true;
}
function endGame(kind){
  gameMode = false;
  if(document.pointerLockElement) document.exitPointerLock();
  if(audio.whineGain){ audio.whineGain.gain.value = 0; audio.droneGain.gain.value = 0; }
  audio.setBreath(0); audio.setHeart(0);
  fear = 0; fearVig.style.opacity = 0;
  noiseEl.style.opacity = .06;
  gameHud.classList.remove("on");
  // hand the camera back to the wandering walker
  heading = headTarget = gYaw; mode = "walk"; modeDur = modeT = 6; speedT = 1; sweep = 0;
  camera.rotation.x = 0; camera.rotation.z = 0;
  if(kind === "quit"){ exitToSite(); return; }
  const secs = Math.round((performance.now() - gStart)/1000);
  const mm = Math.floor(secs/60), ss = String(secs%60).padStart(2,"0");
  const stats = `${runBats} CELL${runBats===1?"":"S"} · ${runAlmonds} ALMOND`;
  if(kind === "win"){
    audio.winSfx();
    let best = 0; try { best = +(localStorage.getItem("backrooms:best") || 0); } catch(e){}
    let tag;
    if(!best || secs < best){ try { localStorage.setItem("backrooms:best", secs); } catch(e){} tag = "NEW BEST TIME"; }
    else { const bm = Math.floor(best/60), bs = String(best%60).padStart(2,"0"); tag = `BEST ${bm}:${bs}`; }
    gEndTitle.textContent = "YOU FOUND THE DOOR";
    gEndTitle.style.color = "var(--wall-bright)"; gEndTitle.style.textShadow = "0 0 26px rgba(232,217,138,.4)";
    gEndSub.textContent = `ESCAPED IN ${mm}:${ss} — ${tag} · ${stats}`;
  } else {
    audio.playGlitchSfx();
    veil.classList.remove("on"); void veil.offsetWidth; veil.classList.add("on");
    gEndTitle.textContent = "IT FOUND YOU";
    gEndTitle.style.color = "var(--blood)"; gEndTitle.style.textShadow = "0 0 30px rgba(255,42,31,.5)";
    gEndSub.textContent = `SIGNAL LOST AFTER ${mm}:${ss} · ${stats}`;
  }
  gameEnd.classList.add("on");
}
function exitToSite(){
  gameEnd.classList.remove("on");
  exitG.visible = entG.visible = false;
  for(const b of bats) b.m.visible = false;
  for(const a of almonds) a.m.visible = false;
  document.body.classList.remove("in-game");
}
// ENTER THE MAZE (#startGame) opens the React pre-game menu; its PLAY dispatches this.
addEventListener("backrooms:start", startGame);
document.getElementById("gRetry").addEventListener("click", startGame);
document.getElementById("gReturn").addEventListener("click", exitToSite);
document.getElementById("gQuit").addEventListener("click", ()=> endGame("quit"));

/* --- pause (Esc). React renders the overlay from the pausestate event. --- */
function setPausedState(v){
  paused = v;
  if(v && document.pointerLockElement) document.exitPointerLock();
  dispatchEvent(new CustomEvent("backrooms:pausestate", { detail: { paused: v } }));
}
addEventListener("backrooms:resume", ()=> setPausedState(false));
addEventListener("backrooms:quit", ()=> { setPausedState(false); endGame("quit"); });

/* --- per-frame game logic --- */
function updateGame(dt, t){
  /* movement input */
  let ix = 0, iz = 0;
  if(keys["KeyW"]||keys["ArrowUp"]) iz += 1;
  if(keys["KeyS"]||keys["ArrowDown"]) iz -= 1;
  if(keys["KeyA"]||keys["ArrowLeft"]) ix -= 1;
  if(keys["KeyD"]||keys["ArrowRight"]) ix += 1;
  if(tMove){ ix += tMove.dx; iz += -tMove.dy; }
  let len = Math.hypot(ix, iz);
  if(len > 1){ ix /= len; iz /= len; len = 1; }
  const wantRun = keys["ShiftLeft"]||keys["ShiftRight"];
  const moving = len > 0.05;
  if(wantRun && moving && !exhausted && stamina > 0){
    stamina = Math.max(0, stamina - dt*(100/7));
    if(stamina === 0) exhausted = true;                 // must recover before sprinting again
  } else {
    stamina = Math.min(100, stamina + dt*(100/12));
    if(exhausted && stamina > 30) exhausted = false;
  }
  const run = wantRun && moving && !exhausted && stamina > 0;
  const spd = (run ? 3.5 : 2.1) * len;
  gStaFill.style.width = stamina + "%";
  gStaFill.style.background = exhausted ? "var(--blood)" : "#7fd7ff";
  const fwdX = -Math.sin(gYaw), fwdZ = -Math.cos(gYaw);
  const rgtX =  Math.cos(gYaw), rgtZ = -Math.sin(gYaw);
  const vx = (fwdX*iz + rgtX*ix) * spd, vz = (fwdZ*iz + rgtZ*ix) * spd;
  const nx = px + vx*dt, nz = pz + vz*dt;
  if(!blockedAt(nx, pz)) px = nx;
  if(!blockedAt(px, nz)) pz = nz;

  /* gait */
  stepPhase += spd*dt*0.5;
  const stride = Math.floor(stepPhase*2);
  if(stride !== lastStep && spd > 0.4){ lastStep = stride; audio.stepSfx(); }
  const bob = Math.sin(stepPhase*Math.PI*2)*0.05*Math.min(spd/2, 1.2);
  gaitBob = bob;
  camera.rotation.y = gYaw;
  camera.rotation.x = gPitch + Math.cos(stepPhase*Math.PI*2)*0.004*spd;
  camera.rotation.z = Math.sin(stepPhase*Math.PI)*0.008*Math.min(spd/2, 1);
  camera.position.y = 1.62 + bob + Math.sin(t*1.35)*0.012;
  heading = gYaw; speed = spd; // reused by torch sway + dust drift

  /* battery */
  if(torchOn){
    gBattery -= dt * (100/140) * DIFFICULTIES[settings.get().difficulty].drain;
    if(gBattery <= 0){ gBattery = 0; setTorch(false); }
  }
  gBatFill.style.width = gBattery + "%";
  gBatFill.style.background = gBattery < 25 ? "var(--blood)" : "var(--wall-bright)";

  /* pickups */
  for(const b of bats){
    if(b.taken) continue;
    b.m.position.set(b.x - px, 0.35 + Math.sin(t*2 + b.x)*0.06, b.z - pz);
    b.m.rotation.y = t*1.4;
    if(Math.hypot(b.x - px, b.z - pz) < 1.1){
      b.taken = true; b.m.visible = false;
      gBattery = Math.min(100, gBattery + 35); runBats++;
      if(!torchOn) setTorch(true);
      audio.blipSfx();
    }
  }
  for(const a of almonds){
    if(a.taken) continue;
    a.m.position.set(a.x - px, 0.5 + Math.sin(t*1.6 + a.x)*0.05, a.z - pz);
    a.m.rotation.y = t*0.8;
    if(Math.hypot(a.x - px, a.z - pz) < 1.1){
      a.taken = true; a.m.visible = false;
      fear = Math.max(0, fear - 40); calm = 6; stamina = Math.min(100, stamina + 30); runAlmonds++;
      audio.blipSfx();
    }
  }

  /* exit door */
  const exDx = exitW.x - px, exDz = exitW.z - pz;
  const exD = Math.hypot(exDx, exDz);
  exitG.position.set(exDx, 0, exDz);
  exitLight.intensity = 0.8 + Math.sin(t*3)*0.15;
  if(exD < 1.6){ endGame("win"); return; }

  /* entity */
  let edx = px - entW.x, edz = pz - entW.z;
  let ed = Math.hypot(edx, edz) || 0.001;
  const dirToEnt = Math.atan2(-(entW.x - px), -(entW.z - pz));
  const lookOff = Math.abs(normA(dirToEnt - gYaw));
  const lit = torchOn && torchI > 1 && ed < 15 && lookOff < 0.3;
  const eSpd = lit ? 0.12 : (ed > 26 ? 1.15 : 1.75) * DIFFICULTIES[settings.get().difficulty].ent;
  const ex2 = entW.x + (edx/ed)*eSpd*dt, ez2 = entW.z + (edz/ed)*eSpd*dt;
  if(!blockedAt(ex2, entW.z)) entW.x = ex2;
  if(!blockedAt(entW.x, ez2)) entW.z = ez2;
  if(ed > 78){ // lost you — flank and return
    const ra = Math.random()*Math.PI*2;
    const rc = openCellNear(px - Math.sin(ra)*42, pz - Math.cos(ra)*42);
    entW = {x:rc.x, z:rc.z};
  }
  /* gait — the rigged human plays real clips; the fallback swings its joints */
  if(entRigged){
    entMixer.update(dt);
    fadeAction(entActions.idle, lit ? 1 : 0, dt);                  // frozen in the beam
    fadeAction(entActions.walk, (!lit && ed >= 26) ? 1 : 0, dt);   // stalking from a distance
    fadeAction(entActions.run,  (!lit && ed <  26) ? 1 : 0, dt);   // closing on you
    entG.position.set(entW.x - px, lit ? Math.sin(t*40)*0.006 : 0, entW.z - pz);
    entG.rotation.y = Math.atan2(px - entW.x, pz - entW.z);
    if(entHeadBone){                                               // keep the glow on its head
      entG.updateMatrixWorld(true);
      entHeadBone.getWorldPosition(_headPos);
      entG.worldToLocal(_headPos);
      smiler.face.position.copy(_headPos);
    }
  } else {
    entWalk += eSpd * dt * 2.6;
    const sw = Math.sin(entWalk), swAbs = Math.abs(sw);
    smiler.legs[0].hip.rotation.x = sw * 0.55;
    smiler.legs[1].hip.rotation.x = -sw * 0.55;
    smiler.legs[0].knee.rotation.x = Math.max(0, -sw) * 0.8;
    smiler.legs[1].knee.rotation.x = Math.max(0, sw) * 0.8;
    smiler.arms[0].sh.rotation.x = -sw * 0.34;
    smiler.arms[1].sh.rotation.x = sw * 0.34;
    smiler.arms[0].elbow.rotation.x = 0.22 + swAbs * 0.18;
    smiler.arms[1].elbow.rotation.x = 0.22 + swAbs * 0.18;
    smiler.torso.rotation.z = sw * 0.045;
    smiler.head.rotation.z = -sw * 0.05;
    entG.position.set(entW.x - px, (lit ? Math.sin(t*40)*0.008 : 0) + swAbs*0.022, entW.z - pz);
    entG.rotation.y = Math.atan2(px - entW.x, pz - entW.z);
  }
  const glow = 0.6 + 0.4 * Math.abs(Math.sin(t * 3)) + (ed < 8 ? 0.2 : 0);   // grin/eyes flicker, steadier up close
  entGrinMat.opacity = Math.min(1, glow);
  entEyeMat.opacity = Math.min(1, glow * (0.8 + Math.abs(Math.sin(t * 11)) * 0.2));
  if(ed < 1.3){ endGame("caught"); return; }

  /* dread + guidance audio */
  const prox = Math.max(0, (16 - ed)/16);
  /* sanity / fear — rises near the entity, when it is in view, and in the dark */
  const seesEnt = ed < 15 && lookOff < 0.5;
  if(calm > 0) calm -= dt;                                  // almond water briefly steadies you
  const fearTarget = Math.min(100, (prox*85 + (seesEnt ? 22 : 0) + (torchOn ? 0 : 22)) * (calm > 0 ? 0.45 : 1));
  fear += (fearTarget - fear) * Math.min(1, dt * (fearTarget > fear ? 2.2 : 0.9));
  const fear01 = fear / 100;
  gSanFill.style.width = (100 - fear) + "%";
  gSanFill.style.background = fear > 70 ? "var(--blood)" : fear > 40 ? "#e8c44a" : "var(--wall-bright)";
  fearVig.style.opacity = fear01 * 0.72;
  noiseEl.style.opacity = .06 + prox*0.28 + fear01*0.14;
  if(fear > 55){ const sh = (fear-55)/45 * 0.006; camera.rotation.x += (Math.random()-.5)*sh; camera.rotation.z += (Math.random()-.5)*sh; }
  /* breathing — heavier when running, low on battery, or the entity is close */
  const running = (keys["ShiftLeft"]||keys["ShiftRight"]) && (Math.abs(ix)+Math.abs(iz) > 0.05);
  const exert = (running ? 1 : 0.3) + (gBattery < 25 ? 0.3 : 0) + prox*0.6 + fear01*0.4;
  breathPhase += dt * (0.55 + exert*0.9);
  const be = Math.max(0, Math.sin(breathPhase*Math.PI*2));
  breath = be*be;
  audio.setBreath(breath * (0.02 + exert*0.045));
  /* heartbeat — a lub-dub whose rate + volume climb with fear */
  heartPhase += dt * (0.8 + fear01*1.7);
  const lub = Math.pow(Math.max(0, Math.sin(heartPhase*Math.PI*2)), 8);
  const dub = 0.7 * Math.pow(Math.max(0, Math.sin((heartPhase-0.13)*Math.PI*2)), 8);
  audio.setHeart((lub + dub) * fear01 * 0.5);
  if(audio.gAudioReady){
    const vol = audio.humOn ? 1 : 0;
    audio.whineGain.gain.value = vol * Math.max(0, (46 - exD)/46) * 0.06;
    if(audio.whinePan){
      const rel = normA(Math.atan2(-exDx, -exDz) - gYaw);
      audio.whinePan.pan.value = Math.max(-1, Math.min(1, -Math.sin(rel)));
    }
    audio.droneGain.gain.value = vol * prox * 0.1;
  }

  /* ambient scares — a whisper from the dark + a jolt of unease */
  scareT -= dt;
  if(scareT <= 0){ scareT = 9 + Math.random()*13; audio.whisper(); fear = Math.min(100, fear + 10); }

  /* clock */
  const secs = Math.floor((performance.now() - gStart)/1000);
  gTime.textContent = `T+ ${Math.floor(secs/60)}:${String(secs%60).padStart(2,"0")}`;
}

/* ================= VHS NOISE CANVAS + TRACKING BAR ================= */
__cleanups.push(startVhs({ reduceMotion }));

/* ================= OSD: battery + clock + tape counter ================= */
__cleanups.push(startOsd());

/* ================= LIVE SETTINGS (graphics · skin · volume) ================= */
function applyGraphics(){
  const s = settings.get();
  const q = QUALITY[s.quality] || QUALITY.high;
  renderer.setPixelRatio(Math.min(devicePixelRatio, COARSE ? 1.1 : q.ratio));
  renderer.setSize(innerWidth, innerHeight, false);

  const sh = !!s.shadows;
  if(renderer.shadowMap.enabled !== sh){
    renderer.shadowMap.enabled = sh;
    scene.traverse(o=>{ if(o.isMesh && o.material){
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m=>{ m.needsUpdate = true; });
    }});
  }
  torch.castShadow = sh;
  for(const p of pillars){ p.castShadow = p.receiveShadow = sh; }
  floor.receiveShadow = ceil.receiveShadow = sh;
  entG.traverse(o=>{ if(o.isMesh) o.castShadow = sh && !o.userData.glow; });
  exitG.traverse(o=>{ if(o.isMesh && o.material === jambMat) o.castShadow = sh; });
  if(torch.shadow.mapSize.width !== q.shadowMap){
    torch.shadow.mapSize.set(q.shadowMap, q.shadowMap);
    if(torch.shadow.map){ torch.shadow.map.dispose(); torch.shadow.map = null; }
  }
  renderer.shadowMap.needsUpdate = true;

  scene.fog.density = s.fog;
  document.body.classList.toggle("no-vhs", !s.vhs);
}
function applySkin(){
  const s = settings.get();
  const skin = SKINS.find(k=>k.id===s.skin) || SKINS[0];
  torch.color.setHex(skin.torch);
  fill.color.setHex(skin.fill);
  vmLens.material.color.setHex(skin.torch);
  vmLight.color.setHex(skin.torch);
  const xh = document.querySelector(".xh");
  if(xh){ xh.style.background = skin.accent; xh.style.boxShadow = `0 0 6px ${skin.accent}`; }
  document.body.style.setProperty("--skin", skin.accent);
}
applyGraphics();
applySkin();
audio.setVolume(settings.get().volume);
__cleanups.push(settings.subscribe(()=>{ applyGraphics(); applySkin(); audio.setVolume(settings.get().volume); }));

/* ================= LOADER + CURSOR + REVEALS + WHISPER ================= */
__cleanups.push(startUi({ onPlay: () => audio.setHum(true) }));

  return function cleanup() {
    started = false;
    cancelAnimationFrame(__rafId);
    for (const id of __intervals) clearInterval(id);
    for (const c of __cleanups) c();
    try { renderer.dispose(); } catch (e) { /* noop */ }
  };
}
