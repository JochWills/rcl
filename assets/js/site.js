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
    /* also go solid as soon as the hero copy reaches the header, so they never overlap */
    var lead = hero.querySelector('.hero__inner > :first-child');
    var collides = lead && lead.getBoundingClientRect().top < header.offsetHeight;
    header.classList.toggle('is-solid', window.scrollY > trigger || collides);
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
    function markAria() {
      slides[0].setAttribute('aria-hidden', 'true');
      slides[2].setAttribute('aria-hidden', 'true');
      slides[1].removeAttribute('aria-hidden');
    }
    function renderSlides() {
      fill(slides[0], current - 1);
      fill(slides[1], current);
      fill(slides[2], current + 1);
      markAria();
      if (lbCount) lbCount.textContent = (current + 1) + ' / ' + buttons.length;
    }
    function resetTrack() {
      track.classList.remove('is-animating');
      track.style.transform = 'translateX(-33.3333%)';
    }
    /* the slide that was already showing (preloaded) stays put — only the
       freshly-revealed edge slide (now off-screen again) gets a new image,
       so fast repeated swipes never flash a stale/reloading photo */
    function settle(dir) {
      current = (current + dir + buttons.length) % buttons.length;
      track.classList.remove('is-animating');
      if (dir > 0) {
        var head = slides.shift();
        slides.push(head);
        track.appendChild(head);
        track.style.transform = 'translateX(-33.3333%)';
        fill(head, current + 1);
      } else {
        var tail = slides.pop();
        slides.unshift(tail);
        track.insertBefore(tail, track.firstChild);
        track.style.transform = 'translateX(-33.3333%)';
        fill(tail, current - 1);
      }
      markAria();
      if (lbCount) lbCount.textContent = (current + 1) + ' / ' + buttons.length;
    }
    /* animate the track to the prev/next slide, then settle on it */
    function go(dir) {
      if (animating || !dir) return;
      if (reduceMotion) { settle(dir); return; }
      animating = true;
      track.classList.add('is-animating');
      track.style.transform = 'translateX(' + (dir < 0 ? '0%' : '-66.6666%') + ')';
      var done = function () {
        track.removeEventListener('transitionend', done);
        settle(dir);
        animating = false;
      };
      track.addEventListener('transitionend', done);
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

  /* ---------- WhatsApp book-direct widget ---------- */
  /* Set this once the WhatsApp Business profile exists — digits only,
     country code first, no "+", no spaces (e.g. "27821234567").
     The widget stays hidden until a number is set. */
  var WHATSAPP_NUMBER = '27721750825';
  var WHATSAPP_MESSAGE = "Hi! I'd like to book directly at RElaxed City Living.";

  if (WHATSAPP_NUMBER && !sessionStorage.getItem('waDismissed')) {
    var waLink = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_MESSAGE);
    var wa = document.createElement('div');
    wa.className = 'wa-widget';
    wa.innerHTML =
      '<button class="wa-widget__close" type="button" aria-label="Dismiss">×</button>' +
      '<a class="wa-widget__link" href="' + waLink + '" target="_blank" rel="noopener">' +
        '<span class="wa-widget__icon">' +
          '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.38 4 15.02c0 2.22.6 4.3 1.65 6.1L4 29l8.06-1.6a12.9 12.9 0 0 0 3.96.62h.01c6.62 0 12.02-5.38 12.02-12.02C28.05 8.38 22.65 3 16.02 3zm7.1 17.2c-.3.85-1.5 1.56-2.45 1.77-.65.14-1.5.25-4.36-.93-3.65-1.52-6-5.2-6.18-5.44-.18-.24-1.47-1.96-1.47-3.75 0-1.78.94-2.65 1.27-3.01.33-.36.72-.45.96-.45.24 0 .48 0 .69.01.22.01.52-.08.81.62.3.72 1.03 2.5 1.12 2.68.09.18.15.4.03.64-.12.24-.18.4-.36.6-.18.22-.38.48-.54.65-.18.18-.37.38-.16.74.21.36.93 1.53 2 2.48 1.37 1.22 2.53 1.6 2.9 1.78.36.18.58.15.79-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.8-.18.33.12 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.87-.21 1.72z"/></svg>' +
        '</span>' +
        '<span class="wa-widget__text"><strong>Book direct</strong><em>Message us for our best rate</em></span>' +
      '</a>';
    document.body.appendChild(wa);
    wa.querySelector('.wa-widget__close').addEventListener('click', function () {
      wa.remove();
      sessionStorage.setItem('waDismissed', '1');
    });
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
