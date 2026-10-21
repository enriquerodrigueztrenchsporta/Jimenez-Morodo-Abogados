/* =============================================================
   Cuestionario de la Ley de la Segunda Oportunidad — ENVÍO
   Prepara la solicitud y la envía por HTTPS (POST JSON) al punto de
   recepción configurado en lib/manifest.js:

     forms.segundaOportunidad.endpoint

   Receptor actual: FormSubmit (https://formsubmit.co/ajax/<correo>),
   que reenvía cada solicitud a info@jimenezmorodoabogados.es. Es compatible con
   cualquier receptor que acepte JSON (otro proveedor o una función
   serverless propia). La dirección del receptor es pública por
   naturaleza; las credenciales nunca deben estar en este repositorio.

   Si no hay punto de recepción configurado, send() falla con el
   código "not-configured": el formulario NUNCA simula un envío.
   Este módulo no escribe los datos en la consola ni los guarda en el
   navegador.
   ============================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.JimenezMorodoLSO = root.JimenezMorodoLSO || {}; root.JimenezMorodoLSO.submit = api; }
})(this, function () {
  "use strict";

  var STATUS_LABELS = {
    "continua": "Continúa: encaja en los criterios iniciales",
    "revision": "Requiere revisión",
    "no-supera": "No supera el filtro inicial"
  };

  function SubmitError(code) {
    var e = new Error(code);
    e.code = code;
    return e;
  }

  /**
   * Construye el cuerpo de la solicitud.
   * ctx = { contact: {nombre, telefono, email, comentarios},
   *         answers: [{id, question, answer}] (engine.describe),
   *         status, rulesVersion, page, now (Date) }
   * Los nombres de campo son estables para que el despacho pueda
   * filtrar o automatizar la recepción.
   */
  function buildPayload(ctx) {
    var c = ctx.contact || {};
    var now = ctx.now || new Date();
    var payload = {
      // Campos de control del receptor (FormSubmit): asunto, respuesta al
      // remitente, formato del correo y campo trampa para robots
      _subject: "Ley de la Segunda Oportunidad · " + (STATUS_LABELS[ctx.status] || ctx.status),
      _replyto: (c.email || "").trim(),
      _template: "table",
      _captcha: "false",
      _honey: c._honey || "",
      nombre: (c.nombre || "").trim(),
      telefono: (c.telefono || "").trim(),
      email: (c.email || "").trim(),
      comentarios: (c.comentarios || "").trim(),
      politica_privacidad_leida: c.privacidad ? "Sí" : "No",
      resultado_filtro: STATUS_LABELS[ctx.status] || ctx.status,
      resultado_codigo: ctx.status,
      criterios_version: ctx.rulesVersion || "",
      fecha_envio: now.toISOString(),
      pagina: ctx.page || ""
    };
    (ctx.answers || []).forEach(function (a, i) {
      payload["p" + (i + 1) + "_" + a.id] = a.question + " → " + a.answer;
    });
    return payload;
  }

  /**
   * Envía la solicitud. Resuelve solo si el servidor confirma la
   * recepción (HTTP 2xx y, si responde JSON, sin indicar error).
   * Rechaza con error.code: "not-configured" | "timeout" | "network" | "rejected".
   */
  function send(payload, opts) {
    opts = opts || {};
    var endpoint = (opts.endpoint || "").trim();
    var doFetch = opts.fetch || (typeof fetch === "function" ? fetch : null);
    if (!endpoint || !/^https:\/\//.test(endpoint)) return Promise.reject(SubmitError("not-configured"));
    if (!doFetch) return Promise.reject(SubmitError("network"));

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = null;
    var timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        if (controller) controller.abort();
        reject(SubmitError("timeout"));
      }, opts.timeoutMs || 15000);
    });

    var request = doFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      referrerPolicy: "strict-origin-when-cross-origin",
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res || !res.ok) throw SubmitError("rejected");
      return res.text().then(function (text) {
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (_) { body = null; }
        // FormSubmit responde {"success":"true"} o {"success":"false"} (texto);
        // también "false" mientras el formulario no esté activado.
        var negative = function (v) { return v === false || v === "false"; };
        if (body && (negative(body.ok) || negative(body.success) || body.error || body.errors)) throw SubmitError("rejected");
        return { ok: true };
      });
    }, function (err) {
      throw (err && err.code) ? err : SubmitError("network");
    });

    return Promise.race([request, timeout]).then(function (r) {
      clearTimeout(timer);
      return r;
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  return { buildPayload: buildPayload, send: send, STATUS_LABELS: STATUS_LABELS };
});
