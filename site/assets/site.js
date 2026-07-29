/* ============================================================
   KAZI CONNECT - shared site script (loaded by every page)
   No localStorage/sessionStorage anywhere: state is in-memory only.
   Every block no-ops gracefully if its elements aren't on the page.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- CONFIG (edit me) ---------- */
  // Swap for your real form endpoint (expects a JSON POST).
  var FORM_ENDPOINT = 'https://example.com/api/kazi-connect/forms'; // ← PLACEHOLDER
  // Investor gate code - change before sharing the investor page.
  var INVESTOR_ACCESS_CODE = 'KAZI2026';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ============================================================
     THEME TOGGLE - in-memory only (resets on reload by design)
     ============================================================ */
  var theme = 'dark';
  var themeBtn = $('#themeToggle');
  function applyTheme() {
    doc.setAttribute('data-theme', theme);
    var toLight = theme === 'dark';
    if (themeBtn) {
      themeBtn.textContent = toLight ? '☀' : '☾';
      themeBtn.setAttribute('aria-label', toLight ? 'Switch to light theme' : 'Switch to dark theme');
      themeBtn.setAttribute('aria-pressed', String(!toLight));
    }
    var metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', toLight ? '#1B2D2A' : '#FBF8F1');
    restyleCharts();
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme();
    });
  }

  /* ============================================================
     NAV - mobile menu + active page highlighting
     ============================================================ */
  var burger = $('#navBurger'), navLinks = $('#navLinks');
  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  }

  // Mark the current page in the nav. Works for /page.html and clean URLs.
  (function markActivePage() {
    if (!navLinks) return;
    var here = location.pathname.replace(/\/+$/, '/').split('/').pop() || 'index.html';
    $$('a', navLinks).forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('#')[0].split('/').pop();
      if (!target) return;
      if (target === here || (here === '' && target === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ============================================================
     REVEAL-ON-SCROLL (IntersectionObserver fade-ins)
     ============================================================ */
  var revealObs = null;
  if ('IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); revealObs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
  }
  function revealScan() {
    $$('.reveal').forEach(function (el) {
      if (el.classList.contains('visible')) return;
      if (revealObs && !el.closest('[hidden]')) revealObs.observe(el);
      else if (!revealObs) el.classList.add('visible');
    });
  }
  revealScan();

  /* ============================================================
     FORMS - client-side validation + POST to placeholder endpoint
     Any <form data-form="name"> on any page is wired automatically.
     ============================================================ */
  function validateField(field) {
    var input = field.querySelector('input, select, textarea');
    var err = field.querySelector('.field-error');
    if (!input || !err) return true;
    var msg = '';
    if (input.required) {
      if (input.type === 'checkbox' && !input.checked) msg = 'Consent is required to continue.';
      else if (input.type !== 'checkbox' && !input.value.trim()) msg = 'This field is required.';
    }
    if (!msg && input.type === 'email' && input.value.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) msg = 'Enter a valid email address.';
    if (!msg && input.type === 'tel' && input.value.trim() &&
        !/^[+\d][\d\s\-()]{6,}$/.test(input.value.trim())) msg = 'Enter a valid phone number.';
    err.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !msg;
  }

  $$('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      $$('.field', form).forEach(function (f) {
        if (!validateField(f)) {
          ok = false;
          if (!firstBad) firstBad = f.querySelector('input,select,textarea');
        }
      });
      if (!ok) {
        if (status) { status.className = 'form-status err'; status.textContent = 'Please correct the highlighted fields.'; }
        if (firstBad) firstBad.focus();
        return;
      }
      var data = { form: form.getAttribute('data-form'), submittedAt: new Date().toISOString() };
      $$('input, select, textarea', form).forEach(function (i) {
        if (!i.name) return;
        data[i.name] = i.type === 'checkbox' ? i.checked : i.value.trim();
      });
      if (status) { status.className = 'form-status'; status.textContent = 'Sending…'; }
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (status) {
          status.className = 'form-status ok';
          status.textContent = 'Thank you - we\'ve received your submission and will be in touch.';
        }
        form.reset();
      }).catch(function () {
        if (status) {
          status.className = 'form-status err';
          status.textContent = 'Could not submit right now (form endpoint not configured). ' +
            'Please email emmanuelmacha123@gmail.com instead.';
        }
      });
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f && f.querySelector('.field-error') && f.querySelector('.field-error').textContent) validateField(f);
    });
  });

  /* ============================================================
     INVESTOR GATE (investor.html only)
     Client-side gate: keeps the page out of casual view. It is not
     a security boundary - anything rendered here is in the page source.
     ============================================================ */
  var gateForm = $('#gateForm');
  if (gateForm) {
    gateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#gateCode'), err = $('#gateError');
      if (input.value.trim().toUpperCase() === INVESTOR_ACCESS_CODE) {
        err.textContent = '';
        input.removeAttribute('aria-invalid');
        input.value = '';
        $('#gateView').hidden = true;
        var view = $('#investorView');
        view.hidden = false;
        var t = $('#invTitle');
        if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
        initCharts();
        revealScan();
      } else {
        err.textContent = 'That code was not recognized. Request access via the contact page.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    });
  }

  /* ============================================================
     CHARTS (investor.html only) - Chart.js, theme-aware.
     Palette validated for colour-vision separation and contrast.
     ============================================================ */
  var revenueChart = null, fundsChart = null;

  function chartInk() {
    var light = doc.getAttribute('data-theme') === 'light';
    return {
      tick: light ? '#5F6B66' : '#AFBCB6',
      grid: light ? 'rgba(35,43,41,.12)' : 'rgba(244,239,228,.12)',
      surface: light ? '#FFFFFF' : '#22332F'
    };
  }

  function initCharts() {
    var revCanvas = $('#revenueChart');
    if (!revCanvas) return;
    if (typeof window.Chart === 'undefined') {
      var fb = $('#revenueFallback');
      if (fb) fb.hidden = false;
      return;
    }
    if (revenueChart) return;
    var ink = chartInk();
    var fmtTZS = function (v) { return 'TZS ' + Number(v).toLocaleString('en-US'); };

    // Bar - single series, brand terracotta, rounded data-end at the baseline
    revenueChart = new window.Chart(revCanvas, {
      type: 'bar',
      data: {
        labels: ['Year 1', 'Year 2', 'Year 3'],
        datasets: [{
          label: 'Revenue (TZS)',
          data: [243375000, 823500000, 1227375000],
          backgroundColor: '#C25E3A',
          borderRadius: { topLeft: 4, topRight: 4 },
          barPercentage: 0.55,
          categoryPercentage: 0.8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, // single series - the title names it
          tooltip: { callbacks: { label: function (c) { return fmtTZS(c.parsed.y); } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: ink.tick } },
          y: {
            grid: { color: ink.grid }, border: { display: false },
            ticks: { color: ink.tick, callback: function (v) { return (v / 1e6).toLocaleString('en-US') + 'M'; } }
          }
        }
      }
    });

    // Doughnut - 5 slices, 2px surface gaps; HTML legend carries the labels
    fundsChart = new window.Chart($('#fundsChart'), {
      type: 'doughnut',
      data: {
        labels: ['Technology & HMS', 'Team expansion', 'Marketing & BD', 'Working capital', 'Compliance & regional'],
        datasets: [{
          data: [30, 25, 25, 15, 5],
          backgroundColor: ['#C25E3A', '#4A90D9', '#BE8A26', '#22A79E', '#9C5AA8'],
          borderColor: ink.surface,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { display: false }, // HTML legend below the canvas
          tooltip: { callbacks: { label: function (c) { return c.label + ': ' + c.parsed + '%'; } } }
        }
      }
    });
  }

  function restyleCharts() {
    if (!revenueChart) return;
    var ink = chartInk();
    revenueChart.options.scales.x.ticks.color = ink.tick;
    revenueChart.options.scales.y.ticks.color = ink.tick;
    revenueChart.options.scales.y.grid.color = ink.grid;
    revenueChart.update();
    fundsChart.data.datasets[0].borderColor = ink.surface;
    fundsChart.update();
  }

  /* ---------- Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
