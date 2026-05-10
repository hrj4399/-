/* =====================================================
   交互升级
   光标 · 磁吸按钮 · 3D卡片倾斜 · 灯箱导航 · 进度条 · 打字机
   ===================================================== */

(function () {
  'use strict';

  const isTouch = () => window.matchMedia('(hover: none)').matches;

  /* =====================================================
     滚动进度条
     ===================================================== */
  const progress = document.createElement('div');
  progress.id = 'scroll-progress';
  document.body.prepend(progress);

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
  }, { passive: true });

  /* =====================================================
     自定义光标
     ===================================================== */
  if (!isTouch()) {
    const ring = document.createElement('div');
    const dot  = document.createElement('div');
    ring.id = 'cursor-ring';
    dot.id  = 'cursor-dot';
    document.body.append(ring, dot);

    let mx = -200, my = -200;
    let rx = -200, ry = -200;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    /* 环跟随：平滑插值，比 dot 慢一拍 */
    (function trackRing() {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(trackRing);
    })();

    /* 鼠标离开/进入页面 */
    document.addEventListener('mouseleave', () => {
      ring.style.opacity = '0';
      dot.style.opacity  = '0';
    });
    document.addEventListener('mouseenter', () => {
      ring.style.opacity = '1';
      dot.style.opacity  = '1';
    });

    /* 悬停状态切换 */
    function bindCursorState(selector, cls) {
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add(cls));
        el.addEventListener('mouseleave', () => document.body.classList.remove(cls));
      });
    }

    bindCursorState('.work-card',               'cur-card');
    bindCursorState('.btn',                      'cur-btn');
    bindCursorState('a:not(.btn), .social-link', 'cur-link');
    bindCursorState('.nav-links a',              'cur-link');
  }

  /* =====================================================
     磁吸按钮（仅 hero 区的两个 CTA）
     ===================================================== */
  if (!isTouch()) {
    document.querySelectorAll('.hero-btns .btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r  = btn.getBoundingClientRect();
        const ox = (e.clientX - r.left - r.width  / 2) * 0.30;
        const oy = (e.clientY - r.top  - r.height / 2) * 0.30;
        btn.style.transform = `translate(${ox}px, ${oy}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* =====================================================
     3D 卡片倾斜 + 悬停遮罩注入
     ===================================================== */
  document.querySelectorAll('.work-card').forEach(card => {
    /* 新版 .work-item 已内置 .work-info-overlay，跳过旧遮罩注入 */
    if (!card.classList.contains('work-item')) {
      const overlay = document.createElement('div');
      overlay.className = 'work-hover-overlay';
      const titleEl = card.querySelector('.work-title');
      const titleSpan = document.createElement('span');
      titleSpan.className = 'work-hover-title';
      titleSpan.textContent = titleEl ? titleEl.textContent : '';
      overlay.appendChild(titleSpan);
      card.appendChild(overlay);
    }

    if (isTouch()) return;

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left;
      const y  = e.clientY - r.top;
      const cx = r.width  / 2;
      const cy = r.height / 2;
      const rotX = ((y - cy) / cy) * -9;
      const rotY = ((x - cx) / cx) *  9;

      /* 关闭 transform transition，让倾斜即时响应 */
      card.style.transition = 'box-shadow 0.15s, border-color 0.15s';
      card.style.transform  =
        `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;

      /* 动态光源跟随 */
      card.style.boxShadow =
        `0 20px 50px rgba(245,200,66,0.15), ` +
        `${(x / r.width  - 0.5) * -20}px ` +
        `${(y / r.height - 0.5) * -20}px 30px rgba(245,200,66,0.08)`;
    });

    card.addEventListener('mouseleave', () => {
      /* 恢复 transition，平滑归位 */
      card.style.transition = '';
      card.style.transform  = '';
      card.style.boxShadow  = '';
    });
  });

  /* =====================================================
     灯箱导航升级：← → 键 + 按钮 + 触摸滑动 + 计数器
     ===================================================== */
  const lightbox   = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lightboxImg');
  const lbVideo    = document.getElementById('lightboxVideo');
  const lbCaption  = document.getElementById('lightboxCaption');
  const imgWrap    = lightbox && lightbox.querySelector('.lightbox-img-wrap');

  if (lightbox && lbImg && imgWrap) {
    const cards = [...document.querySelectorAll('.work-card')];
    let cur = 0;

    /* 注入 prev / next 按钮 */
    const btnPrev = document.createElement('button');
    const btnNext = document.createElement('button');
    btnPrev.className = 'lb-nav prev';
    btnNext.className = 'lb-nav next';
    btnPrev.innerHTML = '&#8592;';
    btnNext.innerHTML = '&#8594;';
    btnPrev.setAttribute('aria-label', '上一幅');
    btnNext.setAttribute('aria-label', '下一幅');
    lightbox.appendChild(btnPrev);
    lightbox.appendChild(btnNext);

    /* 注入计数器 */
    const counter = document.createElement('p');
    counter.className = 'lb-counter';
    imgWrap.appendChild(counter);

    /* 播放入场动画 */
    function playEnter() {
      lbImg.classList.remove('lb-enter');
      void lbImg.offsetWidth; /* reflow 重置动画 */
      lbImg.classList.add('lb-enter');
    }

    /* 切换到指定卡片 */
    function goTo(idx) {
      cur = ((idx % cards.length) + cards.length) % cards.length;
      const card    = cards[cur];
      const thumb   = card.querySelector('.work-thumb');
      const title   = card.querySelector('.work-title');
      const isVideo = card.dataset.type === 'video';

      lbCaption.textContent = title ? title.textContent : '';
      counter.textContent   = `${cur + 1} / ${cards.length}`;

      if (isVideo) {
        lightbox.classList.add('video-mode');
        if (lbVideo) {
          lbVideo.src = card.dataset.src || '';
          lbVideo.load();
        }
      } else {
        lightbox.classList.remove('video-mode');
        if (lbVideo) { lbVideo.pause(); lbVideo.src = ''; }
        lbImg.style.background      = thumb ? thumb.style.background      || '' : '';
        lbImg.style.backgroundColor = thumb ? thumb.style.backgroundColor || '' : '';
        playEnter();
      }
    }

    /* 侦听 lightbox 打开（由 script.js 设置 .open），同步当前索引 */
    new MutationObserver(() => {
      if (!lightbox.classList.contains('open')) return;
      const cap = lbCaption.textContent;
      const idx = cards.findIndex(c => {
        const t = c.querySelector('.work-title');
        return t && t.textContent === cap;
      });
      cur = idx >= 0 ? idx : 0;
      counter.textContent = `${cur + 1} / ${cards.length}`;
      playEnter();
    }).observe(lightbox, { attributes: true, attributeFilter: ['class'] });

    /* 按钮点击 */
    btnPrev.addEventListener('click', e => { e.stopPropagation(); goTo(cur - 1); });
    btnNext.addEventListener('click', e => { e.stopPropagation(); goTo(cur + 1); });

    /* 键盘 ← → */
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'ArrowLeft')  goTo(cur - 1);
      if (e.key === 'ArrowRight') goTo(cur + 1);
    });

    /* 触摸滑动 */
    let touchX = 0;
    lightbox.addEventListener('touchstart', e => {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 48) goTo(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* =====================================================
     打字机效果：hero 副标题
     ===================================================== */
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    const fullText = heroSub.textContent.trim();
    heroSub.textContent = '';

    /* 插入闪烁光标 */
    const typeCursor = document.createElement('span');
    typeCursor.className = 'type-cursor';
    heroSub.appendChild(typeCursor);

    let i = 0;
    let started = false;

    function typeNext() {
      if (i < fullText.length) {
        heroSub.insertBefore(document.createTextNode(fullText[i]), typeCursor);
        i++;
        setTimeout(typeNext, 70 + Math.random() * 50);
      } else {
        /* 打完后光标再闪 1.5s 然后消失 */
        setTimeout(() => typeCursor.remove(), 1500);
      }
    }

    function startTyping() {
      if (started) return;
      started = true;
      setTimeout(typeNext, 900); /* 等 fade-up 动画（0.7s）结束再打字 */
    }

    /* 等 hero-content 可见后触发 */
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) {
          startTyping();
          obs.disconnect();
        }
      }, { threshold: 0.4 }).observe(heroContent);
    } else {
      startTyping();
    }
  }

})();
