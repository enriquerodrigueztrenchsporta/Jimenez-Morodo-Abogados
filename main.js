(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var contact = data.contact || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  /* ---------- Splash (doble red de seguridad: CSS 4,5 s + JS) ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var seen = false;
    try { seen = sessionStorage.getItem("maran-splash") === "1"; } catch (_) {}
    var hide = function () { splash.classList.add("is-out"); };
    if (seen) { hide(); return; }
    try { sessionStorage.setItem("maran-splash", "1"); } catch (_) {}
    if (document.readyState === "complete") setTimeout(hide, 900);
    else window.addEventListener("load", function () { setTimeout(hide, 700); });
    setTimeout(hide, 3200);
  }

  /* ---------- Cabecera: sombra al hacer scroll + barra de progreso ---------- */
  function initHeader() {
    var header = $(".site-header");
    var bar = $("[data-progress]");
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Menú móvil ---------- */
  function initMenu() {
    var btn = $("[data-menu-toggle]");
    var menu = $("#mobile-menu");
    if (!btn || !menu) return;
    function set(open) {
      document.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector("[data-menu-label]").textContent = open ? "Cerrar" : "Menú";
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        var first = menu.querySelector("a");
        if (first) setTimeout(function () { first.focus(); }, 300);
      }
    }
    btn.addEventListener("click", function () {
      set(!document.body.classList.contains("menu-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) { set(false); btn.focus(); }
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    matchMedia("(min-width: 960px)").addEventListener("change", function (e) { if (e.matches) set(false); });
  }

  /* ---------- Revelados al hacer scroll (threshold bajo + red de 6 s) ---------- */
  function initReveals() {
    var items = $$(".reveal, [data-rule], .clip-reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var delay = parseFloat(e.target.getAttribute("data-delay") || "0");
          if (delay) e.target.style.transitionDelay = delay + "s";
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------- Titular por líneas (preserva <br> y <em>, gotcha A.4) ---------- */
  function splitLines(el) {
    if (el.getAttribute("data-split-done")) return [];
    el.setAttribute("data-split-done", "1");
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    var groups = [[]];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeName === "BR") { groups.push([]); return; }
      groups[groups.length - 1].push(node.cloneNode(true));
    });
    el.innerHTML = "";
    var inners = [];
    groups.forEach(function (nodes) {
      var line = document.createElement("span");
      line.className = "split-line";
      line.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      nodes.forEach(function (n) { inner.appendChild(n); });
      line.appendChild(inner);
      el.appendChild(line);
      inners.push(inner);
    });
    return inners;
  }

  function initHeroTitle() {
    if (!window.gsap) return;
    $$("[data-split]").forEach(function (el) {
      var inners = splitLines(el);
      if (!inners.length) return;
      gsap.from(inners, {
        yPercent: 108,
        duration: 1.25,
        ease: "expo.out",
        stagger: 0.11,
        delay: document.querySelector("[data-splash]:not(.is-out)") ? 0.9 : 0.15
      });
    });
  }

  /* ---------- Parallax suave de imágenes (≤ 40 px) ---------- */
  function initParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    $$("[data-parallax]").forEach(function (frame) {
      var img = frame.querySelector("img");
      if (!img) return;
      gsap.fromTo(img, { yPercent: -4 }, {
        yPercent: 4,
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    });
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var out = el.querySelector("[data-count-value]") || el;
      var start = null, dur = 1800;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        out.textContent = Math.round(target * eased).toString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    nums.forEach(function (el) {
      var out = el.querySelector("[data-count-value]") || el;
      out.textContent = "0";
      io.observe(el);
    });
    // Red de seguridad: si algo falla, mostrar la cifra real
    setTimeout(function () {
      nums.forEach(function (el) {
        var out = el.querySelector("[data-count-value]") || el;
        if (out.textContent === "0") out.textContent = el.getAttribute("data-count");
      });
    }, 6000);
  }

  /* ---------- Índice lateral de áreas (servicios) ---------- */
  function initPracticeNav() {
    var links = $$(".practice-nav a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var a = map[e.target.id];
          if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Formularios → correo (no se envía nada a terceros) ---------- */
  function initForms() {
    var to = contact.email || "maran.abogados@gmail.com";
    $$("form[data-mailto]").forEach(function (form) {
      if (form.getAttribute("data-bound")) return;
      form.setAttribute("data-bound", "1");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var subject = form.getAttribute("data-subject") || "Solicitud de consulta desde la web";
        var lines = [];
        $$("input, textarea, select", form).forEach(function (field) {
          if (!field.name || field.type === "checkbox" || field.type === "submit") return;
          if (field.type === "radio" && !field.checked) return;
          var label = field.getAttribute("data-label") || field.name;
          lines.push(label + ": " + (field.value || "").trim());
        });
        lines.push("");
        lines.push("— Enviado desde el formulario de la web. El remitente ha aceptado la política de privacidad.");
        var href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
        var status = form.querySelector("[data-status]");
        if (status) status.textContent = "Se abrirá su aplicación de correo con el mensaje preparado. Solo tiene que pulsar «Enviar».";
        window.location.href = href;
      });
    });
  }

  /* ---------- Año del pie ---------- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function boot() {
    safe(initSplash, "initSplash");
    safe(initHeader, "initHeader");
    safe(initMenu, "initMenu");
    safe(initReveals, "initReveals");
    safe(initCounters, "initCounters");
    safe(initPracticeNav, "initPracticeNav");
    safe(initForms, "initForms");
    safe(initYear, "initYear");
    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroTitle, "initHeroTitle");
      if (!reduced) safe(initParallax, "initParallax");
    }
    root.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
