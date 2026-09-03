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
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) header.classList.add('is-solid'); else syncHeader();
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        syncHeader();
      }
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
    var lbImg = lightbox.querySelector('img');
    var lbCount = lightbox.querySelector('.lightbox__count');
    var current = 0;
    var lastFocused = null;

    function show(index) {
      current = (index + buttons.length) % buttons.length;
      var src = buttons[current].dataset.full;
      lbImg.src = src;
      lbImg.alt = buttons[current].querySelector('img').alt;
      if (lbCount) lbCount.textContent = (current + 1) + ' / ' + buttons.length;
    }
    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lightbox__close').focus();
    }
    function close() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      lbImg.src = '';
      if (lastFocused) lastFocused.focus();
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener('click', function () { open(index); });
    });
    lightbox.querySelector('.lightbox__close').addEventListener('click', close);
    lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(current - 1); });
    lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(current + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    /* swipe left/right to move between photos on touch devices */
    var touchStartX = 0, touchStartY = 0;
    lightbox.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStartX;
      var dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        show(current + (dx < 0 ? 1 : -1));
      }
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
