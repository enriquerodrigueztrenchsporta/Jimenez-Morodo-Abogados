/* =============================================================
   Cuestionario de la Ley de la Segunda Oportunidad — INTERFAZ
   Estado e interacción del componente. Se monta en cualquier
   elemento con [data-lso-quiz] que contenga un [data-lso-app]:

     <div data-lso-quiz> … <div data-lso-app hidden></div> … </div>

   Depende de (cargados antes con defer):
     lso/content.js  -> textos
     lso/rules.js    -> criterios
     lso/engine.js   -> evaluación
     lso/validate.js -> validación del formulario
     lso/submit.js   -> envío
   Los estilos están en styles.css (sección «Segunda Oportunidad»).
   ============================================================= */
(function () {
  "use strict";

  var NS = window.MaranLSO || {};
  var brand = window.__BRAND__ || {};
  var contact = brand.contact || {};
  var formsCfg = (brand.forms && brand.forms.segundaOportunidad) || {};

  var EMAIL = contact.email || "info@maranabogados.es";
  var PHONE = contact.phone || "+34 624 566 690";
  var PHONE_HREF = contact.phoneHref || "+34624566690";

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)");
  function reduced() { return !!(reduceMotion && reduceMotion.matches); }

  var OUT_MS = 180;     // salida del paso actual
  var IN_MS = 340;      // entrada del paso siguiente (coincide con el CSS)
  var ADVANCE_MS = 320; // pausa tras elegir respuesta, para ver la selección

  /* ---------- Utilidad para crear nodos (texto siempre con textContent) ---------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v; // solo para marcado estático propio
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  var ICONS = {
    "continua": '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 10.4l2.6 2.6L14.2 7.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "revision": '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10 5.6v5.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="10" cy="14" r="1.1" fill="currentColor"/></svg>',
    "no-supera": '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 10h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  };

  var uid = 0;

  function Quiz(rootEl) {
    this.root = rootEl;
    this.app = rootEl.querySelector("[data-lso-app]");
    this.questions = NS.content.questions;
    this.n = this.questions.length;
    this.id = "lso" + (++uid);
    this.state = { step: 0, answers: {}, returnToResult: false, submitting: false, submitted: false, attempted: false };
    this.anim = 0;
    this.advanceTimer = null;
    this.arrowNav = false;
    this.render();
  }

  /* ---------- Render inicial ---------- */
  Quiz.prototype.render = function () {
    var self = this;
    this.progressLabel = h("p", { class: "lso-progress__label" });
    this.progressBar = h("span", { class: "lso-progress__bar" });
    this.progress = h("div", { class: "lso-progress" }, [
      this.progressLabel,
      h("span", { class: "lso-progress__track", "aria-hidden": "true" }, [this.progressBar])
    ]);

    this.stage = h("div", { class: "lso-stage" });
    this.steps = this.questions.map(function (q, i) { return self.renderQuestion(q, i); });
    this.steps.forEach(function (s) { self.stage.appendChild(s); });

    this.result = h("div", { class: "lso-result", hidden: true });
    this.stage.appendChild(this.result);

    this.live = h("p", { class: "sr-only", "aria-live": "polite", "aria-atomic": "true" });

    this.app.appendChild(this.progress);
    this.app.appendChild(this.stage);
    this.app.appendChild(this.live);
    this.app.hidden = false;
    this.root.classList.add("is-enhanced");

    // Teclas de flecha dentro de un grupo de radios: cambian la selección
    // sin avanzar (el avance automático solo con clic, toque o espacio).
    this.stage.addEventListener("keydown", function (e) {
      if (/^Arrow/.test(e.key)) self.arrowNav = true;
      if (e.key === "Enter" && e.target.type === "radio") {
        e.preventDefault();
        var i = self.state.step;
        if (i < self.n && self.state.answers[self.questions[i].id]) self.next();
      }
    });
    this.stage.addEventListener("keyup", function (e) { if (/^Arrow/.test(e.key)) self.arrowNav = false; });

    this.form = this.renderForm();
    this.update();
  };

  Quiz.prototype.renderQuestion = function (q, i) {
    var self = this;
    var name = this.id + "-" + q.id;
    var legendId = name + "-legend";
    var options = q.options.map(function (o, j) {
      var input = h("input", { type: "radio", name: name, value: o.id, class: "lso-option__input" });
      input.addEventListener("change", function () { self.answer(q.id, o.id); });
      input.addEventListener("click", function () { self.scheduleAdvance(q.id, o.id); });
      return h("label", { class: "lso-option" }, [
        input,
        h("span", { class: "lso-option__box" }, [
          h("span", { class: "lso-option__key", "aria-hidden": "true", text: String.fromCharCode(65 + j) }),
          h("span", { class: "lso-option__label", text: o.label }),
          h("span", { class: "lso-option__check", "aria-hidden": "true" })
        ])
      ]);
    });

    var back = h("button", { type: "button", class: "lso-back", text: "Anterior" });
    back.insertBefore(h("span", { class: "arrow", "aria-hidden": "true", text: "← " }), back.firstChild);
    back.addEventListener("click", function () { self.prev(); });
    if (i === 0) back.classList.add("is-hidden");

    var next = h("button", { type: "button", class: "btn lso-next", disabled: true }, [
      i === this.n - 1 ? "Ver resultado " : "Siguiente ",
      h("span", { class: "arrow", "aria-hidden": "true", text: "→" })
    ]);
    next.addEventListener("click", function () { self.next(); });

    var fs = h("fieldset", { class: "lso-step", "aria-labelledby": legendId, hidden: i !== 0 }, [
      h("legend", { class: "lso-question", id: legendId, text: q.text }),
      h("div", { class: "lso-options" }, options),
      h("div", { class: "lso-nav" }, [back, next])
    ]);
    fs._next = next;
    return fs;
  };

  /* ---------- Formulario de contacto (se crea una vez y se conserva) ---------- */
  Quiz.prototype.renderForm = function () {
    var self = this;
    var t = NS.content.form;
    var p = this.id + "-f-";
    var configured = /^https:\/\//.test((formsCfg.endpoint || "").trim());

    function field(key, label, input, help) {
      var errId = p + key + "-error";
      var helpId = help ? p + key + "-help" : null;
      input.id = p + key;
      input.setAttribute("aria-describedby", (helpId ? helpId + " " : "") + errId);
      var wrap = h("div", { class: "field lso-field" }, [
        h("label", { for: input.id, text: label }),
        input,
        help ? h("p", { class: "form__note", id: helpId, text: help }) : null,
        h("p", { class: "lso-field__error", id: errId })
      ]);
      self.fields[key] = { input: input, error: wrap.querySelector(".lso-field__error"), validate: NS.validate[key] };
      return wrap;
    }
    this.fields = {};

    var L = NS.validate.LIMITS;
    var nombre = field("nombre", "Nombre y apellidos *",
      h("input", { name: "nombre", type: "text", autocomplete: "name", maxlength: L.nombre, required: true }));
    var telefono = field("telefono", "Teléfono *",
      h("input", { name: "telefono", type: "tel", inputmode: "tel", autocomplete: "tel", maxlength: L.telefono, required: true }));
    var email = field("email", "Correo electrónico *",
      h("input", { name: "email", type: "email", autocomplete: "email", maxlength: L.email, required: true, spellcheck: "false" }));
    var comentarios = field("comentarios", "Comentarios adicionales (opcional)",
      h("textarea", { name: "comentarios", maxlength: L.comentarios, rows: "3" }),
      "No incluyas DNI, datos bancarios, contraseñas ni documentos. Si es necesaria más información, te la pediremos.");

    var consentInput = h("input", { type: "checkbox", name: "privacidad", id: p + "privacidad", required: true, "aria-describedby": p + "privacidad-error" });
    var consentErr = h("p", { class: "lso-field__error", id: p + "privacidad-error" });
    this.fields.privacidad = { input: consentInput, error: consentErr, validate: NS.validate.privacidad, checkbox: true };

    var info = h("div", { class: "form__info lso-form__info", id: p + "info" });
    info.innerHTML =
      '<p><strong>Información básica sobre protección de datos</strong></p>' +
      '<ul>' +
      '<li><strong>Responsable:</strong> Maran Abogados (' + EMAIL + ', ' + PHONE + '). Solo los abogados del despacho acceden a tu solicitud.</li>' +
      '<li><strong>Finalidad:</strong> estudiar tu consulta sobre la Ley de la Segunda Oportunidad y contactar contigo para continuar la valoración. Tus respuestas al cuestionario se envían junto con tus datos.</li>' +
      '<li><strong>Legitimación:</strong> aplicación, a petición tuya, de medidas precontractuales.</li>' +
      '<li><strong>Conservación:</strong> mientras se valora tu caso. Si el despacho no asume el caso, los datos se suprimen de inmediato; si lo asume, se conservan hasta que finalice el asunto, sin perjuicio de los plazos que exija la ley.</li>' +
      '<li><strong>Destinatarios:</strong> no se ceden datos a terceros salvo obligación legal. La solicitud llega al correo del despacho a través de FormSubmit, servicio de reenvío de formularios, y del correo de IONOS.</li>' +
      '<li><strong>Derechos:</strong> acceso, rectificación, supresión, oposición, limitación y portabilidad, escribiendo a ' + EMAIL + '. Puedes reclamar ante la Agencia Española de Protección de Datos.</li>' +
      '<li><strong>Más información:</strong> <a href="privacidad.html#segunda-oportunidad">Política de privacidad</a>.</li>' +
      '</ul>';

    var consent = h("div", { class: "lso-consent" }, [
      h("label", { class: "consent", for: consentInput.id }, [
        consentInput,
        h("span", { html: 'He leído la <a href="privacidad.html#segunda-oportunidad">Política de privacidad</a>. *' })
      ]),
      consentErr
    ]);

    // Campo trampa para robots: invisible y fuera del orden de tabulación
    this.honeypot = h("input", { type: "text", name: "_honey", tabindex: "-1", autocomplete: "off" });
    var hp = h("div", { class: "lso-hp", "aria-hidden": "true" }, [h("label", { text: "No rellenar" }, [this.honeypot])]);

    this.submitBtn = h("button", { type: "submit", class: "btn lso-submit" }, [
      h("span", { class: "lso-submit__label", text: t.submit }),
      h("span", { class: "arrow", "aria-hidden": "true", text: " →" })
    ]);
    this.formStatus = h("div", { class: "lso-form__status", role: "alert" });

    var pending = configured ? null : h("p", { class: "pending-block lso-form__pending",
      text: "Envío pendiente de activación: falta configurar el servicio de recepción de solicitudes. Hasta entonces, el formulario no enviará datos y te indicará cómo contactar con el despacho." });

    var form = h("form", { class: "form lso-form", novalidate: true, "aria-labelledby": p + "title", "aria-describedby": p + "info" }, [
      h("h4", { class: "lso-form__title", id: p + "title", text: t.title }),
      h("p", { class: "lso-form__text", text: t.text }),
      h("div", { class: "lso-form__grid" }, [nombre, telefono, email, comentarios]),
      hp,
      info,
      consent,
      pending,
      h("p", { class: "form__note", text: "* Campos obligatorios." }),
      h("div", { class: "lso-form__actions" }, [this.submitBtn]),
      this.formStatus
    ]);

    Object.keys(this.fields).forEach(function (k) {
      var f = self.fields[k];
      var evt = f.checkbox ? "change" : "blur";
      f.input.addEventListener(evt, function () { if (self.state.attempted) self.checkField(k); });
      if (!f.checkbox) f.input.addEventListener("input", function () {
        if (f.input.getAttribute("aria-invalid") === "true") self.checkField(k);
      });
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); self.submit(); });
    return form;
  };

  /* ---------- Estado ---------- */
  Quiz.prototype.answer = function (qid, oid) {
    this.state.answers[qid] = oid;
    this.update();
  };

  Quiz.prototype.scheduleAdvance = function (qid, oid) {
    var self = this;
    if (this.arrowNav) return;
    clearTimeout(this.advanceTimer);
    var step = this.state.step;
    this.advanceTimer = setTimeout(function () {
      if (self.state.step === step && self.state.answers[qid] === oid) self.next();
    }, reduced() ? 120 : ADVANCE_MS);
  };

  Quiz.prototype.next = function () {
    clearTimeout(this.advanceTimer);
    var i = this.state.step;
    if (i >= this.n || !this.state.answers[this.questions[i].id]) return;
    var to = (this.state.returnToResult || i === this.n - 1) ? this.n : i + 1;
    // Si al volver al resultado aún faltan respuestas, seguir por la primera pendiente
    if (to === this.n && !NS.engine.isComplete(this.questions, this.state.answers)) to = this.firstUnanswered();
    this.go(to);
  };

  Quiz.prototype.prev = function () {
    clearTimeout(this.advanceTimer);
    if (this.state.step > 0 && this.state.step < this.n) this.go(this.state.step - 1);
  };

  Quiz.prototype.firstUnanswered = function () {
    for (var i = 0; i < this.n; i++) if (!this.state.answers[this.questions[i].id]) return i;
    return this.n;
  };

  Quiz.prototype.edit = function (i) {
    this.state.returnToResult = true;
    this.go(i);
  };

  Quiz.prototype.restart = function () {
    clearTimeout(this.advanceTimer);
    this.state.answers = {};
    this.state.returnToResult = false;
    this.state.attempted = false;
    this.state.submitted = false;
    this.steps.forEach(function (s) {
      Array.prototype.forEach.call(s.querySelectorAll("input"), function (inp) { inp.checked = false; });
    });
    this.form.reset();
    this.clearErrors();
    this.formStatus.textContent = "";
    this.setBusy(false);
    this.go(0);
  };

  Quiz.prototype.update = function () {
    var self = this;
    this.steps.forEach(function (s, i) {
      s._next.disabled = !self.state.answers[self.questions[i].id];
    });
    var step = this.state.step;
    var atResult = step >= this.n;
    this.progressLabel.textContent = atResult ? "Resultado" : "Pregunta " + (step + 1) + " de " + this.n;
    this.progressBar.style.transform = "scaleX(" + (atResult ? 1 : (step + 1) / (this.n + 1)) + ")";
  };

  /* ---------- Transición entre pasos ---------- */
  Quiz.prototype.panel = function (i) { return i >= this.n ? this.result : this.steps[i]; };

  Quiz.prototype.go = function (to) {
    var self = this;
    var from = this.panel(this.state.step);
    var target = this.panel(to);
    var token = ++this.anim;

    // Cerrar cualquier transición a medias
    [].concat(this.steps, [this.result]).forEach(function (p) {
      p.classList.remove("is-leaving", "is-entering");
      if (p !== from) p.hidden = true;
    });
    this.stage.style.height = "";
    this.stage.classList.remove("is-animating");

    this.state.step = to;
    if (to >= this.n) { this.state.returnToResult = false; this.renderResult(); }
    this.update();
    this.live.textContent = to >= this.n ? "Resultado del cuestionario" : "Pregunta " + (to + 1) + " de " + this.n;

    function finish() {
      if (token !== self.anim) return;
      self.keepInView();
      self.focusStep(to);
    }

    if (from === target) { target.hidden = false; finish(); return; }
    if (reduced()) { from.hidden = true; target.hidden = false; finish(); return; }

    this.stage.style.height = this.stage.offsetHeight + "px";
    this.stage.classList.add("is-animating");
    from.classList.add("is-leaving");
    setTimeout(function () {
      if (token !== self.anim) return;
      from.hidden = true;
      from.classList.remove("is-leaving");
      target.classList.add("is-entering");
      target.hidden = false;
      self.stage.style.height = target.offsetHeight + "px";
      void target.offsetWidth; // fuerza el estado inicial antes de animar
      target.classList.remove("is-entering");
      finish();
      setTimeout(function () {
        if (token !== self.anim) return;
        self.stage.style.height = "";
        self.stage.classList.remove("is-animating");
      }, IN_MS + 40);
    }, OUT_MS);
  };

  // Si la cabecera del cuestionario ha quedado fuera de la vista, subir hasta ella
  Quiz.prototype.keepInView = function () {
    var offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    var top = this.progress.getBoundingClientRect().top;
    if (top < offset) {
      window.scrollBy({ top: top - offset, behavior: reduced() ? "auto" : "smooth" });
    }
  };

  Quiz.prototype.focusStep = function (i) {
    var el;
    if (i >= this.n) el = this.result.querySelector(".lso-result__title");
    else el = this.steps[i].querySelector("input:checked") || this.steps[i].querySelector("input");
    if (el) { try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); } }
  };

  /* ---------- Resultado ---------- */
  Quiz.prototype.renderResult = function () {
    var self = this;
    var ev = NS.engine.evaluate(this.questions, NS.rules, this.state.answers);
    this.evaluation = ev;
    var r = NS.content.results[ev.status];
    var box = this.result;
    box.innerHTML = "";
    box.setAttribute("data-status", ev.status);

    var badge = h("p", { class: "lso-badge" });
    badge.innerHTML = ICONS[ev.status];
    badge.appendChild(h("span", { text: r.badge }));

    box.appendChild(badge);
    box.appendChild(h("h3", { class: "lso-result__title", tabindex: "-1", text: r.title }));
    box.appendChild(h("p", { class: "lso-result__text", text: r.text }));
    box.appendChild(h("p", { class: "lso-result__note", text: r.note }));

    // Resumen de respuestas, con opción de modificar cada una
    var list = h("dl", { class: "lso-summary__list" });
    NS.engine.describe(this.questions, this.state.answers).forEach(function (a, i) {
      var edit = null;
      if (!self.state.submitted) {
        edit = h("button", { type: "button", class: "lso-summary__edit" }, [
          "Modificar", h("span", { class: "sr-only", text: ": " + a.question })
        ]);
        edit.addEventListener("click", function () { self.edit(i); });
      }
      list.appendChild(h("div", { class: "lso-summary__row" }, [
        h("dt", { text: a.question }),
        h("dd", null, [h("span", { text: a.answer }), edit])
      ]));
    });
    box.appendChild(h("details", { class: "lso-summary" }, [
      h("summary", { text: "Tus respuestas" }),
      list
    ]));

    if (r.form) {
      box.appendChild(this.state.submitted ? this.successPanel : this.form);
    } else {
      var contactBtn = h("a", { class: "btn", href: "contacto.html#formulario" }, [
        "Contactar con el despacho ", h("span", { class: "arrow", "aria-hidden": "true", text: "→" })
      ]);
      box.appendChild(h("div", { class: "lso-result__actions" }, [
        contactBtn,
        h("a", { class: "btn btn--ghost", href: "tel:" + PHONE_HREF, text: "Llamar al " + PHONE })
      ]));
    }

    var restart = h("button", { type: "button", class: "lso-restart" }, [
      h("span", { "aria-hidden": "true", text: "↺ " }), "Reiniciar cuestionario"
    ]);
    restart.addEventListener("click", function () { self.restart(); });
    box.appendChild(h("div", { class: "lso-result__foot" }, [restart]));
  };

  /* ---------- Validación ---------- */
  Quiz.prototype.values = function () {
    var f = this.fields;
    return {
      nombre: f.nombre.input.value,
      telefono: f.telefono.input.value,
      email: f.email.input.value,
      comentarios: f.comentarios.input.value,
      privacidad: f.privacidad.input.checked,
      _honey: this.honeypot.value
    };
  };

  Quiz.prototype.checkField = function (key) {
    var f = this.fields[key];
    var msg = f.validate(f.checkbox ? f.input.checked : f.input.value);
    f.error.textContent = msg;
    if (msg) f.input.setAttribute("aria-invalid", "true");
    else f.input.removeAttribute("aria-invalid");
    return !msg;
  };

  Quiz.prototype.clearErrors = function () {
    var self = this;
    Object.keys(this.fields).forEach(function (k) {
      self.fields[k].error.textContent = "";
      self.fields[k].input.removeAttribute("aria-invalid");
    });
  };

  Quiz.prototype.setBusy = function (busy) {
    this.state.submitting = busy;
    this.submitBtn.disabled = busy;
    this.submitBtn.setAttribute("aria-busy", busy ? "true" : "false");
    this.submitBtn.classList.toggle("is-loading", busy);
    this.submitBtn.querySelector(".lso-submit__label").textContent = busy ? "Enviando…" : NS.content.form.submit;
  };

  /* ---------- Envío ---------- */
  Quiz.prototype.submit = function () {
    var self = this;
    if (this.state.submitting || this.state.submitted) return; // evita envíos duplicados
    this.state.attempted = true;
    this.formStatus.textContent = "";

    var firstInvalid = null;
    Object.keys(this.fields).forEach(function (k) {
      if (!self.checkField(k) && !firstInvalid) firstInvalid = self.fields[k].input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var ev = NS.engine.evaluate(this.questions, NS.rules, this.state.answers);
    if (!ev.complete || !NS.content.results[ev.status].form) return;

    var payload = NS.submit.buildPayload({
      contact: this.values(),
      answers: NS.engine.describe(this.questions, this.state.answers),
      status: ev.status,
      rulesVersion: NS.rules.version,
      page: window.location.origin + window.location.pathname
    });

    this.setBusy(true);
    NS.submit.send(payload, { endpoint: formsCfg.endpoint }).then(function () {
      self.state.submitted = true;
      self.setBusy(false);
      self.showSuccess();
    }, function (err) {
      self.setBusy(false);
      self.showError(err && err.code);
    });
  };

  Quiz.prototype.showError = function (code) {
    var fallback = " Puedes llamarnos al " + PHONE + " o escribir a " + EMAIL + ".";
    var msg = {
      "not-configured": "El envío en línea de solicitudes todavía no está activado, por lo que tus datos no se han enviado." + fallback,
      "timeout": "No hemos podido confirmar la recepción de tu solicitud porque el servidor no ha respondido a tiempo. Inténtalo de nuevo en unos minutos." + fallback,
      "rejected": "El servidor no ha confirmado la recepción de tu solicitud. Inténtalo de nuevo." + fallback
    }[code] || ("No hemos podido enviar tu solicitud. Comprueba tu conexión e inténtalo de nuevo." + fallback);
    this.formStatus.textContent = msg;
  };

  Quiz.prototype.showSuccess = function () {
    var t = NS.content.form.success;
    var title = h("h4", { class: "lso-success__title", tabindex: "-1", text: t.title });
    var panel = h("div", { class: "lso-success", role: "status" }, [
      h("p", { class: "lso-badge", html: ICONS["continua"] + "<span>Solicitud enviada</span>" }),
      title,
      h("p", { text: t.text })
    ]);
    this.successPanel = panel;
    this.form.replaceWith(panel);
    // Tras el envío ya no se pueden modificar respuestas
    Array.prototype.forEach.call(this.result.querySelectorAll(".lso-summary__edit"), function (b) { b.remove(); });
    try { title.focus({ preventScroll: true }); } catch (_) { title.focus(); }
  };

  /* ---------- Arranque ---------- */
  function boot() {
    if (!NS.content || !NS.rules || !NS.engine || !NS.validate || !NS.submit) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-lso-quiz]"), function (el) {
      if (el.getAttribute("data-lso-ready")) return;
      el.setAttribute("data-lso-ready", "1");
      try { new Quiz(el); } catch (e) { el.classList.add("is-failed"); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
