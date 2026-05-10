/* =====================================================
   星空粒子动效 — Spellverse 风格
   粒子星空 · 流星 · 鼠标视差 · 英雄区浮动
   ===================================================== */

(function () {
  'use strict';

  /* ---------- Canvas 初始化 ---------- */
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ---------- 星星 ---------- */
  class Star {
    constructor() { this.init(); }

    init() {
      this.x     = Math.random() * W;
      this.y     = Math.random() * H;
      this.baseX = this.x;
      this.baseY = this.y;
      this.r     = Math.random() * 1.6 + 0.3;
      // parallax 深度：越小越远，移动越慢
      this.depth = Math.random() * 0.6 + 0.1;
      this.twinkleSpeed  = Math.random() * 0.03 + 0.008;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      // 颜色在金色/冰蓝/白三种里随机
      const palette = [
        [245, 200, 66],   // gold
        [127, 179, 211],  // mist/lake
        [220, 232, 245],  // text/white
      ];
      this.rgb = palette[Math.floor(Math.random() * palette.length)];
    }

    update(t) {
      // 闪烁
      this.alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * this.twinkleSpeed + this.twinkleOffset));
      // 鼠标视差
      const cx = W / 2, cy = H / 2;
      const dx = (mouse.x - cx) * this.depth * 0.03;
      const dy = (mouse.y - cy) * this.depth * 0.03;
      this.x = this.baseX - dx;
      this.y = this.baseY - dy;
    }

    draw() {
      const [r, g, b] = this.rgb;
      // 光晕
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${(this.alpha * 0.8).toFixed(2)})`);
      grd.addColorStop(0.4, `rgba(${r},${g},${b},${(this.alpha * 0.2).toFixed(2)})`);
      grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      // 核心亮点
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha.toFixed(2)})`;
      ctx.fill();
    }
  }

  /* ---------- 流星 ---------- */
  class Meteor {
    constructor() { this.cooldown(); }

    cooldown() {
      this.active  = false;
      this.wait    = 3000 + Math.random() * 6000;
      this.elapsed = 0;
    }

    activate() {
      this.active  = true;
      // 从顶部随机位置出发，斜向右下
      this.x = Math.random() * W * 0.7;
      this.y = Math.random() * H * 0.3;
      this.vx = 8 + Math.random() * 6;
      this.vy = this.vx * (0.3 + Math.random() * 0.3);
      this.len  = 100 + Math.random() * 120;
      this.life = 1.0;
    }

    update(dt) {
      if (!this.active) {
        this.elapsed += dt;
        if (this.elapsed >= this.wait) this.activate();
        return;
      }
      this.x    += this.vx;
      this.y    += this.vy;
      this.life -= 0.025;
      if (this.life <= 0 || this.x > W || this.y > H) this.cooldown();
    }

    draw() {
      if (!this.active) return;
      const tailX = this.x - this.vx / Math.hypot(this.vx, this.vy) * this.len;
      const tailY = this.y - this.vy / Math.hypot(this.vx, this.vy) * this.len;
      const grd = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
      grd.addColorStop(0,   `rgba(245,200,66,${this.life.toFixed(2)})`);
      grd.addColorStop(0.3, `rgba(200,220,245,${(this.life * 0.5).toFixed(2)})`);
      grd.addColorStop(1,   'rgba(200,220,245,0)');
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  /* ---------- 浮动粒子（大光斑） ---------- */
  class FloatOrb {
    constructor() { this.init(); }

    init() {
      this.x     = Math.random() * W;
      this.y     = Math.random() * H;
      this.r     = 60 + Math.random() * 120;
      this.alpha = 0.02 + Math.random() * 0.04;
      this.dx    = (Math.random() - 0.5) * 0.3;
      this.dy    = (Math.random() - 0.5) * 0.3;
      this.pulse = Math.random() * Math.PI * 2;
    }

    update(t) {
      this.x += this.dx;
      this.y += this.dy;
      if (this.x < -this.r) this.x = W + this.r;
      if (this.x > W + this.r) this.x = -this.r;
      if (this.y < -this.r) this.y = H + this.r;
      if (this.y > H + this.r) this.y = -this.r;
      this.currentAlpha = this.alpha * (0.6 + 0.4 * Math.sin(t * 0.008 + this.pulse));
    }

    draw() {
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      grd.addColorStop(0,   `rgba(42,74,138,${this.currentAlpha.toFixed(3)})`);
      grd.addColorStop(0.5, `rgba(26,26,78,${(this.currentAlpha * 0.5).toFixed(3)})`);
      grd.addColorStop(1,   'rgba(10,10,46,0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  /* ---------- 场景对象 ---------- */
  let stars   = [];
  let meteors = [];
  let orbs    = [];

  function initScene() {
    resize();
    stars   = Array.from({ length: 220 }, () => new Star());
    meteors = Array.from({ length: 4  }, () => new Meteor());
    orbs    = Array.from({ length: 6  }, () => new FloatOrb());
  }

  /* ---------- 主循环 ---------- */
  let t    = 0;
  let last = 0;

  function loop(now) {
    const dt = now - last;
    last = now;
    t   += 1;

    ctx.clearRect(0, 0, W, H);

    orbs.forEach(o => { o.update(t); o.draw(); });
    stars.forEach(s => { s.update(t); s.draw(); });
    meteors.forEach(m => { m.update(dt); m.draw(); });

    requestAnimationFrame(loop);
  }

  /* ---------- 鼠标平滑跟随 ---------- */
  window.addEventListener('mousemove', e => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  // 平滑插值
  (function smoothMouse() {
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;
    requestAnimationFrame(smoothMouse);
  })();

  /* ---------- Resize ---------- */
  window.addEventListener('resize', () => {
    resize();
    stars.forEach(s => {
      s.baseX = s.x = Math.random() * W;
      s.baseY = s.y = Math.random() * H;
    });
    orbs.forEach(o => o.init());
  }, { passive: true });

  /* ---------- 启动 ---------- */
  initScene();
  requestAnimationFrame(loop);

})();
