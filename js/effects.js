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
     4. 作品筛选网格
     ===================================================== */
  const filterBtns   = [...document.querySelectorAll('.filter-btn')];
  const workItems    = [...document.querySelectorAll('.work-item')];
  const visibleCount = document.getElementById('visibleCount');

  if (!filterBtns.length || !workItems.length) return;

  function updateCount() {
    const n = workItems.filter(el => !el.classList.contains('wf-hidden') && !el.classList.contains('wf-gone')).length;
    if (visibleCount) visibleCount.textContent = n;
  }

  function filterWorks(cat) {
    workItems.forEach(item => {
      const match = cat === 'all' || item.dataset.category === cat;

      if (match) {
        item.classList.remove('wf-gone');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => item.classList.remove('wf-hidden'));
        });
      } else {
        item.classList.add('wf-hidden');
        setTimeout(() => {
          if (item.classList.contains('wf-hidden')) item.classList.add('wf-gone');
        }, 350);
      }
    });

    setTimeout(() => {
      updateCount();
      if (window._worksHScrollRecalc) window._worksHScrollRecalc();
    }, 380);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterWorks(btn.dataset.filter);
    });
  });

  /* 光标状态 */
  workItems.forEach(item => {
    item.addEventListener('mouseenter', () => document.body.classList.add('cur-card'));
    item.addEventListener('mouseleave', () => document.body.classList.remove('cur-card'));
  });

  /* =====================================================
     5. 横向滚动（仅桌面端）
     ===================================================== */
  (function setupHorizontalScroll() {
    if (window.innerWidth < 768) return;

    const section = document.getElementById('works');
    const grid    = document.querySelector('.works-grid-v2');
    if (!section || !grid) return;

    /* 注入进度条 */
    const bar  = document.createElement('div');
    bar.className = 'works-hscroll-bar';
    const fill = document.createElement('div');
    fill.className = 'works-hscroll-fill';
    bar.appendChild(fill);
    section.querySelector('.works-inner').appendChild(bar);

    let maxT = 0;

    function recalc() {
      if (window.innerWidth < 768) return;
      /* 重置位置以正确测量 */
      grid.style.transform = 'translateX(0)';

      requestAnimationFrame(() => {
        const items = [...grid.querySelectorAll('.work-item:not(.wf-gone)')];
        if (!items.length) { section.style.height = ''; return; }

        const gapPx = 8;
        const padPx = 128; /* 4rem × 2 */
        const totalW = items.reduce((s, el) => s + el.offsetWidth + gapPx, 0) - gapPx + padPx;
        maxT = Math.max(0, totalW - window.innerWidth);
        section.style.height = (maxT + window.innerHeight) + 'px';
        update();
      });
    }

    function update() {
      if (window.innerWidth < 768) return;
      const scrolled = window.scrollY - section.offsetTop;
      const t = Math.max(0, Math.min(maxT, scrolled));
      grid.style.transform = `translateX(-${t}px)`;
      fill.style.width = (maxT > 0 ? (t / maxT * 100).toFixed(2) : 0) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        section.style.height = '';
        grid.style.transform = '';
        return;
      }
      recalc();
    });

    /* 暴露给 filterWorks 调用 */
    window._worksHScrollRecalc = recalc;

    recalc();
  })();

})();
