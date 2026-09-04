/* RElaxed City Living — site behaviour */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header: transparent over hero, solid once scrolled ---------- */
  var header = document.querySelector('.header');
  var hero = document.querySelector('.hero');

  function syncHeader() {
    if (!header) return;
    if (!hero) { header.classList.add('is-solid'); return; }
    var trigger = Math.min(hero.offsetHeight - 90, window.innerHeight * 0.6);
    header.classList.toggle('is-solid', window.scrollY > trigger);
  }
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
  window.addEventListener('resize', syncHeader);

  /* ---------- mobile nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  var navCaret = document.querySelector('.nav__caret');
  var navItem = navCaret && navCaret.closest('.nav__item');

  function closeRoomsDropdown() {
    if (!navItem) return;
    navItem.classList.remove('is-open');
    navCaret.setAttribute('aria-expanded', 'false');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) closeRoomsDropdown();
      if (open) header.classList.add('is-solid'); else syncHeader();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav__caret')) return;
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        closeRoomsDropdown();
        syncHeader();
      }
    });
  }

  if (navCaret && navItem) {
    navCaret.addEventListener('click', function (e) {
      e.preventDefault();
      var open = navItem.classList.toggle('is-open');
      navCaret.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- hero crossfade ---------- */
  var slides = document.querySelectorAll('.hero__bg img');
  if (slides.length > 1 && !reduceMotion) {
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 6500);
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- FAQ accordion (animated open/close) ---------- */
  var faqDetails = document.querySelectorAll('.faq details');
  if (faqDetails.length && !reduceMotion && 'animate' in Element.prototype) {
    faqDetails.forEach(function (det) {
      var summary = det.querySelector('summary');
      var answer = det.querySelector('.faq__a');
      if (!summary || !answer) return;

      var animation = null;
      var isClosing = false;
      var isExpanding = false;

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        det.style.overflow = 'hidden';
        if (isClosing || !det.open) {
          openFaq();
        } else if (isExpanding || det.open) {
          closeFaq();
        }
      });

      function openFaq() {
        det.style.height = det.offsetHeight + 'px';
        det.open = true;
        window.requestAnimationFrame(function () { expand(); });
      }

      function expand() {
        isExpanding = true;
        var startHeight = det.offsetHeight;
        var endHeight = summary.offsetHeight + answer.offsetHeight;
        runAnimation(startHeight, endHeight, true);
      }

      function closeFaq() {
        isClosing = true;
        var startHeight = det.offsetHeight;
        var endHeight = summary.offsetHeight;
        runAnimation(startHeight, endHeight, false);
      }

      function runAnimation(startHeight, endHeight, opening) {
        if (animation) animation.cancel();
        animation = det.animate(
          { height: [startHeight + 'px', endHeight + 'px'] },
          { duration: 380, easing: 'cubic-bezier(.22,.7,.3,1)' }
        );
        animation.onfinish = function () { onAnimationFinish(opening); };
        animation.oncancel = function () { isClosing = false; isExpanding = false; };
      }

      function onAnimationFinish(open) {
        det.open = open;
        animation = null;
        isClosing = false;
        isExpanding = false;
        det.style.height = '';
        det.style.overflow = '';
      }
    });
  }

  /* ---------- gallery lightbox ---------- */
  var gallery = document.querySelector('.gallery');
  var lightbox = document.querySelector('.lightbox');
  if (gallery && lightbox) {
    var buttons = Array.prototype.slice.call(gallery.querySelectorAll('button'));
    var track = lightbox.querySelector('.lightbox__track');
    var viewport = lightbox.querySelector('.lightbox__viewport');
    var slides = Array.prototype.slice.call(lightbox.querySelectorAll('.lightbox__slide'));
    var lbCount = lightbox.querySelector('.lightbox__count');
    var current = 0;
    var lastFocused = null;
    var animating = false;

    function fill(slide, index) {
      var btn = buttons[(index + buttons.length) % buttons.length];
      slide.src = btn.dataset.full;
      slide.alt = btn.querySelector('img').alt;
    }
    function renderSlides() {
      fill(slides[0], current - 1);
      fill(slides[1], current);
      fill(slides[2], current + 1);
      if (lbCount) lbCount.textContent = (current + 1) + ' / ' + buttons.length;
    }
    function resetTrack() {
      track.classList.remove('is-animating');
      track.style.transform = 'translateX(-33.3333%)';
    }
    function show(index) {
      current = (index + buttons.length) % buttons.length;
      resetTrack();
      renderSlides();
    }
    /* animate the track to the prev/next slide, then recentre and refresh */
    function go(dir) {
      if (animating || !dir) return;
      animating = true;
      track.classList.add('is-animating');
      track.style.transform = 'translateX(' + (dir < 0 ? '0%' : '-66.6666%') + ')';
      var done = function () {
        track.removeEventListener('transitionend', done);
        current = (current + dir + buttons.length) % buttons.length;
        resetTrack();
        renderSlides();
        animating = false;
      };
      if (reduceMotion) { done(); } else { track.addEventListener('transitionend', done); }
    }
    function open(index) {
      lastFocused = document.activeElement;
      current = index;
      resetTrack();
      renderSlides();
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lightbox__close').focus();
    }
    function close() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener('click', function () { open(index); });
    });
    lightbox.querySelector('.lightbox__close').addEventListener('click', close);
    lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () { go(-1); });
    lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () { go(1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });

    /* drag/swipe the track with the finger, then settle on the nearest slide */
    var dragging = false, dragStartX = 0, dragStartY = 0, dragDX = 0, viewportW = 1;
    lightbox.addEventListener('touchstart', function (e) {
      if (animating) return;
      var t = e.changedTouches[0];
      dragging = true;
      dragStartX = t.clientX;
      dragStartY = t.clientY;
      dragDX = 0;
      viewportW = viewport.clientWidth || 1;
      track.classList.remove('is-animating');
    }, { passive: true });
    lightbox.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - dragStartX;
      var dy = t.clientY - dragStartY;
      if (Math.abs(dx) < Math.abs(dy)) return; // vertical gesture, ignore
      dragDX = dx;
      var pct = (dx / viewportW) * 33.3333;
      track.style.transform = 'translateX(calc(-33.3333% + ' + pct + '%))';
    }, { passive: true });
    lightbox.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;
      var passedThreshold = Math.abs(dragDX) > Math.max(50, viewportW * 0.18);
      if (!passedThreshold) {
        if (!reduceMotion) track.classList.add('is-animating');
        track.style.transform = 'translateX(-33.3333%)';
        return;
      }
      go(dragDX < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- current year ---------- */
  var yearEl = document.querySelectorAll('[data-year]');
  yearEl.forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- contact form (no backend — opens the guest's mail client) ---------- */
  var form = document.querySelector('[data-mailto]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var body = [
        'Name: ' + (data.get('name') || ''),
        'Email: ' + (data.get('email') || ''),
        'Phone: ' + (data.get('phone') || ''),
        'Unit of interest: ' + (data.get('unit') || ''),
        'Arrive: ' + (data.get('arrive') || ''),
        'Depart: ' + (data.get('depart') || ''),
        'Guests: ' + (data.get('guests') || ''),
        '',
        (data.get('message') || '')
      ].join('\n');
      window.location.href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent('Enquiry from the website — ' + (data.get('name') || 'guest')) +
        '&body=' + encodeURIComponent(body);
    });
  }
})();
