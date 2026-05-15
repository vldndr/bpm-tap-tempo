class BpmTapTempo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const template = document.getElementById('bpm-tap-tempo-template');
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.taps         = [];
    this.bpm          = 120;
    this.isPlaying    = false;
    this.audioCtx     = null;
    this.nextNoteTime = 0;
    this.timerID      = null;
    this._beatIndex   = 0;
    this._beatCount   = 4;   
    this._timeSig     = '4/4';

    // Pendulum state
    this._pendulumAngle    = 0;
    this._pendulumDir      = 1;
    this._pendulumRAF      = null;
    this._pendulumLastTime = null;

    // DRY DOM Queries: Automatically assign elements with an ID to `this`
    this.shadowRoot.querySelectorAll('[id]').forEach(el => {
      const camelName = el.id.replace(/-([a-z])/g, g => g[1].toUpperCase());
      this[camelName] = el;
    });

    this.handleTap       = this.handleTap.bind(this);
    this.handleKeydown   = this.handleKeydown.bind(this);
    this.toggleMetronome = this.toggleMetronome.bind(this);
    this.scheduler       = this.scheduler.bind(this);
    this.handleSlider    = this.handleSlider.bind(this);
    this._animatePendulum = this._animatePendulum.bind(this);
  }

  static get observedAttributes() {
    return ['theme', 'min-bpm', 'max-bpm', 'bpm', 'time-sig'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'bpm') {
      const v = parseInt(newVal);
      if (!isNaN(v)) { this.bpm = this._clamp(v); this._syncUI('attribute'); }
    }
    if (name === 'min-bpm' || name === 'max-bpm') {
      if (this.bpmSlider) {
        this.bpmSlider.min = this.getAttribute('min-bpm') || 40;
        this.bpmSlider.max = this.getAttribute('max-bpm') || 300;
      }
      this.bpm = this._clamp(this.bpm);
      this._syncUI();
    }
    if (name === 'time-sig') {
      this._applyTimeSig(newVal);
    }
  }

  connectedCallback() {
    const min        = parseInt(this.getAttribute('min-bpm')) || 40;
    const max        = parseInt(this.getAttribute('max-bpm')) || 300;
    const initialBpm = parseInt(this.getAttribute('bpm'))     || 120;
    const initialSig = this.getAttribute('time-sig')          || '4/4';

    this.bpmSlider.min   = min;
    this.bpmSlider.max   = max;
    this.bpmSlider.value = initialBpm;
    this.bpm             = this._clamp(initialBpm);

    this._buildTimeSigButtons();
    this._applyTimeSig(initialSig);
    this._syncUI();

    this.tapBtn.addEventListener('mousedown',  this.handleTap);
    this.tapBtn.addEventListener('touchstart', this.handleTap, { passive: true });
    this.toggleBtn.addEventListener('click', this.toggleMetronome);
    this.bpmSlider.addEventListener('input', this.handleSlider);
    window.addEventListener('keydown', this.handleKeydown);
  }

  disconnectedCallback() {
    this.tapBtn.removeEventListener('mousedown',  this.handleTap);
    this.tapBtn.removeEventListener('touchstart', this.handleTap);
    this.toggleBtn.removeEventListener('click', this.toggleMetronome);
    this.bpmSlider.removeEventListener('input', this.handleSlider);
    window.removeEventListener('keydown', this.handleKeydown);
    if (this.timerID)      cancelAnimationFrame(this.timerID);
    if (this._pendulumRAF) cancelAnimationFrame(this._pendulumRAF);
  }

  // === Time Signature ===
  _buildTimeSigButtons() {
    const sigs = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8'];
    this.timesigRow.innerHTML = '';
    sigs.forEach(sig => {
      const btn = document.createElement('button');
      btn.className = 'timesig-btn';
      btn.textContent = sig;
      btn.dataset.sig = sig;
      btn.addEventListener('click', () => this._applyTimeSig(sig));
      this.timesigRow.appendChild(btn);
    });
  }

  _applyTimeSig(sig) {
    const parts  = sig.split('/');
    const num    = parseInt(parts[0]);
    this._timeSig   = sig;
    this._beatCount = num;
    this._beatIndex = 0;

    this.timesigRow.querySelectorAll('.timesig-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.sig === sig);
    });

    this._buildBeatDots();
    this._dispatch('timesig-change', { timeSig: sig, beats: num });
  }

  _buildBeatDots() {
    this.beatRow.innerHTML = '';
    for (let i = 0; i < this._beatCount; i++) {
      const d = document.createElement('div');
      d.className = 'beat-dot';
      this.beatRow.appendChild(d);
    }
  }

  get _beatDots() {
    return Array.from(this.beatRow.querySelectorAll('.beat-dot'));
  }

  // === Tap ===
  handleTap() {
    this._ensureAudioContext();
    const now  = Date.now();
    const last = this.taps.at(-1);
    
    // Reset taps if too much time has passed
    if (last && now - last > 2000) this.taps = [];
    this.taps.push(now);
    if (this.taps.length > 8) this.taps.shift();

    if (this.taps.length >= 2) {
      // Sum of differences is last - first
      const totalDuration = this.taps.at(-1) - this.taps[0];
      const avg = totalDuration / (this.taps.length - 1);
      
      this.bpm = this._clamp(Math.round(60000 / avg));
      this._syncUI('tap');
      this._emitBpmChange('tap');
    }
    this.visualFlash();
  }

  handleKeydown(e) {
    if ((e.code === 'Space' || e.code === 'Enter') &&
        !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      this.handleTap();
    }
  }

  // === Slider ===
  handleSlider() {
    this.taps = [];
    this.bpm  = parseInt(this.bpmSlider.value);
    this._syncUI('slider');
    this._emitBpmChange('slider');
    if (this.isPlaying) this._restartPendulum();
  }

  // === Metronome ===
  toggleMetronome() {
    this._ensureAudioContext();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.toggleBtn.textContent = 'Stop';
      this.toggleBtn.classList.add('active');
      this._beatIndex   = 0;
      this.nextNoteTime = this.audioCtx.currentTime + 0.1;
      this.scheduler();
      this._startPendulum();
      this._dispatch('metronome-start', { bpm: this.bpm });
    } else {
      this.toggleBtn.textContent = 'Start Metronome';
      this.toggleBtn.classList.remove('active');
      cancelAnimationFrame(this.timerID);
      this.timerID = null;
      this._stopPendulum();
      this._dispatch('metronome-stop', { bpm: this.bpm });
    }
  }

  scheduler() {
    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      this.playTick(this.nextNoteTime, this._beatIndex);
      this._beatIndex = (this._beatIndex + 1) % this._beatCount;
      this.nextNoteTime += 60.0 / this.bpm;
    }
    this.timerID = requestAnimationFrame(this.scheduler);
  }

  playTick(time, beatIndex) {
    const osc  = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.frequency.value = beatIndex === 0 ? 1200 : 900;
    gain.gain.setValueAtTime(beatIndex === 0 ? 0.8 : 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.start(time);
    osc.stop(time + 0.1);

    const delay = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
    const cb    = beatIndex;
    setTimeout(() => {
      this.visualFlash(cb);
      this._lightBeatDot(cb);
      this._dispatch('metronome-tick', { bpm: this.bpm, beat: cb });
    }, delay);
  }

  // === Pendulum ===
  _startPendulum() {
    if (this._pendulumRAF) cancelAnimationFrame(this._pendulumRAF);
    this._pendulumLastTime = null;
    this._pendulumAngle   = -28;
    this._pendulumDir     = 1;
    this._pendulumRAF = requestAnimationFrame(this._animatePendulum);
  }

  _stopPendulum() {
    if (this._pendulumRAF) cancelAnimationFrame(this._pendulumRAF);
    this._pendulumRAF = null;
    const arm = this.pendulumSvg && this.pendulumSvg.getElementById('pendulum-arm');
    if (arm) arm.setAttribute('transform', 'rotate(0, 90, 20)');
  }

  _restartPendulum() {
    if (this.isPlaying) { this._stopPendulum(); this._startPendulum(); }
  }

  _animatePendulum(ts) {
    if (!this._pendulumLastTime) this._pendulumLastTime = ts;
    const dt = (ts - this._pendulumLastTime) / 1000;
    this._pendulumLastTime = ts;

    const beatSec   = 60 / this.bpm;
    const degreesPerSec = 56 / (beatSec / 2); 
    this._pendulumAngle += this._pendulumDir * degreesPerSec * dt;

    if (this._pendulumAngle >= 28)  { this._pendulumAngle = 28;  this._pendulumDir = -1; }
    if (this._pendulumAngle <= -28) { this._pendulumAngle = -28; this._pendulumDir =  1; }

    const arm = this.pendulumSvg && this.pendulumSvg.getElementById('pendulum-arm');
    if (arm) arm.setAttribute('transform', `rotate(${this._pendulumAngle.toFixed(2)}, 90, 20)`);

    this._pendulumRAF = requestAnimationFrame(this._animatePendulum);
  }

  // === UI Helpers ===
  _syncUI(source) {
    this.display.textContent   = this.bpm;
    this.bpmSlider.value       = this.bpm;
    this.sliderVal.textContent = this.bpm;
    this.tempoName.textContent = this._tempoLabel(this.bpm);
    
    const bpmText = this.pendulumSvg && this.pendulumSvg.getElementById('pendulum-bpm');
    if (bpmText) bpmText.textContent = this.bpm;
    const tempoText = this.pendulumSvg && this.pendulumSvg.getElementById('pendulum-tempo');
    if (tempoText) tempoText.textContent = this._tempoLabel(this.bpm);
    
    if (source) this._dispatch('bpm-set', { bpm: this.bpm, source });
  }

  visualFlash() {
    this.wrapper.classList.remove('flash');
    void this.wrapper.offsetWidth;
    this.wrapper.classList.add('flash');
    setTimeout(() => this.wrapper.classList.remove('flash'), 150);
  }

  _lightBeatDot(index) {
    const dots = this._beatDots;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    setTimeout(() => { if (dots[index]) dots[index].classList.remove('active'); }, 120);
  }

  _tempoLabel(bpm) {
    if (bpm < 60)  return 'Larghissimo';
    if (bpm < 66)  return 'Largo';
    if (bpm < 76)  return 'Adagio';
    if (bpm < 108) return 'Andante';
    if (bpm < 120) return 'Moderato';
    if (bpm < 156) return 'Allegro';
    if (bpm < 176) return 'Vivace';
    if (bpm < 200) return 'Presto';
    return 'Prestissimo';
  }

  // === Events ===
  _dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  _emitBpmChange(source) {
    this._dispatch('bpm-change', { bpm: this.bpm });
    this._dispatch('bpm-set',    { bpm: this.bpm, source });
  }

  // === Utils ===
  _clamp(val) {
    const min = parseInt(this.getAttribute('min-bpm')) || 40;
    const max = parseInt(this.getAttribute('max-bpm')) || 300;
    return Math.max(min, Math.min(max, val));
  }

  _ensureAudioContext() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }
}

customElements.define('bpm-tap-tempo', BpmTapTempo);