/* =====================================================
   印象派个人艺术网站 — 交互脚本
   导航栏 · 滚动动效 · Parallax · Lightbox · 表单
   ===================================================== */

(function () {
  'use strict';

  /* ---------- 工具 ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* =====================================================
     导航栏：滚动后加深 + 高亮当前节
     ===================================================== */
  const navbar = $('#navbar');
  const navLinks = $$('.nav-links a');
  const sections = $$('.section');
  const navLinksWrapper = $('#navLinks');
  const navToggle = $('#navToggle');

  function updateNavbar() {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  /* 汉堡菜单 */
  navToggle.addEventListener('click', () => {
    navLinksWrapper.classList.toggle('open');
  });

  navLinksWrapper.addEventListener('click', e => {
    if (e.target.tagName === 'A') navLinksWrapper.classList.remove('open');
  });

  window.addEventListener('scroll', () => {
    updateNavbar();
    updateActiveLink();
    updateParallax();
  }, { passive: true });

  updateNavbar();
  updateActiveLink();

  /* =====================================================
     Parallax：Hero & Resume 背景慢速移动
     ===================================================== */
  const heroEl   = $('#home');
  const resumeEl = $('#resume');

  function updateParallax() {
    const sy = window.scrollY;

    if (heroEl) {
      const offset = sy * 0.4;
      heroEl.style.backgroundPositionY = `calc(50% + ${offset}px)`;
    }

    if (resumeEl) {
      const rect = resumeEl.getBoundingClientRect();
      const offset = -rect.top * 0.3;
      resumeEl.style.backgroundPositionY = `calc(50% + ${offset}px)`;
    }
  }

  /* =====================================================
     Intersection Observer：入场动画
     ===================================================== */
  const animateEls = $$('.animate-fadeup, .animate-left, .animate-right');
  const cardEls    = $$('.animate-card');
  const timelineEls = $$('.timeline');
  const dotEls     = $$('.timeline-item');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  animateEls.forEach(el => io.observe(el));

  /* Cards — stagger 延迟 */
  const cardIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const i = parseInt(entry.target.dataset.index || '0', 10);
        entry.target.style.setProperty('--card-i', i);
        entry.target.classList.add('visible');
        cardIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cardEls.forEach(el => cardIO.observe(el));

  /* Timeline：线条 draw-in + 圆点 pop-in */
  const tlIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        tlIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  timelineEls.forEach(el => tlIO.observe(el));

  const dotIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        dotIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  dotEls.forEach(el => dotIO.observe(el));

  /* =====================================================
     Lightbox
     ===================================================== */
  const lightbox        = $('#lightbox');
  const lightboxClose   = $('#lightboxClose');
  const lightboxImg     = $('#lightboxImg');
  const lightboxCaption = $('#lightboxCaption');

  function openLightbox(card) {
    const thumb = $('.work-thumb', card);
    const title = $('.work-title', card);

    lightboxImg.style.background = thumb
      ? thumb.style.background || thumb.style.backgroundColor
      : 'var(--swirl)';

    lightboxImg.style.backgroundColor = thumb ? thumb.style.backgroundColor : '';

    lightboxCaption.textContent = title ? title.textContent : '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  $$('.work-card').forEach(card => {
    card.addEventListener('click', () => openLightbox(card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(card);
      }
    });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
  });

  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  /* =====================================================
     联系表单
     ===================================================== */
  const form       = $('#contactForm');
  const formNotice = $('#formNotice');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const name    = form.name.value.trim();
      const email   = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        formNotice.textContent = '请填写所有字段后再发送。';
        formNotice.style.color = 'var(--mist)';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        formNotice.textContent = '请输入有效的邮箱地址。';
        formNotice.style.color = 'var(--mist)';
        return;
      }

      /* 占位：实际发送逻辑请接入后端或 Formspree 等服务 */
      formNotice.textContent = '感谢留言！我会尽快回复你。';
      formNotice.style.color = 'var(--gold)';
      form.reset();
    });
  }

  /* =====================================================
     平滑滚动（补全 href="#xxx" 的导航点击）
     ===================================================== */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
