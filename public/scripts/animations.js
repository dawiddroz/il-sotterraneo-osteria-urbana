/* ===== Il Sotterraneo — animazioni "vive" (anti-flash bulletproof) ===== */
(function () {
  'use strict';

  /* Safety net: se GSAP non arriva entro 4s, il CSS .safety-net mostra tutto */
  var safetyTimer = setTimeout(function () {
    document.documentElement.classList.add('safety-net');
  }, 4000);

  /* ---------- Burger menu ---------- */
  var burger = document.getElementById('nav-burger');
  var navLinks = document.getElementById('nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- WhatsApp float appare dopo il hero ---------- */
  var waFloat = document.getElementById('wa-float');
  if (waFloat) {
    var heroH = document.querySelector('.hero') ? document.querySelector('.hero').offsetHeight : 500;
    var onScroll = function () {
      if (window.scrollY > heroH * 0.7) {
        waFloat.classList.add('visible');
      } else {
        waFloat.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Split words: titoli .split-words → span.wrd ---------- */
  function splitWords(el) {
    var nodes = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.textContent.trim()) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          var s = document.createElement('span');
          s.className = 'wrd';
          s.textContent = part;
          frag.appendChild(s);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  document.querySelectorAll('.split-words').forEach(splitWords);

  /* ---------- Counter animati (IntersectionObserver + rAF, zero GSAP) ---------- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1600;
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window && counters.length) {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { counterObs.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-counter'); });
  }

  /* ---------- Init retry-loop: GSAP + ScrollTrigger + Lenis ---------- */
  var gsapRetries = 0;
  var GSAP_MAX = 32; /* ~8s */

  function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      if (++gsapRetries > GSAP_MAX) return;
      setTimeout(initAnimations, 250);
      return;
    }
    clearTimeout(safetyTimer);
    document.documentElement.classList.remove('safety-net');
    gsap.registerPlugin(ScrollTrigger);

    /* Lenis: UNA sola istanza, drive via gsap.ticker (Mai senza drive: rotellina morta) */
    var lenisRetries = 0;
    (function initLenis() {
      if (typeof Lenis === 'undefined') {
        if (++lenisRetries > GSAP_MAX) return;
        setTimeout(initLenis, 250);
        return;
      }
      window.lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      window.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        window.lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    })();

    /* ---- Navbar scrolled ---- */
    ScrollTrigger.create({
      start: 'top -80',
      onEnter: function () { document.getElementById('navbar').classList.add('navbar--scrolled'); },
      onLeaveBack: function () { document.getElementById('navbar').classList.remove('navbar--scrolled'); }
    });

    /* ---- Progress bar (scroll) ---- */
    gsap.to('.progress-bar', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 }
    });

    /* ---- Scroll reveal: GSAP to() + scrub (pattern accettato) ---- */
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.utils.toArray('.reveal').forEach(function (el) {
      if (reducedMotion) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'top 45%',
          scrub: 0.6
        }
      });
    });

    /* ---- Split words reveal (titoli) ---- */
    gsap.utils.toArray('.split-words').forEach(function (el) {
      var words = el.querySelectorAll('.wrd');
      if (!words.length) return;
      if (reducedMotion) {
        gsap.set(words, { opacity: 1, y: 0 });
        return;
      }
      gsap.to(words, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.045,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ---- Menu items: stagger + scrub ---- */
    gsap.utils.toArray('.menu__item').forEach(function (el, i) {
      if (reducedMotion) { gsap.set(el, { opacity: 1, y: 0 }); return; }
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        delay: (i % 4) * 0.08,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ---- Gallery items: stagger ---- */
    gsap.utils.toArray('.gallery__item').forEach(function (el, i) {
      if (reducedMotion) { gsap.set(el, { opacity: 1, y: 0 }); return; }
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: (i % 4) * 0.09,
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* ---- Image reveal foto storia: overlay scivola via ---- */
    gsap.utils.toArray('.storia__photo').forEach(function (photo, i) {
      var overlay = photo.querySelector('.img-reveal');
      if (!overlay) return;
      if (reducedMotion) { gsap.set(overlay, { scaleX: 0 }); return; }
      gsap.to(overlay, {
        scaleX: 0,
        duration: 1.15,
        ease: 'power4.inOut',
        delay: i * 0.18,
        scrollTrigger: { trigger: photo, start: 'top 80%', toggleActions: 'play none none none' }
      });
    });

    /* ---- Elementi singoli (.el-in): entrata con stagger ---- */
    gsap.utils.toArray('.el-in').forEach(function (el, i) {
      if (reducedMotion) { gsap.set(el, { opacity: 1, y: 0 }); return; }
      gsap.to(el, {
        opacity: 1, y: 0,
        duration: 0.65, ease: 'power3.out',
        delay: (i % 5) * 0.09,
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' }
      });
    });

    /* ---- Stelle recensioni: pop con stagger ---- */
    var stars = document.querySelectorAll('.rev__stars svg');
    if (stars.length && !reducedMotion) {
      gsap.fromTo(stars, { scale: 0, opacity: 0 }, {
        scale: 1, opacity: 1,
        duration: 0.5, ease: 'back.out(2.5)', stagger: 0.09,
        scrollTrigger: { trigger: '.rev__stars', start: 'top 88%', toggleActions: 'play none none none' }
      });
    }

    /* ---- Parallax hero bg + light (solo desktop) ---- */
    if (window.innerWidth >= 768 && !reducedMotion) {
      gsap.to('.hero__bg', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
      gsap.to('.hero__light', {
        yPercent: 22,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
      /* Parallax foto storia */
      gsap.utils.toArray('.storia__photo img').forEach(function (img) {
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: img.closest('.storia__photo'), start: 'top bottom', end: 'bottom top', scrub: 1.2 }
        });
      });
    }

    /* ---- Glow CTA parallax ---- */
    if (window.innerWidth >= 768 && !reducedMotion) {
      gsap.to('.cta__glow', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
      });
    }

    /* ---- Spotlight hero: glow che seguono il mouse (desktop) ---- */
    if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
      var spotWarm = document.getElementById('spot-warm');
      var spotSoft = document.getElementById('spot-soft');
      if (spotWarm && spotSoft) {
        var warmX = gsap.quickTo(spotWarm, 'x', { duration: 0.8, ease: 'power3.out' });
        var warmY = gsap.quickTo(spotWarm, 'y', { duration: 0.8, ease: 'power3.out' });
        var softX = gsap.quickTo(spotSoft, 'x', { duration: 1.2, ease: 'power3.out' });
        var softY = gsap.quickTo(spotSoft, 'y', { duration: 1.2, ease: 'power3.out' });
        var heroEl = document.querySelector('.hero');
        var heroRect = heroEl.getBoundingClientRect();
        heroEl.addEventListener('mousemove', function (e) {
          var x = e.clientX - heroRect.left;
          var y = e.clientY - heroRect.top;
          warmX(x); warmY(y);
          softX(x * 0.7); softY(y * 0.7);
        });
      }
    }

    /* ---- Magnetic hover bottoni principali (desktop) ---- */
    if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
      gsap.utils.toArray('.hero__cta .btn, .cta__btns .btn, .storia__text .btn, .map__btns .btn').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.22);
          yTo((e.clientY - r.top - r.height / 2) * 0.3);
        });
        btn.addEventListener('mouseleave', function () {
          xTo(0); yTo(0);
        });
      });
    }

    /* ---- Tilt card contatti (desktop, max 4°) ---- */
    if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
      gsap.utils.toArray('.contacts__card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
          gsap.to(card, { rotateX: rx, rotateY: ry, duration: 0.4, ease: 'power2.out', transformPerspective: 700 });
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
        });
      });
    }

    ScrollTrigger.refresh();
  }

  /* Avvio al DOMContentLoaded (o subito se già caricato) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }
})();
