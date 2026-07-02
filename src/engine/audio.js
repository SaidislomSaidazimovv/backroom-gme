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

  return {
    buildHum, setHum, setVolume, stepSfx, playGlitchSfx, buildGameAudio, blipSfx, winSfx,
    get AC(){ return AC; },
    get humOn(){ return humOn; },
    get gAudioReady(){ return gAudioReady; },
    get whineGain(){ return whineGain; },
    get whinePan(){ return whinePan; },
    get droneGain(){ return droneGain; },
  };
}
