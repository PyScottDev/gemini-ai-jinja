    /***************************************************************************
     * 2. SYNTHESIZED WEB AUDIO SOUND SYSTEM (Zero external dependencies)
     ***************************************************************************/
    const SoundFX = {
      ctx: null,
      muted: false,

      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      },

      toggleMute() {
        this.muted = !this.muted;
        const icon = document.getElementById('muteBtnIcon');
        if (icon) icon.textContent = this.muted ? '🔇' : '🔊';
        Game.saveProgress();
      },

      playTone(freq, type, duration, gainVal = 0.12, slideFreq = null) {
        if (this.muted) return;
        try {
          this.init();
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
          }
          gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
      },

      bell() {
        this.playTone(880, 'sine', 0.25, 0.12);
        setTimeout(() => this.playTone(1320, 'sine', 0.35, 0.1), 90);
      },

      stamp() {
        this.playTone(110, 'triangle', 0.16, 0.28, 45);
        setTimeout(() => this.playTone(75, 'square', 0.1, 0.15), 40);
      },

      printer() {
        this.playTone(320, 'sawtooth', 0.08, 0.08);
        setTimeout(() => this.playTone(390, 'sawtooth', 0.08, 0.08), 90);
        setTimeout(() => this.playTone(460, 'sawtooth', 0.12, 0.09), 180);
      },

      cash() {
        this.playTone(987.77, 'sine', 0.12, 0.14);
        setTimeout(() => this.playTone(1318.51, 'sine', 0.28, 0.15), 110);
      },

      buzzer() {
        this.playTone(155, 'sawtooth', 0.25, 0.16, 120);
        setTimeout(() => this.playTone(130, 'sawtooth', 0.3, 0.16), 160);
      },

      click() {
        this.playTone(540, 'sine', 0.05, 0.06);
      }
    };
