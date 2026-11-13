/**
 * neural-canvas.js
 * Renders an animated neural network background on the homepage hero.
 * Simulates neurons firing with synaptic connections.
 */

(function () {
  'use strict';

  const NEURON_COUNT = 60;
  const CONNECTION_DIST = 150;
  const CLUSTER_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#eab308', '#94a3b8'];

  let canvas, ctx, neurons = [], raf;
  let W, H;

  function Neuron(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r  = 2 + Math.random() * 2;
    this.color = CLUSTER_COLORS[Math.floor(Math.random() * CLUSTER_COLORS.length)];
    this.firing = false;
    this.fireTimer = 0;
    this.fireCooldown = 60 + Math.floor(Math.random() * 120);
    this.nextFire = this.fireCooldown;
  }

  Neuron.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
    this.x = Math.max(0, Math.min(W, this.x));
    this.y = Math.max(0, Math.min(H, this.y));

    this.fireTimer++;
    if (this.fireTimer >= this.nextFire) {
      this.firing = true;
      this.fireTimer = 0;
      this.nextFire = this.fireCooldown + Math.floor(Math.random() * 60);
    } else {
      this.firing = false;
    }
  };

  Neuron.prototype.draw = function () {
    ctx.save();
    const glow = this.firing ? 12 : 4;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = glow;
    ctx.fillStyle   = this.firing ? this.color : hexWithAlpha(this.color, 0.6);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.firing ? this.r * 1.6 : this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  function hexWithAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function drawConnections() {
    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        const a = neurons[i], b = neurons[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
          const firing = a.firing || b.firing;
          ctx.save();
          ctx.strokeStyle = firing
            ? hexWithAlpha(a.color, alpha * 3)
            : hexWithAlpha('#818cf8', alpha);
          ctx.lineWidth = firing ? 1.5 : 0.5;
          ctx.shadowColor = firing ? a.color : 'transparent';
          ctx.shadowBlur  = firing ? 6 : 0;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    neurons.forEach(n => { n.update(); n.draw(); });
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function init() {
    const hero = document.querySelector('.neural-canvas-host');
    if (!hero) return;

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    hero.style.position = 'relative';
    hero.insertBefore(canvas, hero.firstChild);

    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    neurons = Array.from({ length: NEURON_COUNT }, () =>
      new Neuron(Math.random() * W, Math.random() * H));

    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  // Run on page load and after navigation (MkDocs instant navigation)
  function bootstrap() {
    init();
    document.addEventListener('DOMContentLoaded', init);

    // Material instant navigation
    document.addEventListener('DOMContentSwitch', () => {
      if (raf) cancelAnimationFrame(raf);
      neurons = [];
      init();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
