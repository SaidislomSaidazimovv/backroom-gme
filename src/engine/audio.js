/**
 * All Web Audio for the piece, behind one factory. Nothing here touches THREE;
 * the simulation calls these methods and reads the exposed nodes / flags via
 * getters. Everything routes through a master gain so `setVolume` can scale it.
 *
 *  - hum:            ambient 60 Hz fluorescent drone (HUM button / loader gate)
 *  - stepSfx:        footstep one-shot (only while the hum is on)
 *  - playGlitchSfx:  the noclip / caught glitch swoop
 *  - buildGameAudio: the exit "whine" (stereo-panned guide) + proximity drone
 *  - blipSfx:        battery pickup
 *  - winSfx:         escape chord
 */
export function createAudio() {
  let AC = null, master = null, humGain = null, humOn = false;
  let _volume = 1;
  let stepBuf = null;
  let gAudioReady = false, whineGain = null, whinePan = null, droneGain = null;
  let breathReady = false, breathGain = null;
  let heartReady = false, heartGain = null;
  const soundBtn = document.getElementById("soundBtn");

  function buildHum(){
    AC = new (window.AudioContext||window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = _volume; master.connect(AC.destination);
    humGain = AC.createGain(); humGain.gain.value = 0;
    const lp = AC.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=900;
    humGain.connect(lp).connect(master);
    [[60,.5],[120,.28],[180,.1]].forEach(([f,g])=>{
      const o = AC.createOscillator(); o.type="sawtooth"; o.frequency.value=f;
      const og = AC.createGain(); og.gain.value=g;
      o.connect(og).connect(humGain); o.start();
    });
    // faint air noise
    const len = AC.sampleRate*2, buf = AC.createBuffer(1,len,AC.sampleRate), ch = buf.getChannelData(0);
    for(let i=0;i<len;i++) ch[i] = (Math.random()*2-1)*0.25;
    const src = AC.createBufferSource(); src.buffer=buf; src.loop=true;
    const nf = AC.createBiquadFilter(); nf.type="bandpass"; nf.frequency.value=400; nf.Q.value=.4;
    const ngn = AC.createGain(); ngn.gain.value=.12;
    src.connect(nf).connect(ngn).connect(humGain); src.start();
  }
  function setHum(on){
    humOn = on;
    if(on && !AC) buildHum();
    if(AC){ AC.resume(); humGain.gain.linearRampToValueAtTime(on? .055 : 0, AC.currentTime + .8); }
    soundBtn.textContent = "HUM: " + (on?"ON":"OFF");
    soundBtn.setAttribute("aria-pressed", on);
  }
  soundBtn.addEventListener("click", ()=> setHum(!humOn));
  function setVolume(v){
    _volume = Math.max(0, Math.min(1, v));
    if(master) master.gain.setTargetAtTime(_volume, AC.currentTime, 0.05);
  }
  function stepSfx(){
    if(!AC || !humOn) return;
    if(!stepBuf){
      const len = AC.sampleRate*0.14; stepBuf = AC.createBuffer(1,len,AC.sampleRate);
      const ch = stepBuf.getChannelData(0);
      for(let i=0;i<len;i++) ch[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2.4);
    }
    const s = AC.createBufferSource(); s.buffer = stepBuf;
    s.playbackRate.value = 0.85 + Math.random()*0.3;
    const f = AC.createBiquadFilter(); f.type="lowpass";
    f.frequency.value = 210 + Math.random()*160;
    const g = AC.createGain(); g.gain.value = 0.05 + Math.random()*0.03;
    s.connect(f).connect(g).connect(master); s.start();
  }
  function playGlitchSfx(){
    if(!AC) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type="square"; o.frequency.setValueAtTime(38, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, AC.currentTime+.15);
    o.frequency.exponentialRampToValueAtTime(24, AC.currentTime+1.4);
    g.gain.setValueAtTime(.12, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime+1.8);
    o.connect(g).connect(master); o.start(); o.stop(AC.currentTime+1.9);
  }

  /* --- game audio (exit whine guides you; drone means it is near) --- */
  function buildGameAudio(){
    if(gAudioReady || !AC) return; gAudioReady = true;
    whineGain = AC.createGain(); whineGain.gain.value = 0;
    whinePan = AC.createStereoPanner ? AC.createStereoPanner() : null;
    const wo = AC.createOscillator(); wo.type = "sine"; wo.frequency.value = 612;
    const lfo = AC.createOscillator(); lfo.frequency.value = 4.2;
    const lfoG = AC.createGain(); lfoG.gain.value = 7;
    lfo.connect(lfoG).connect(wo.frequency);
    if(whinePan) wo.connect(whineGain).connect(whinePan).connect(master);
    else wo.connect(whineGain).connect(master);
    wo.start(); lfo.start();
    droneGain = AC.createGain(); droneGain.gain.value = 0;
    const d1 = AC.createOscillator(); d1.type = "sine"; d1.frequency.value = 41;
    const d2 = AC.createOscillator(); d2.type = "sine"; d2.frequency.value = 47;
    d1.connect(droneGain); d2.connect(droneGain); droneGain.connect(master);
    d1.start(); d2.start();
  }
  function blipSfx(){
    if(!AC) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = "square"; o.frequency.setValueAtTime(760, AC.currentTime);
    o.frequency.setValueAtTime(1180, AC.currentTime + .07);
    g.gain.setValueAtTime(.05, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .18);
    o.connect(g).connect(master); o.start(); o.stop(AC.currentTime + .2);
  }
  function winSfx(){
    if(!AC) return;
    [[392,0],[523,.14],[659,.28]].forEach(([f,d])=>{
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, AC.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.08, AC.currentTime + d + .04);
      g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d + .9);
      o.connect(g).connect(master); o.start(AC.currentTime + d); o.stop(AC.currentTime + d + 1);
    });
  }

  /* --- breathing: looping band-passed noise whose level the engine drives per
     frame (louder + faster when running / low battery / the entity is near) --- */
  function buildBreathing(){
    if(breathReady || !AC) return; breathReady = true;
    const len = AC.sampleRate*2, buf = AC.createBuffer(1,len,AC.sampleRate), ch = buf.getChannelData(0);
    for(let i=0;i<len;i++) ch[i] = (Math.random()*2-1);
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 560; bp.Q.value = 0.8;
    breathGain = AC.createGain(); breathGain.gain.value = 0;
    src.connect(bp).connect(breathGain).connect(master); src.start();
  }
  function setBreath(level){
    if(breathGain) breathGain.gain.setTargetAtTime(Math.max(0, level), AC.currentTime, 0.03);
  }

  /* --- heartbeat: a low sine thump whose gain the engine pulses per frame
     (a lub-dub envelope) at a rate that climbs with fear --- */
  function buildHeart(){
    if(heartReady || !AC) return; heartReady = true;
    const osc = AC.createOscillator(); osc.type = "sine"; osc.frequency.value = 54;
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 120;
    heartGain = AC.createGain(); heartGain.gain.value = 0;
    osc.connect(lp).connect(heartGain).connect(master); osc.start();
  }
  function setHeart(level){
    if(heartGain) heartGain.gain.setTargetAtTime(Math.max(0, level), AC.currentTime, 0.01);
  }

  /* --- the entity's scream: a harsh noise burst swept through a band-pass, over a
     wailing saw tone that rises then collapses. Played when it spots you. --- */
  function scream(){
    if(!AC) return;
    const now = AC.currentTime;
    const len = Math.floor(AC.sampleRate * 1.15), buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
    for(let i=0;i<len;i++){
      const p = i/len, env = Math.pow(1-p, 0.55) * Math.min(1, p*24);
      ch[i] = (Math.random()*2-1) * env;
    }
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(300, now);
    bp.frequency.exponentialRampToValueAtTime(1900, now + 0.32);
    bp.frequency.exponentialRampToValueAtTime(400, now + 1.05);
    const ng = AC.createGain(); ng.gain.value = 0.2;
    src.connect(bp).connect(ng).connect(master); src.start(now);

    const o = AC.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(135, now);
    o.frequency.exponentialRampToValueAtTime(540, now + 0.28);
    o.frequency.exponentialRampToValueAtTime(85, now + 1.1);
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
    const og = AC.createGain();
    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime(0.15, now + 0.06);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    o.connect(lp).connect(og).connect(master); o.start(now); o.stop(now + 1.25);
  }

  /* --- a brief, band-passed "whisper" from a random direction (ambient scare) --- */
  function whisper(){
    if(!AC) return;
    const len = Math.floor(AC.sampleRate*0.6), buf = AC.createBuffer(1,len,AC.sampleRate), ch = buf.getChannelData(0);
    for(let i=0;i<len;i++){ const env = Math.sin(Math.PI*i/len); ch[i] = (Math.random()*2-1)*env*env; }
    const src = AC.createBufferSource(); src.buffer = buf;
    const bp = AC.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value = 1100 + Math.random()*700; bp.Q.value = 3.5;
    const g = AC.createGain(); g.gain.value = 0.055;
    const pan = AC.createStereoPanner ? AC.createStereoPanner() : null;
    if(pan){ pan.pan.value = Math.random()*2-1; src.connect(bp).connect(g).connect(pan).connect(master); }
    else src.connect(bp).connect(g).connect(master);
    src.start();
  }

  return {
    buildHum, setHum, setVolume, stepSfx, playGlitchSfx, buildGameAudio, blipSfx, winSfx,
    buildBreathing, setBreath, buildHeart, setHeart, whisper, scream,
    get AC(){ return AC; },
    get humOn(){ return humOn; },
    get gAudioReady(){ return gAudioReady; },
    get whineGain(){ return whineGain; },
    get whinePan(){ return whinePan; },
    get droneGain(){ return droneGain; },
  };
}
