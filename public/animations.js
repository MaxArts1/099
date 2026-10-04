/* ================================================================
   SuperMaster — Premium Animations (GSAP + ScrollTrigger)
   Awwwards-level: text-reveal, scroll-fade, parallax, marquee
   Нативный скролл (быстрый и привычный), анимации на GSAP
   ================================================================ */

(function () {
  'use strict';

  /* --- Кастомные CSS-переменные для анимаций --- */
  const root = document.documentElement;
  root.style.setProperty('--ease-out-expo', 'cubic-bezier(0.16, 1, 0.3, 1)');
  root.style.setProperty('--ease-out-quart', 'cubic-bezier(0.25, 1, 0.5, 1)');
  root.style.setProperty('--duration-reveal', '1.1s');
  root.style.setProperty('--duration-fade', '0.8s');
  root.style.setProperty('--duration-stagger', '0.12s');

  /* ================================================================
     1. HERO: Text Reveal (появление построчно)
     ================================================================ */
  function initHeroTextReveal() {
    // Разбиваем hero-заголовок на строки для построчного reveal
    const heroH1 = document.querySelector('.hero h1');
    if (!heroH1) return;

    // Оборачиваем каждую строку в .line-wrap с overflow:hidden
    const lines = heroH1.innerHTML.split('<br>').map((line) => {
      return `<span class="line-wrap" style="display:block;overflow:hidden;"><span class="line-inner" style="display:block;transform:translateY(110%);will-change:transform;">${line.trim()}</span></span>`;
    });
    heroH1.innerHTML = lines.join('');

    // Badge
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      gsap.set(badge, { opacity: 0, y: 20 });
    }

    // Subtitle
    const sub = document.querySelector('.hero-sub');
    if (sub) {
      gsap.set(sub, { opacity: 0, y: 30 });
    }

    // Search bar
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      gsap.set(searchBar, { opacity: 0, y: 30 });
    }

    // Stats
    const stats = document.querySelectorAll('.stat-card');
    stats.forEach((s) => gsap.set(s, { opacity: 0, y: 30 }));

    // Timeline
    const tl = gsap.timeline({ delay: 0.3 });

    // Badge
    if (badge) {
      tl.to(badge, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0);
    }

    // Lines reveal с кастомной кривой
    tl.to('.line-inner', {
      y: '0%',
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.12,
    }, 0.1);

    // Subtitle
    if (sub) {
      tl.to(sub, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.5);
    }

    // Search bar
    if (searchBar) {
      tl.to(searchBar, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.65);
    }

    // Stats stagger
    tl.to(stats, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
    }, 0.8);
  }

  /* ================================================================
     2. SCROLL-TRIGGERED: Fade-in + slide-up при скролле
     Динамический рендер: MutationObserver ловит появление карточек
     ================================================================ */
  const revealBound = new WeakSet();

  function bindReveal(el, opts = {}) {
    if (revealBound.has(el)) return;
    revealBound.add(el);
    gsap.set(el, { opacity: 0, y: opts.y || 30 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: opts.duration || 0.8,
          ease: 'power3.out',
          delay: opts.delay || 0,
        });
      },
    });
  }

  function bindCardReveal(cards, opts = {}) {
    cards.forEach((card, i) => {
      bindReveal(card, {
        y: opts.y,
        duration: opts.duration,
        delay: opts.stagger ? (i % opts.stagger) * 0.12 : 0,
      });
    });
  }

  function bindHover(card) {
    const img = card.querySelector('.service-img, .avatar, .sb-img');
    if (!img) return;

    card.addEventListener('mouseenter', () => {
      gsap.to(img, { scale: 1.08, duration: 0.5, ease: 'power2.out' });
    });
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(img, { x: x * 8, y: y * 8, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(img, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' });
    });
  }

  // Разовые статичные элементы (навешиваем один раз при старте)
  function initStaticScrollAnimations() {
    const sections = document.querySelectorAll('.section, .cta-banner');
    sections.forEach((section) => {
      const heading = section.querySelector('h2, .section-header');
      if (heading) bindReveal(heading, { y: 40, duration: 0.9 });
      const content = section.querySelector('.services-grid, .masters-grid, .steps-grid, .category-grid, .cta-content');
      if (content) bindReveal(content, { y: 50, duration: 1, delay: 0.15 });
    });
  }

  // Наблюдатель: навешиваем reveal+hover на карточки, когда они появляются в DOM
  function initDynamicCardAnimations() {
    const observer = new MutationObserver((mutations) => {
      let rebound = false;
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          const cards = node.matches('.service-card, .master-card, .cat-card, .step-card')
            ? [node]
            : node.querySelectorAll('.service-card, .master-card, .cat-card, .step-card');
          cards.forEach((card) => {
            if (card.classList.contains('cat-card') || card.classList.contains('step-card')) {
              bindReveal(card, { y: 30, duration: 0.7 });
            } else {
              bindReveal(card, { y: 30, duration: 0.8 });
            }
            if (card.classList.contains('service-card') || card.classList.contains('master-card')) {
              bindHover(card);
            }
            // Стрелка категорий
            if (card.classList.contains('cat-card')) {
              bindCatArrow(card);
            }
          });
          rebound = true;
        });
      });
      if (rebound) ScrollTrigger.refresh();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function bindCatArrow(card) {
    const arrow = card.querySelector('.cat-arrow');
    if (!arrow) return;
    card.addEventListener('mouseenter', () => gsap.to(arrow, { x: 4, duration: 0.3 }));
    card.addEventListener('mouseleave', () => gsap.to(arrow, { x: 0, duration: 0.3 }));
  }

  /* ================================================================
     4. MARQUEE: Бегущая строка
     ================================================================ */
  function initMarquee() {
    const banner = document.querySelector('.cta-banner');
    if (!banner) return;

    // Создаём marquee-ленту внутри CTA banner
    const marqueeHTML = `
      <div class="marquee-wrap" style="overflow:hidden;padding:8px 0 0;margin-top:16px;">
        <div class="marquee-track" style="display:flex;gap:48px;white-space:nowrap;will-change:transform;">
          <span class="marquee-item">⚡ Бронирование за 2 минуты</span>
          <span class="marquee-item">★ Гарантия на все работы</span>
          <span class="marquee-item">🏙 3 города</span>
          <span class="marquee-item">💳 Оплата онлайн</span>
          <span class="marquee-item">👷 7 мастеров в штате</span>
          <span class="marquee-item">📋 16 услуг в каталоге</span>
          <!-- Дубликаты для бесшовного цикла -->
          <span class="marquee-item">⚡ Бронирование за 2 минуты</span>
          <span class="marquee-item">★ Гарантия на все работы</span>
          <span class="marquee-item">🏙 3 города</span>
          <span class="marquee-item">💳 Оплата онлайн</span>
          <span class="marquee-item">👷 7 мастеров в штате</span>
          <span class="marquee-item">📋 16 услуг в каталоге</span>
        </div>
      </div>
    `;
    banner.insertAdjacentHTML('beforeend', marqueeHTML);

    const track = banner.querySelector('.marquee-track');
    if (!track) return;

    // GSAP бесконечная анимация
    const totalWidth = track.scrollWidth / 2;
    gsap.to(track, {
      x: -totalWidth,
      duration: 30,
      ease: 'none',
      repeat: -1,
    });

    // Стили для marquee
    const style = document.createElement('style');
    style.textContent = `
      .marquee-item {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .dark .marquee-item { color: rgba(255,255,255,0.5); }
    `;
    document.head.appendChild(style);
  }

  /* ================================================================
     5. PARALLAX: Глубинный parallax на hero
     ================================================================ */
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Фоновый градиент движется медленнее контента
    gsap.to(hero, {
      backgroundPosition: '50% 100%',
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });

    // Контент hero тоже медленно уезжает вверх
    const heroInner = hero.querySelector('.hero-inner');
    if (heroInner) {
      gsap.to(heroInner, {
        y: -60,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }
  }

  /* ================================================================
     6. CTA BANNER: Reveal + parallax
     ================================================================ */
  function initCTAReveal() {
    const banner = document.querySelector('.cta-banner');
    if (!banner) return;

    gsap.set(banner, { opacity: 0, y: 60 });
    ScrollTrigger.create({
      trigger: banner,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(banner, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
        });
      },
    });
  }

  /* ================================================================
     INIT: Запуск всех анимаций
     ================================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    // Ждём полной загрузки GSAP
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[SuperMaster] GSAP не загружен — анимации отключены');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    initHeroTextReveal();
    initStaticScrollAnimations();
    initDynamicCardAnimations();
    initMarquee();
    initHeroParallax();
    initCTAReveal();

    console.log('[SuperMaster] Premium animations initialized ✓');
  });

})();
