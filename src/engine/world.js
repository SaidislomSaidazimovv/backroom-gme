import * as THREE from "three";

/**
 * Level 0 — "The Lobby", built to the canon rather than to a pillar field.
 *
 *   "randomly segmented rooms, hallways and flights of stairs … a mostly
 *    consistent mono-yellow wallpaper … damp, moist carpet … the ceiling is
 *    decorated with office lights … the endless background noise of fluorescent
 *    lights at maximum hum-buzz"
 *
 * So: a maze of full-height wallpapered partition walls carving open rooms and
 * tight hallways, a suspended acoustic ceiling, and fluorescent troffers that
 * are inconsistently placed but *on* — the level is lit, sickly and bright.
 * A few tubes are dead or flickering, and rare blocks are pitch-black hallways.
 *
 * The world is infinite and deterministic: every wall, fixture and dead tube is
 * a pure function of its grid coordinate, so it never has to be stored. A pool
 * of instanced meshes is re-addressed whenever the player crosses a cell.
 */

export const CS = 4.0;     // cell size (m) — hallways are one cell wide
export const H = 3.0;      // ceiling height (m)
const WT = 0.18;           // wall thickness
const PR = 0.34;           // collision radius
const RANGE = 8;           // cells streamed around the player
const SKIRT = 0.12;        // baseboard height
const LIGHTS = 8;          // pooled real point lights

/* ---------------- deterministic layout ---------------- */

const h1 = (a) => { const s = Math.sin(a * 269.5 + 13.7) * 43758.5453; return s - Math.floor(s); };
const h2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// Long wall runs: only some grid lines carry walls at all, which is what makes
// the space read as rooms and corridors instead of noise.
const vLine = (gi) => h1(gi * 1.13) < 0.38;              // wall line at x = gi*CS
const hLine = (gj) => h1(gj * 2.37 + 91.3) < 0.38;       // wall line at z = gj*CS

// …and each run is punched through with openings, so rooms connect.
export const wallW = (gi, gj) => vLine(gi) && h2(gi * 5 + 1, gj * 3 + 2) > 0.24;
export const wallN = (gi, gj) => hLine(gj) && h2(gi * 3 + 9, gj * 5 + 4) > 0.24;

// rare pitch-black stretches (canon: "hallways described as pitch black appear rarely")
const darkZone = (gi, gj) => h2(Math.floor(gi / 5) * 3 + 1, Math.floor(gj / 5) * 7 + 2) < 0.07;

const hasFixture = (gi, gj) => h2(gi * 7 + 3, gj * 11 + 5) < 0.58;   // inconsistently placed
// 0 = dead, 1 = lit, 2 = flickering
function fixtureState(gi, gj) {
  if (darkZone(gi, gj)) return 0;
  const r = h2(gi * 17 + 2, gj * 13 + 8);
  if (r < 0.07) return 0;
  if (r < 0.19) return 2;
  return 1;
}

/* ---------------- collision ---------------- */

export function blockedAt(wx, wz) {
  const gi = Math.floor(wx / CS), gj = Math.floor(wz / CS);
  for (let i = gi - 1; i <= gi + 1; i++) {
    for (let j = gj - 1; j <= gj + 1; j++) {
      if (wallW(i, j)) {                                  // runs along z at x = i*CS
        const cx = i * CS, z0 = j * CS, z1 = z0 + CS;
        if (Math.abs(wx - cx) < WT / 2 + PR && wz > z0 - PR && wz < z1 + PR) return true;
      }
      if (wallN(i, j)) {                                  // runs along x at z = j*CS
        const cz = j * CS, x0 = i * CS, x1 = x0 + CS;
        if (Math.abs(wz - cz) < WT / 2 + PR && wx > x0 - PR && wx < x1 + PR) return true;
      }
    }
  }
  return false;
}

export function openCellNear(wx, wz) {
  const gi0 = Math.floor(wx / CS), gj0 = Math.floor(wz / CS);
  for (let r = 0; r < 14; r++) {
    const steps = Math.max(1, r * 8);
    for (let a = 0; a < steps; a++) {
      const th = a / steps * Math.PI * 2;
      const gi = gi0 + Math.round(Math.cos(th) * r), gj = gj0 + Math.round(Math.sin(th) * r);
      const x = gi * CS + CS / 2, z = gj * CS + CS / 2;
      if (!blockedAt(x, z)) return { x, z };
    }
  }
  return { x: gi0 * CS + CS / 2, z: gj0 * CS + CS / 2 };
}

/* ---------------- the level ---------------- */

export function createLevel(scene, T, { coarse }) {
  const group = new THREE.Group();       // holds everything in absolute world coords
  scene.add(group);

  // the sickly bounce light of a room full of fluorescents
  const hemi = new THREE.HemisphereLight(0x9b8a4e, 0x6a5c38, 0.24);
  scene.add(hemi);

  /* --- surfaces --- */
  T.wallTex.repeat.set(2.6, 2.0); T.wallBump.repeat.set(2.6, 2.0);
  const wallMat = new THREE.MeshPhongMaterial({
    map: T.wallTex, bumpMap: T.wallBump, bumpScale: 0.014, shininess: 6, specular: 0x1a1710,
  });
  const skirtMat = new THREE.MeshPhongMaterial({ color: 0x3b3320, shininess: 16, specular: 0x2a2416 });

  const tileF = 2.0;                                        // one carpet tile = 2 m
  const FS = 200;
  T.carpetTex.repeat.set(FS / tileF, FS / tileF); T.carpetBump.repeat.set(FS / tileF, FS / tileF);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FS, FS),
    new THREE.MeshPhongMaterial({ map: T.carpetTex, bumpMap: T.carpetBump, bumpScale: 0.02, shininess: 4, specular: 0x14100a }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const tileC = 1.2;                                        // texture tile = 2×2 ceiling panels of 0.6 m
  T.ceilTex.repeat.set(FS / tileC, FS / tileC); T.ceilBump.repeat.set(FS / tileC, FS / tileC);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(FS, FS),
    new THREE.MeshPhongMaterial({ map: T.ceilTex, bumpMap: T.ceilBump, bumpScale: 0.01, shininess: 8, specular: 0x1a1a18 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; ceil.receiveShadow = true; scene.add(ceil);

  /* --- instanced walls (two runs) + their baseboards --- */
  const MAXW = (RANGE * 2 + 1) * (RANGE * 2 + 1);
  const geoWallV = new THREE.BoxGeometry(WT, H, CS);         // runs along z
  const geoWallH = new THREE.BoxGeometry(CS, H, WT);         // runs along x
  const geoSkirtV = new THREE.BoxGeometry(WT + 0.05, SKIRT, CS);
  const geoSkirtH = new THREE.BoxGeometry(CS, SKIRT, WT + 0.05);

  const wallV = new THREE.InstancedMesh(geoWallV, wallMat, MAXW);
  const wallH = new THREE.InstancedMesh(geoWallH, wallMat, MAXW);
  const skirtV = new THREE.InstancedMesh(geoSkirtV, skirtMat, MAXW);
  const skirtH = new THREE.InstancedMesh(geoSkirtH, skirtMat, MAXW);
  for (const m of [wallV, wallH, skirtV, skirtH]) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.castShadow = m.receiveShadow = !coarse;
    m.frustumCulled = false;
    group.add(m);
  }

  /* --- ceiling fixtures: a dark troffer housing + a diffuser panel that glows --- */
  const trofMat = new THREE.MeshPhongMaterial({ color: 0x2b2a26, shininess: 20, specular: 0x33322c });
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });   // tinted per instance
  const geoTrof = new THREE.BoxGeometry(1.3, 0.1, 0.68);
  const geoPanel = new THREE.BoxGeometry(1.18, 0.03, 0.56);
  const trof = new THREE.InstancedMesh(geoTrof, trofMat, MAXW);
  const panel = new THREE.InstancedMesh(geoPanel, panelMat, MAXW);
  for (const m of [trof, panel]) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    group.add(m);
  }
  panel.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXW * 3), 3);
  panel.instanceColor.setUsage(THREE.DynamicDrawUsage);

  // real lights for the fixtures nearest the player — the rest is carried by the
  // glowing panels plus the hemisphere bounce
  const lamps = [];
  for (let i = 0; i < LIGHTS; i++) {
    const l = new THREE.PointLight(0xffeeba, 0, 14, 1.8);
    l.visible = false; group.add(l); lamps.push(l);
  }

  /* --- streaming --- */
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
  const _qRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  let lastCi = null, lastCj = null;
  let fixtures = [];      // {gi,gj,state,phase} for the panels currently addressed

  function rebuild(ci, cj) {
    let nv = 0, nh = 0, nf = 0;
    fixtures = [];
    for (let i = ci - RANGE; i <= ci + RANGE; i++) {
      for (let j = cj - RANGE; j <= cj + RANGE; j++) {
        if (wallW(i, j)) {
          _p.set(i * CS, H / 2, j * CS + CS / 2);
          wallV.setMatrixAt(nv, _m.compose(_p, _q, _s));
          _p.y = SKIRT / 2;
          skirtV.setMatrixAt(nv, _m.compose(_p, _q, _s));
          nv++;
        }
        if (wallN(i, j)) {
          _p.set(i * CS + CS / 2, H / 2, j * CS);
          wallH.setMatrixAt(nh, _m.compose(_p, _q, _s));
          _p.y = SKIRT / 2;
          skirtH.setMatrixAt(nh, _m.compose(_p, _q, _s));
          nh++;
        }
        if (hasFixture(i, j)) {
          const rot = h2(i * 2 + 5, j * 4 + 7) < 0.5 ? _q : _qRot;   // troffers sit either way
          _p.set(i * CS + CS / 2, H - 0.06, j * CS + CS / 2);
          trof.setMatrixAt(nf, _m.compose(_p, rot, _s));
          _p.y = H - 0.10;
          panel.setMatrixAt(nf, _m.compose(_p, rot, _s));
          fixtures.push({ gi: i, gj: j, state: fixtureState(i, j), phase: h2(i * 9, j * 6) * 10 });
          nf++;
        }
      }
    }
    wallV.count = skirtV.count = nv;
    wallH.count = skirtH.count = nh;
    trof.count = panel.count = nf;
    wallV.instanceMatrix.needsUpdate = wallH.instanceMatrix.needsUpdate = true;
    skirtV.instanceMatrix.needsUpdate = skirtH.instanceMatrix.needsUpdate = true;
    trof.instanceMatrix.needsUpdate = panel.instanceMatrix.needsUpdate = true;

    // hand the pooled point lights to the nearest live fixtures
    const live = fixtures
      .map((f, idx) => ({ f, idx, d: (f.gi - ci) ** 2 + (f.gj - cj) ** 2 }))
      .filter((o) => o.f.state !== 0)
      .sort((a, b) => a.d - b.d)
      .slice(0, LIGHTS);
    lamps.forEach((l, k) => {
      const o = live[k];
      if (!o) { l.visible = false; return; }
      l.visible = true;
      l.position.set(o.f.gi * CS + CS / 2, H - 0.2, o.f.gj * CS + CS / 2);
      l.userData.f = o.f;
    });
  }

  const _c = new THREE.Color();
  function animate(t, reduceMotion) {
    // the buzz: lit tubes sit just under full and shiver; flickering ones stutter
    for (let k = 0; k < fixtures.length; k++) {
      const f = fixtures[k];
      let b;
      if (f.state === 0) b = 0.02;
      else if (f.state === 2) {
        b = (!reduceMotion && Math.random() < 0.22) ? 0.1 + Math.random() * 0.3 : 0.9;
      } else {
        b = 0.92 + Math.sin(t * 31 + f.phase) * 0.05;
        if (!reduceMotion && Math.random() < 0.0015) b *= 0.25;   // a rare stutter
      }
      f.b = b;
      _c.setRGB(b, b * 0.97, b * 0.85);
      panel.setColorAt(k, _c);
    }
    if (panel.instanceColor) panel.instanceColor.needsUpdate = true;

    for (const l of lamps) {
      if (!l.visible) continue;
      const f = l.userData.f;
      l.intensity = (f && f.b !== undefined ? f.b : 1) * 0.95;
    }
  }

  return {
    group, hemi, floor, ceil, H, CS,
    blockedAt, openCellNear,

    update(px, pz, t, reduceMotion) {
      group.position.set(-px, 0, -pz);
      const ci = Math.floor(px / CS), cj = Math.floor(pz / CS);
      if (ci !== lastCi || cj !== lastCj) { rebuild(ci, cj); lastCi = ci; lastCj = cj; }
      animate(t, reduceMotion);

      // keep the floor/ceiling planes under the player, snapped to whole texture tiles
      floor.position.x = Math.round(px / tileF) * tileF - px;
      floor.position.z = Math.round(pz / tileF) * tileF - pz;
      ceil.position.x = Math.round(px / tileC) * tileC - px;
      ceil.position.z = Math.round(pz / tileC) * tileC - pz;
    },

    setShadows(on) {
      for (const m of [wallV, wallH, skirtV, skirtH]) m.castShadow = m.receiveShadow = on;
      floor.receiveShadow = ceil.receiveShadow = on;
    },
  };
}
