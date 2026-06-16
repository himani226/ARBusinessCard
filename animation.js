/* ═══════════════════════════════════════════════════
   MindSprout AR — animation.js
   All JavaScript: A-Frame components, TTS, typewriter,
   spring-in animations, AR event handling
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════
   CONFIG — edit speech text and links here
══════════════════════════════════════════ */
const WELCOME_MSG =
  "Hey! Welcome to MindSprout Technologies. " +
  "Now scan the logo of my company to " +
  "experience the magic!";

const SPEECH_TEXT =
  "Hi! " +
  "I'm your AR assistant, here to guide you " +
  "through our world of AR, AI, and digital innovation!";

const SPEECH_SPEED = 35;

/* ══════════════════════════════════════════
   COMPONENT — pinch-scale
   Pinch two fingers to zoom in/out on mobile.
   Scroll wheel to zoom on desktop.
   Applied to the #ar-content wrapper group.
══════════════════════════════════════════ */
AFRAME.registerComponent('pinch-scale', {
  schema: {
    min: { default: 0.3 },   // minimum scale limit
    max: { default: 3.0 },   // maximum scale limit
    speed: { default: 1.0 }    // sensitivity
  },

  init() {
    this.scaleFactor = 1.0;
    this.lastDist = null;

    // Bind handlers so removeEventListener works
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onWheel = this._onWheel.bind(this);

    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: true });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
    window.addEventListener('wheel', this._onWheel, { passive: true });
  },

  _getDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  _applyScale() {
    const s = this.scaleFactor;
    this.el.setAttribute('scale', `${s} ${s} ${s}`);
  },

  _onTouchStart(e) {
    if (e.touches.length === 2) {
      this.lastDist = this._getDist(e.touches);
    }
  },

  _onTouchMove(e) {
    if (e.touches.length !== 2 || this.lastDist === null) return;

    const dist = this._getDist(e.touches);
    const delta = dist / this.lastDist;
    this.lastDist = dist;

    this.scaleFactor = Math.min(
      this.data.max,
      Math.max(this.data.min, this.scaleFactor * delta * this.data.speed)
    );
    this._applyScale();
  },

  _onTouchEnd(e) {
    if (e.touches.length < 2) this.lastDist = null;
  },

  _onWheel(e) {
    // Desktop scroll wheel zoom
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    this.scaleFactor = Math.min(
      this.data.max,
      Math.max(this.data.min, this.scaleFactor * delta)
    );
    this._applyScale();
  },

  remove() {
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('wheel', this._onWheel);
  }
});

/* ══════════════════════════════════════════
   COMPONENT — counter-tilt
   Keeps ar-content upright regardless of
   the angle the card is held at.
   Add to #ar-content (child of #ar-target).
══════════════════════════════════════════ */
AFRAME.registerComponent('counter-tilt', {
  init() {
    this._euler = new THREE.Euler();
  },

  tick() {
    const parent = this.el.parentEl;
    if (!parent || !parent.object3D) return;

    // Read parent's (ar-target) rotation
    this._euler.setFromQuaternion(
      parent.object3D.quaternion,
      'YXZ'
    );

    // Apply inverse X and Z — content stays upright
    // Y is left at 0 so content faces the correct direction
    this.el.object3D.rotation.x = -this._euler.x;
    this.el.object3D.rotation.z = -this._euler.z;
  }
});

/* ══════════════════════════════════════════
   A-FRAME COMPONENT — procedural-talk
   Drives avatar bone animations while speaking
══════════════════════════════════════════ */
AFRAME.registerComponent('procedural-talk', {
  schema: { active: { default: false } },

  init() {
    this.bones = {};
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse(node => {
        const n = (node.name || '').toLowerCase();
        if (n.includes('head')) this.bones.head = node;
        if (n.includes('neck')) this.bones.neck = node;
        if (n.includes('l_upperarm') || n.includes('leftarm')) this.bones.lUp = node;
        if (n.includes('r_upperarm') || n.includes('rightarm')) this.bones.rUp = node;
        if (n.includes('l_forearm')) this.bones.lFo = node;
        if (n.includes('r_forearm')) this.bones.rFo = node;
      });
    });
  },

  tick(time) {
    if (!this.data.active) return;
    const t = time * 0.001;
    const b = this.bones;

    if (b.head) {
      b.head.rotation.x = Math.sin(t * 3.5) * 0.07 + Math.cos(t * 1.3) * 0.03;
      b.head.rotation.y = Math.sin(t * 1.2) * 0.08;
    }
    if (b.neck) {
      b.neck.rotation.x = Math.sin(t * 0.9) * 0.03;
      b.neck.rotation.y = Math.cos(t * 1.1) * 0.04;
    }
    if (b.lUp) {
      b.lUp.rotation.x = -0.5 + Math.sin(t * 2.1) * 0.18;
      b.lUp.rotation.z = -0.3 + Math.cos(t * 1.6) * 0.12;
    }
    if (b.rUp) {
      b.rUp.rotation.x = -0.5 + Math.cos(t * 2.0) * 0.18;
      b.rUp.rotation.z = 0.3 + Math.sin(t * 1.8) * 0.12;
    }
    if (b.lFo) b.lFo.rotation.y = Math.sin(t * 2.9) * 0.22;
    if (b.rFo) b.rFo.rotation.y = -Math.cos(t * 2.6) * 0.22;
  }
});

/* ══════════════════════════════════════════
   AUDIO — scan detection beep
══════════════════════════════════════════ */
function playScanBeep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const gain = ctx.createGain();

    o1.type = 'sine';
    o1.frequency.setValueAtTime(440, ctx.currentTime);
    o1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);

    o2.type = 'triangle';
    o2.frequency.setValueAtTime(220, ctx.currentTime);
    o2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    o1.connect(gain); o2.connect(gain); gain.connect(ctx.destination);
    o1.start(); o2.start();
    o1.stop(ctx.currentTime + 0.4);
    o2.stop(ctx.currentTime + 0.4);
  } catch (e) { }
}

/* ══════════════════════════════════════════
   TEXT-TO-SPEECH
══════════════════════════════════════════ */
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.0;
  utt.pitch = 1.1;
  utt.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0];
  if (voice) utt.voice = voice;

  window.speechSynthesis.speak(utt);
}

/* ══════════════════════════════════════════
   TYPEWRITER EFFECT
══════════════════════════════════════════ */
let _twTimer = null;

function typewrite(text, elId, speed) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (_twTimer) clearTimeout(_twTimer);

  el.innerHTML = '<span class="sb-cursor"></span>';
  let i = 0;

  function tick() {
    if (i < text.length) {
      el.innerHTML = text.slice(0, ++i) + '<span class="sb-cursor"></span>';
      _twTimer = setTimeout(tick, speed);
    } else {
      el.innerHTML = text;
    }
  }
  tick();
}

/* ══════════════════════════════════════════
   SPRING-IN — A-Frame entity scale animation
══════════════════════════════════════════ */
function springIn(elId, targetScale, delay) {
  setTimeout(() => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.setAttribute('animation__si', {
      property: 'scale',
      to: targetScale,
      dur: 700,
      easing: 'easeOutElastic',
      elasticity: 380
    });
  }, delay);
}

/* ══════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════ */
function showToast() {
  const toast = document.getElementById('toast');
  toast.style.display = 'block';
  requestAnimationFrame(() =>
    requestAnimationFrame(() => toast.classList.add('show'))
  );
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.style.display = 'none', 500);
  }, 2500);
}

/* ══════════════════════════════════════════
   VIDEO AUTOPLAY
══════════════════════════════════════════ */
function tryPlayVideo() {
  const vid = document.getElementById('panelVideo');
  if (vid) {
    vid.muted = true;
    vid.play().catch(() => { });
  }
}

/* ══════════════════════════════════════════
   SOCIAL DOCK — slide up + stagger buttons
══════════════════════════════════════════ */
function showSocialDock() {
  const dock = document.getElementById('social-dock');
  dock.style.display = 'flex';

  requestAnimationFrame(() =>
    requestAnimationFrame(() => dock.classList.add('show'))
  );

  // Stagger each button's pop-in
  const btnIds = ['soc-li', 'soc-wa', 'soc-ig', 'soc-web'];
  btnIds.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.style.animationDelay = '0s';
        el.classList.add('pop');
      }
    }, i * 140);
  });
}

/* ══════════════════════════════════════════
   MAIN — runs after DOM is fully parsed
   Wrapped in DOMContentLoaded so the script
   can safely live in <head> without errors.
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  let detected = false;

  const huds = ['h1', 'h2', 'h3', 'h4'].map(id => document.getElementById(id));
  const overlay = document.getElementById('scan-overlay');
  const bubble = document.getElementById('speech-bubble');
  const arTarget = document.getElementById('ar-target');
  const scene = document.querySelector('a-scene');

  /* ══════════════════════════════════════════
   WELCOME SCREEN — runs on page load
══════════════════════════════════════════ */
  /* ── Define startMindAR FIRST, before anything calls it ── */
  function startMindAR() {
    window.speechSynthesis && window.speechSynthesis.cancel();

    const ws = document.getElementById('welcome-screen');
    ws.classList.add('hide');
    setTimeout(() => ws.style.display = 'none', 700);

    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
      scene.systems['mindar-image-system'].start();
    } else {
      scene.addEventListener('loaded', () => {
        scene.systems['mindar-image-system'].start();
      }, { once: true });
    }

    const scanOverlay = document.getElementById('scan-overlay');
    scanOverlay.style.display = 'flex';
    scanOverlay.style.opacity = '1';
  }

  document.getElementById('ws-btn')
    .addEventListener('click', startMindAR);

  const wsText = document.getElementById('ws-text');
  const wsBtn = document.getElementById('ws-btn');
  const wsHint = document.getElementById('ws-hint');

  // Start typewriter + TTS for welcome message
  typewrite(WELCOME_MSG, 'ws-text', SPEECH_SPEED);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const wsUtt = new SpeechSynthesisUtterance(WELCOME_MSG);
    wsUtt.rate = 1.0;
    wsUtt.pitch = 1.1;
    wsUtt.volume = 1;

    // When speech ends → show Scan button
    wsUtt.onend = () => {
      wsHint.textContent = 'Tap the button when ready';
      wsBtn.style.display = 'block';
    };

    // Pre-load voices then speak
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v =>
        v.lang.startsWith('en') && v.name.includes('Google'))
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0];
      if (voice) wsUtt.voice = voice;
      window.speechSynthesis.speak(wsUtt);
    };

    if (window.speechSynthesis.getVoices().length) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    }
  }

  /* ── AR target found ── */
  arTarget.addEventListener('targetFound', () => {
    // Light up HUD corners
    huds.forEach(h => h.classList.add('on'));

    // Only trigger once
    if (detected) return;
    detected = true;

    // 1. Beep + video
    playScanBeep();
    tryPlayVideo();

    // 2. Fade out scan overlay
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 600);

    // 3. Toast
    showToast();

    // 4. A-Frame spring-ins (staggered)
    springIn('avatar-grp', '1 1 1', 200);
    springIn('panel-left', '1 1 1', 550);
    springIn('panel-right', '1 1 1', 750);

    // 5. Social dock
    setTimeout(showSocialDock, 950);

    // 6. Enable procedural bone animation
    setTimeout(() => {
      const mesh = document.getElementById('avatar-mesh');
      if (mesh) mesh.setAttribute('procedural-talk', 'active', true);
    }, 300);

    // 7. Speech bubble + TTS
    setTimeout(() => {
      bubble.style.display = 'block';
      requestAnimationFrame(() =>
        requestAnimationFrame(() => bubble.classList.add('show'))
      );
      typewrite(SPEECH_TEXT, 'sb-text', SPEECH_SPEED);
      speak(SPEECH_TEXT);
    }, 700);
  });

  /* ── AR target lost ── */
  arTarget.addEventListener('targetLost', () => {
    // Dim HUD corners — keep everything else visible
    huds.forEach(h => h.classList.remove('on'));
    // Keep all 3D content visible after first detection
    if (detected) {
      requestAnimationFrame(() => {
        arTarget.object3D.visible = true;
      });
    }
  });

  /* ── A-Frame scene loaded ── */
  scene.addEventListener('loaded', () => {
    // Pre-fetch TTS voices
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  });



}); // end DOMContentLoaded