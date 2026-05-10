/* =====================================================
   高级视觉效果
   预加载 · 噪点纹理 · 文字乱码 · 作品列表悬浮预览
   ===================================================== */

(function () {
  'use strict';

  /* =====================================================
     1. 预加载
     ===================================================== */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const t0 = Date.now();

    function hidePreloader() {
      preloader.classList.add('pl-hide');
      setTimeout(() => preloader.remove(), 920);
    }

    window.addEventListener('load', () => {
      /* 至少展示 1700ms，让动画跑完 */
      const wait = Math.max(0, 1700 - (Date.now() - t0));
      setTimeout(hidePreloader, wait);
    });

    /* 兜底：4s 强制退出（网络慢时保障） */
    setTimeout(hidePreloader, 4000);
  }

  /* =====================================================
     2. 噪点纹理（Canvas 生成，保证跨浏览器一致）
     ===================================================== */
  (function addGrain() {
    const size = 256;
    const cv   = document.createElement('canvas');
    cv.width   = cv.height = size;
    const cx   = cv.getContext('2d');
    const img  = cx.createImageData(size, size);
    const d    = img.data;

    for (let i = 0; i < d.length; i += 4) {
      const v  = Math.random() * 255 | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);

    const el = document.createElement('div');
    el.className = 'noise-overlay';
    el.style.backgroundImage = `url(${cv.toDataURL()})`;
    document.body.appendChild(el);
  })();

  /* =====================================================
     3. 文字乱码效果（适配中文导航）
     ===================================================== */
  const POOL = '光影笔画色线形象美術創作視覺江山霜月千里';

  class Scrambler {
    constructor(el) {
      this.el       = el;
      this.original = el.textContent.trim();
      this.timer    = null;
    }

    scramble() {
      clearInterval(this.timer);
      let frame = 0;
      const len         = this.original.length;
      const totalFrames = len * 7 + 12;

      this.timer = setInterval(() => {
        const resolved = Math.floor(frame / totalFrames * len);

        this.el.textContent = [...this.original].map((ch, i) => {
          /* 保留空格和破折号 */
          if (ch === ' ' || ch === '—' || ch === '-') return ch;
          if (i < resolved) return this.original[i];
          return POOL[Math.random() * POOL.length | 0];
        }).join('');

        if (++frame > totalFrames) {
          clearInterval(this.timer);
          this.el.textContent = this.original;
        }
      }, 32);
    }

    reset() {
      clearInterval(this.timer);
      this.el.textContent = this.original;
    }
  }

  /* 应用到导航链接 */
  document.querySelectorAll('.nav-links a').forEach(link => {
    const s = new Scrambler(link);
    link.addEventListener('mouseenter', () => s.scramble());
    link.addEventListener('mouseleave', () => s.reset());
  });

  /* 应用到品牌名 */
  const brand = document.querySelector('.nav-brand');
  if (brand) {
    const s = new Scrambler(brand);
    brand.addEventListener('mouseenter', () => s.scramble());
    brand.addEventListener('mouseleave', () => s.reset());
  }

  /* =====================================================
     4. 作品列表 + 悬浮图片预览
     ===================================================== */
  const cards     = [...document.querySelectorAll('.work-card')];
  const worksGrid = document.querySelector('.works-grid');
  const worksInner = document.querySelector('.works-inner');

  if (!cards.length || !worksGrid || !worksInner) return;

  /* --- 构建列表 --- */
  const list = document.createElement('div');
  list.className = 'works-list';
  list.setAttribute('role', 'list');

  cards.forEach((card, i) => {
    const thumb = card.querySelector('.work-thumb');
    const title = card.querySelector('.work-title');

    const item = document.createElement('div');
    item.className = 'wl-item';
    item.dataset.idx = i;
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', title ? title.textContent : `作品 ${i + 1}`);

    item.innerHTML =
      `<span class="wl-num">${String(i + 1).padStart(2, '0')}</span>` +
      `<span class="wl-title-text">${title ? title.textContent : ''}</span>` +
      `<span class="wl-arrow">&#8594;</span>`;

    /* 缓存缩略图背景色，供预览卡片使用 */
    item._bg = thumb
      ? (thumb.style.backgroundColor || thumb.style.background || '#1a2a4a')
      : '#1a2a4a';

    list.appendChild(item);
  });

  /* 插到标题下方，隐藏原网格（lightbox 逻辑仍依赖原 card 节点） */
  worksInner.insertBefore(list, worksGrid);
  worksGrid.style.display = 'none';

  /* --- 悬浮预览 --- */
  const preview = document.createElement('div');
  preview.id = 'works-preview';
  const wpInner = document.createElement('div');
  wpInner.className = 'wp-inner';
  preview.appendChild(wpInner);
  document.body.appendChild(preview);

  /* 平滑跟随位置（插值动画） */
  let px = -400, py = -400;
  let tx = -400, ty = -400;

  (function trackPreview() {
    px += (tx - px) * 0.09;
    py += (ty - py) * 0.09;
    preview.style.left = px + 'px';
    preview.style.top  = py + 'px';
    requestAnimationFrame(trackPreview);
  })();

  list.querySelectorAll('.wl-item').forEach(item => {
    item.addEventListener('mouseenter', e => {
      wpInner.style.backgroundColor = item._bg;
      preview.classList.add('active');
      tx = e.clientX + 28;
      ty = e.clientY - 145;
      document.body.classList.add('cur-card');
    });

    item.addEventListener('mousemove', e => {
      tx = e.clientX + 28;
      ty = e.clientY - 145;
    });

    item.addEventListener('mouseleave', () => {
      preview.classList.remove('active');
      document.body.classList.remove('cur-card');
    });

    /* 点击 → 触发对应卡片的 lightbox */
    item.addEventListener('click', () => {
      cards[parseInt(item.dataset.idx)]?.click();
    });

    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cards[parseInt(item.dataset.idx)]?.click();
      }
    });
  });

})();
