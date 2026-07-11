import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * The two "characters" of the piece, built from organic geometry (capsules with
 * real joints) and procedural PBR maps rather than bare primitives:
 *
 *  - createViewmodel(tex): the first-person arm — forearm, sleeve, palm, four
 *    curled fingers and a thumb gripping a machined flashlight.
 *  - createSmiler(tex): the entity — a tall, gaunt, wet-skinned humanoid with
 *    hip/knee/shoulder/elbow pivots so it can actually *walk*, plus the
 *    signature glowing grin and eyes.
 *
 * Both take the engine's `tex(draw, w, h)` helper so their canvas maps get the
 * same wrapping + anisotropy as the world textures.
 */

/* ---------------- procedural material maps ---------------- */

// Human skin: mottled warm tone, faint veins, pores; bump adds pores + creases.
function skinMaps(tex) {
  const map = tex((g, w, h) => {
    g.fillStyle = "#c68b69"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 190; i++) {                       // blotches / flush
      const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 30;
      const gr = g.createRadialGradient(x, y, 1, x, y, r);
      gr.addColorStop(0, Math.random() < 0.5 ? "rgba(176,96,74,.17)" : "rgba(230,184,154,.16)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.strokeStyle = "rgba(92,108,140,.10)";               // veins
    for (let i = 0; i < 16; i++) {
      g.lineWidth = 1 + Math.random() * 2;
      let x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += (Math.random() - .5) * 70; y += (Math.random() - .5) * 70; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 9000; i++) {                      // pores / freckles
      g.fillStyle = `rgba(118,70,48,${Math.random() * 0.1})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
  }, 512, 512);

  const bump = tex((g, w, h) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const v = 108 + Math.random() * 62 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
    }
    g.strokeStyle = "#5c5c5c";                            // knuckle / palm creases
    for (let i = 0; i < 26; i++) {
      g.lineWidth = 1 + Math.random() * 2.4;
      let x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 4; s++) { x += (Math.random() - .5) * 90; y += (Math.random() - .5) * 90; g.lineTo(x, y); }
      g.stroke();
    }
  }, 512, 512);
  return { map, bump };
}

// Entity flesh: dark, damp, sinewy — invisible in the black, detailed in the beam.
function fleshMaps(tex) {
  const map = tex((g, w, h) => {
    g.fillStyle = "#17150f"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 44;
      const gr = g.createRadialGradient(x, y, 1, x, y, r);
      gr.addColorStop(0, Math.random() < .5 ? "rgba(58,52,46,.16)" : "rgba(4,4,3,.32)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.strokeStyle = "rgba(126,106,98,.10)";               // sinew / veins
    for (let i = 0; i < 24; i++) {
      g.lineWidth = 1 + Math.random() * 2;
      let x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += (Math.random() - .5) * 84; y += (Math.random() - .5) * 84; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 12000; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.26})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  }, 512, 512);

  const bump = tex((g, w, h) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30000; i++) {
      const v = 78 + Math.random() * 102 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
    }
    g.strokeStyle = "#c6c6c6";                            // taut ridges under the skin
    for (let i = 0; i < 32; i++) {
      g.lineWidth = 1 + Math.random() * 3;
      let x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += (Math.random() - .5) * 100; y += (Math.random() - .5) * 100; g.lineTo(x, y); }
      g.stroke();
    }
  }, 512, 512);
  return { map, bump };
}

// Machined aluminium with a knurled grip band.
function metalBump(tex) {
  return tex((g, w, h) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 6) { g.fillStyle = "#6a6a6a"; g.fillRect(x, 0, 3, h); }   // knurl
    for (let i = 0; i < 8000; i++) {
      const v = 118 + Math.random() * 30 | 0;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  }, 256, 256);
}

/* ---------------- geometry helpers ---------------- */

// A capsule (three r128 has no CapsuleGeometry): tapered cylinder + rounded caps.
function capsule(rTop, rBot, len, mat, seg = 12) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), mat));
  const a = new THREE.Mesh(new THREE.SphereGeometry(rTop, seg, Math.max(6, seg >> 1)), mat);
  a.position.y = len / 2; g.add(a);
  const b = new THREE.Mesh(new THREE.SphereGeometry(rBot, seg, Math.max(6, seg >> 1)), mat);
  b.position.y = -len / 2; g.add(b);
  return g;
}

/* ---------------- the first-person arm + flashlight ---------------- */

export function createViewmodel(tex) {
  const { map, bump } = skinMaps(tex);
  const skinMat = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 0.0035, roughness: 0.7, metalness: 0 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.96, metalness: 0.02 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x35383f, roughness: 0.45, metalness: 0.62, bumpMap: metalBump(tex), bumpScale: 0.0016 });
  const lensMat = new THREE.MeshBasicMaterial({ color: 0xffe2ae, side: THREE.DoubleSide });

  const group = new THREE.Group();

  /* --- the flashlight (barrel runs along -z, away from the eye) --- */
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.26, 22), metalMat);
  body.rotation.x = Math.PI / 2; body.position.set(0, 0.012, -0.25); group.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.031, 0.075, 22), metalMat);
  head.rotation.x = Math.PI / 2; head.position.set(0, 0.012, -0.40); group.add(head);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.005, 8, 22), metalMat);
  bezel.position.set(0, 0.012, -0.436); group.add(bezel);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.026, 0.032, 18), metalMat);
  tail.rotation.x = Math.PI / 2; tail.position.set(0, 0.012, -0.115); group.add(tail);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 26), lensMat);
  lens.rotation.y = Math.PI;                                  // the lens faces away, into the dark
  lens.position.set(0, 0.012, -0.436); group.add(lens);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.0055, 8, 24), lensMat);
  rim.position.set(0, 0.012, -0.428); group.add(rim);         // warm rim glow you can see from behind

  /* --- the hand gripping it --- */
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), skinMat);
  palm.scale.set(1.0, 0.56, 1.2); palm.position.set(0.004, -0.014, -0.175); group.add(palm);

  const fingers = [];
  for (let i = 0; i < 4; i++) {                              // four fingers curling over the barrel
    const root = new THREE.Group();
    root.position.set(-0.042 + i * 0.028, 0.026, -0.205 + i * 0.004);
    root.rotation.x = 0.55;
    const lens3 = [0.036, 0.029, 0.022], rads = [0.0115, 0.0098, 0.0082], curl = [0.0, 0.85, 0.75];
    let parent = root;
    for (let s = 0; s < 3; s++) {
      const joint = new THREE.Group();
      joint.rotation.x = curl[s];
      if (s > 0) joint.position.y = -lens3[s - 1];
      const c = capsule(rads[s], rads[s] * 0.9, lens3[s], skinMat, 9);
      c.position.y = -lens3[s] / 2;
      joint.add(c); parent.add(joint); parent = joint;
    }
    group.add(root); fingers.push(root);
  }
  const thumb = new THREE.Group();                            // thumb along the near side
  thumb.position.set(0.05, -0.006, -0.185); thumb.rotation.set(0.9, 0, -0.75);
  const t1 = capsule(0.014, 0.012, 0.04, skinMat, 9); t1.position.y = -0.02; thumb.add(t1);
  const tJoint = new THREE.Group(); tJoint.position.y = -0.04; tJoint.rotation.x = 0.7;
  const t2 = capsule(0.012, 0.01, 0.034, skinMat, 9); t2.position.y = -0.017; tJoint.add(t2);
  thumb.add(tJoint); group.add(thumb);

  /* --- wrist, forearm, sleeve --- */
  const forearm = capsule(0.033, 0.042, 0.28, skinMat, 14);
  forearm.rotation.x = 1.36; forearm.position.set(0.026, -0.055, -0.03); group.add(forearm);
  const sleeve = capsule(0.056, 0.064, 0.24, clothMat, 14);
  sleeve.rotation.x = 1.36; sleeve.position.set(0.046, -0.093, 0.16); group.add(sleeve);

  const light = new THREE.PointLight(0xffe2ae, 0.55, 1.6, 2.2);   // spill so the hand reads in the dark
  light.position.set(0, 0.07, -0.19); group.add(light);

  group.scale.setScalar(0.86);
  group.position.set(0.32, -0.29, -0.46);
  group.rotation.set(0.06, -0.17, 0.05);
  group.visible = false;

  return { group, lens, light, fingers };
}

/* ---------------- the entity: a walking Smiler ---------------- */

export function createSmiler(tex) {
  const { map, bump } = fleshMaps(tex);
  const flesh = new THREE.MeshStandardMaterial({
    map, bumpMap: bump, bumpScale: 0.016, roughness: 0.42, metalness: 0.06, color: 0x8d8d8d,
  });

  const group = new THREE.Group();

  // legs — hip + knee pivots so it can stride
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.105, 1.40, 0);
    const thigh = capsule(0.072, 0.052, 0.70, flesh, 12); thigh.position.y = -0.35; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.70;
    const shin = capsule(0.05, 0.034, 0.66, flesh, 12); shin.position.y = -0.33; knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.25), flesh);
    foot.position.set(0, -0.68, 0.07); knee.add(foot);
    hip.add(knee); group.add(hip);
    legs.push({ hip, knee });
  }

  const pelvis = capsule(0.105, 0.095, 0.16, flesh, 14); pelvis.position.y = 1.44; group.add(pelvis);

  // torso: pinched waist, flared ribcage, bony hunched shoulders
  const torso = new THREE.Group(); torso.position.set(0, 1.52, 0); torso.rotation.x = -0.14;
  const waist = capsule(0.102, 0.086, 0.3, flesh, 14); waist.position.y = 0.16; torso.add(waist);
  const ribs = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), flesh);
  ribs.scale.set(1.0, 1.15, 0.62); ribs.position.y = 0.52; torso.add(ribs);
  const sternum = capsule(0.07, 0.1, 0.3, flesh, 12);
  sternum.position.set(0, 0.52, 0.05); sternum.scale.set(1, 1, 0.7); torso.add(sternum);
  const clav = capsule(0.044, 0.044, 0.4, flesh, 10);
  clav.rotation.z = Math.PI / 2; clav.position.y = 0.8; torso.add(clav);
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), flesh);
    cap.position.set(side * 0.21, 0.79, 0); torso.add(cap);          // bony shoulder caps
  }
  group.add(torso);

  // arms — unnaturally long, hanging close, resting bend at the elbow
  const arms = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(side * 0.21, 0.77, 0);
    const upper = capsule(0.046, 0.036, 0.58, flesh, 10); upper.position.y = -0.29; sh.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.58; elbow.rotation.x = 0.24;
    const fore = capsule(0.036, 0.026, 0.6, flesh, 10); fore.position.y = -0.3; elbow.add(fore);
    const hand = capsule(0.03, 0.014, 0.24, flesh, 8); hand.position.y = -0.7; elbow.add(hand);
    sh.add(elbow); torso.add(sh);
    arms.push({ sh, elbow });
  }

  // a long neck craned forward and a head tipped down — the hunch
  const neck = capsule(0.04, 0.048, 0.18, flesh, 10);
  neck.position.set(0, 0.92, 0.03); neck.rotation.x = 0.25; torso.add(neck);
  const head = new THREE.Group(); head.position.set(0, 1.03, 0.07); head.rotation.x = 0.16; torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), flesh);
  skull.scale.set(1, 1.22, 0.95); head.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), flesh);
  jaw.scale.set(1, 0.6, 0.85); jaw.position.set(0, -0.09, 0.03); head.add(jaw);   // heavy jaw

  // the grin — a jagged-teeth canvas "skin" that glows in the black (+z faces you)
  const grinTex = tex((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#efeee0";
    g.beginPath();
    g.moveTo(w * 0.07, h * 0.3);
    g.quadraticCurveTo(w * 0.5, h * 0.22, w * 0.93, h * 0.3);
    g.quadraticCurveTo(w * 0.5, h * 0.99, w * 0.07, h * 0.3);
    g.closePath(); g.fill();
    g.strokeStyle = "rgba(6,5,5,0.94)"; g.lineWidth = Math.max(2, w * 0.011);
    const n = 16;
    for (let i = 1; i < n; i++) { const x = w * (0.09 + 0.82 * i / n); g.beginPath(); g.moveTo(x, h * 0.26); g.lineTo(x, h * 0.96); g.stroke(); }
    g.fillStyle = "rgba(6,5,5,0.94)";
    for (let i = 0; i < n; i++) {
      const x0 = w * (0.09 + 0.82 * i / n), x1 = w * (0.09 + 0.82 * (i + 1) / n), mid = (x0 + x1) / 2;
      g.beginPath(); g.moveTo(x0, h * 0.9); g.lineTo(x1, h * 0.9); g.lineTo(mid, h * 0.63); g.closePath(); g.fill();
    }
  }, 256, 128);
  // the glowing face lives in its own group so a rigged model can re-parent it
  // straight onto the head bone.
  const face = new THREE.Group();
  const grinMat = new THREE.MeshBasicMaterial({ map: grinTex, transparent: true, side: THREE.DoubleSide });
  const grin = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), grinMat);
  grin.position.set(0, -0.055, 0.145); grin.userData.glow = true; face.add(grin);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf7f4e2, transparent: true });
  for (const ex of [-0.058, 0.058]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), eyeMat);
    eye.position.set(ex, 0.048, 0.128); eye.userData.glow = true; face.add(eye);
  }
  head.add(face);

  group.traverse((o) => { if (o.isMesh) o.castShadow = !o.userData.glow; });
  group.visible = false;

  return { group, face, grinMat, eyeMat, legs, arms, torso, head, flesh };
}

/**
 * Upgrade the entity to a real rigged human (a Mixamo-rigged glTF) when one is
 * available at /models/entity.glb — real anatomy, real skinning, and Idle / Walk
 * / Run clips we can blend by how fast it is hunting you. Resolves to null if the
 * file is missing or fails, in which case the procedural body stays.
 */
export function loadEntityRig(url, flesh) {
  return new Promise((resolve) => {
    new GLTFLoader().load(url, (gltf) => {
      try {
        const root = gltf.scene;
        // three r128 needs `skinning: true` on the material or the mesh renders in
        // its bind (T) pose — clone so the procedural fallback keeps its own material.
        const rigMat = flesh.clone();
        rigMat.skinning = true;
        root.traverse((o) => {
          if (o.isMesh || o.isSkinnedMesh) {
            o.castShadow = true; o.receiveShadow = false;
            o.material = rigMat;                      // dark, damp flesh instead of fatigues
            o.frustumCulled = false;                  // skinned bounds go stale otherwise
          }
        });
        const box = new THREE.Box3().setFromObject(root);
        const h = Math.max(0.001, box.max.y - box.min.y);
        const s = 2.45 / h;                           // tall…
        root.scale.set(s * 0.8, s, s * 0.8);          // …and gaunt
        root.position.y = -box.min.y * s;

        const mixer = new THREE.AnimationMixer(root);
        const byName = {};
        for (const clip of gltf.animations) byName[clip.name.toLowerCase()] = mixer.clipAction(clip);
        const actions = { idle: byName.idle || null, walk: byName.walk || null, run: byName.run || null };
        for (const a of Object.values(actions)) if (a) { a.enabled = true; a.setEffectiveWeight(0); a.play(); }
        if (actions.walk) actions.walk.setEffectiveWeight(1);

        const headBone = root.getObjectByName("mixamorigHead") || null;
        resolve({ root, mixer, actions, headBone });
      } catch (e) { resolve(null); }
    }, undefined, () => resolve(null));
  });
}
