// Pruebas del cuestionario de la Ley de la Segunda Oportunidad.
// Ejecutar: node --test tools/tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const content = require("../../lso/content.js");
const rules = require("../../lso/rules.js");
const engine = require("../../lso/engine.js");
const validate = require("../../lso/validate.js");
const submit = require("../../lso/submit.js");

const Q = content.questions;
const BASE = { residencia: "si", importe: "10000-5000000", tipo: "prestamos-tarjetas", anterior: "nunca" };
const evaluate = (answers) => engine.evaluate(Q, rules, answers);

// Especificación del despacho, escrita de forma independiente a rules.js
function expected(a) {
  if (a.residencia === "no" || a.importe === "menos-10000" || a.importe === "mas-5000000") return "no-supera";
  if (a.importe === "no-lo-se" || a.anterior !== "nunca") return "revision";
  return "continua";
}

test("las preguntas y respuestas son exactamente las del cuestionario original", () => {
  assert.deepEqual(Q.map((q) => q.text), [
    "¿Resides habitualmente en España?",
    "¿A cuánto asciende aproximadamente tu deuda total?",
    "¿Qué tipo de deudas tienes?",
    "¿Te has acogido anteriormente a la Ley de la Segunda Oportunidad?",
  ]);
  assert.deepEqual(Q.map((q) => q.options.map((o) => o.label)), [
    ["Sí", "No"],
    ["Menos de 10.000 €", "Entre 10.000 € y 5.000.000 €", "Más de 5.000.000 €", "No lo sé con exactitud"],
    ["Préstamos personales o tarjetas de crédito", "Deudas con Hacienda o la Seguridad Social",
      "Deudas con particulares o empresas", "Varias de las anteriores", "Otras"],
    ["No, nunca", "Sí, y obtuve la exoneración de mis deudas", "Sí, pero el procedimiento sigue en curso",
      "Sí, pero no obtuve la exoneración"],
  ]);
});

test("cada respuesta tiene una regla válida y no hay reglas sobrantes", () => {
  assert.deepEqual(engine.checkRules(Q, rules), []);
});

test("cada estado tiene textos de resultado", () => {
  rules.priority.forEach((s) => {
    const r = content.results[s];
    assert.ok(r && r.title && r.text && r.note, `faltan textos para ${s}`);
  });
  assert.equal(content.results["continua"].form, true);
  assert.equal(content.results["revision"].form, true);
  assert.equal(content.results["no-supera"].form, false);
});

test("P1: ambas respuestas", () => {
  assert.equal(evaluate({ ...BASE, residencia: "si" }).status, "continua");
  assert.equal(evaluate({ ...BASE, residencia: "no" }).status, "no-supera");
});

test("P2: las cuatro respuestas («No lo sé» nunca descarta)", () => {
  assert.equal(evaluate({ ...BASE, importe: "menos-10000" }).status, "no-supera");
  assert.equal(evaluate({ ...BASE, importe: "10000-5000000" }).status, "continua");
  assert.equal(evaluate({ ...BASE, importe: "mas-5000000" }).status, "no-supera");
  assert.equal(evaluate({ ...BASE, importe: "no-lo-se" }).status, "revision");
});

test("P3: ninguna de las cinco respuestas excluye", () => {
  Q[2].options.forEach((o) => assert.equal(evaluate({ ...BASE, tipo: o.id }).status, "continua", o.id));
});

test("P4: las cuatro respuestas; ninguna excluye automáticamente", () => {
  assert.equal(evaluate({ ...BASE, anterior: "nunca" }).status, "continua");
  ["si-exonerado", "si-en-curso", "si-sin-exoneracion"].forEach((id) =>
    assert.equal(evaluate({ ...BASE, anterior: id }).status, "revision", id));
});

test("las 160 combinaciones coinciden con la especificación", () => {
  let n = 0;
  for (const a of Q[0].options) for (const b of Q[1].options) for (const c of Q[2].options) for (const d of Q[3].options) {
    const answers = { residencia: a.id, importe: b.id, tipo: c.id, anterior: d.id };
    assert.equal(evaluate(answers).status, expected(answers), JSON.stringify(answers));
    n++;
  }
  assert.equal(n, 160);
});

test("prioridad con varias condiciones: no supera > revisión > continúa", () => {
  const r1 = evaluate({ residencia: "no", importe: "no-lo-se", tipo: "otras", anterior: "si-en-curso" });
  assert.equal(r1.status, "no-supera");
  assert.deepEqual(r1.reasons.map((r) => r.question), ["residencia"]);
  const r2 = evaluate({ ...BASE, importe: "no-lo-se", anterior: "si-exonerado" });
  assert.equal(r2.status, "revision");
  assert.deepEqual(r2.reasons.map((r) => r.question), ["importe", "anterior"]);
});

test("sin todas las respuestas no hay resultado", () => {
  assert.deepEqual(evaluate({}), { complete: false, status: null, reasons: [] });
  assert.equal(evaluate({ residencia: "no" }).complete, false);
  assert.equal(evaluate({ ...BASE, tipo: "inexistente" }).complete, false);
});

test("cambiar una respuesta anterior cambia el resultado (sin estado residual)", () => {
  const answers = { ...BASE, residencia: "no" };
  assert.equal(evaluate(answers).status, "no-supera");
  answers.residencia = "si";
  assert.equal(evaluate(answers).status, "continua");
  answers.importe = "no-lo-se";
  assert.equal(evaluate(answers).status, "revision");
});

test("una regla ausente o mal escrita se trata como revisión, nunca como descarte", () => {
  const broken = JSON.parse(JSON.stringify(rules));
  delete broken.answers.tipo.otras;
  broken.answers.anterior.nunca = "contiuna";
  assert.equal(engine.evaluate(Q, broken, { ...BASE, tipo: "otras" }).status, "revision");
  assert.equal(engine.evaluate(Q, broken, BASE).status, "revision");
  assert.equal(engine.checkRules(Q, broken).length, 2);
});

test("describe devuelve las respuestas en texto legible", () => {
  const d = engine.describe(Q, BASE);
  assert.equal(d.length, 4);
  assert.equal(d[0].answer, "Sí");
  assert.equal(d[1].answer, "Entre 10.000 € y 5.000.000 €");
});

test("validación: nombre", () => {
  assert.notEqual(validate.nombre(""), "");
  assert.notEqual(validate.nombre("   "), "");
  assert.notEqual(validate.nombre("A"), "");
  assert.equal(validate.nombre("Ana García López"), "");
  assert.notEqual(validate.nombre("x".repeat(121)), "");
});

test("validación: teléfono", () => {
  ["600123456", "600 123 456", "912-345-678", "+34 600 123 456", "0034 600123456", "+44 20 7946 0958", "+34 600 12 34 56"]
    .forEach((t) => assert.equal(validate.telefono(t), "", t));
  ["", "123456789", "60012345", "6001234567", "abc", "600123456a", "+34 12", "+1234567890123456"]
    .forEach((t) => assert.notEqual(validate.telefono(t), "", t));
});

test("validación: correo electrónico", () => {
  ["ana@dominio.es", "a.b+c@sub.dominio.com"].forEach((e) => assert.equal(validate.email(e), "", e));
  ["", "ana", "ana@", "ana@dominio", "ana @dominio.es", "@dominio.es", "ana@dominio.e"].forEach((e) =>
    assert.notEqual(validate.email(e), "", e));
});

test("validación: comentarios opcionales, privacidad obligatoria", () => {
  assert.equal(validate.comentarios(""), "");
  assert.notEqual(validate.comentarios("x".repeat(1001)), "");
  assert.notEqual(validate.privacidad(false), "");
  assert.equal(validate.privacidad(true), "");
  const ok = validate.all({ nombre: "Ana Pérez", telefono: "600123456", email: "ana@dominio.es", comentarios: "", privacidad: true });
  assert.deepEqual(ok, { valid: true, errors: {} });
  const bad = validate.all({ nombre: "", telefono: "1", email: "x", comentarios: "", privacidad: false });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["email", "nombre", "privacidad", "telefono"]);
});

const ctx = {
  contact: { nombre: " Ana Pérez ", telefono: "600123456", email: "ana@dominio.es", comentarios: "", privacidad: true, _honey: "" },
  answers: engine.describe(Q, BASE),
  status: "continua",
  rulesVersion: rules.version,
  page: "https://example.test/Maran-Abogados/index.html",
  now: new Date("2026-10-20T10:00:00Z"),
};

test("el envío incluye contacto, respuestas, estado y fecha", () => {
  const p = submit.buildPayload(ctx);
  assert.equal(p.nombre, "Ana Pérez");
  assert.equal(p.email, "ana@dominio.es");
  assert.equal(p.resultado_codigo, "continua");
  assert.equal(p.fecha_envio, "2026-10-20T10:00:00.000Z");
  assert.equal(p.criterios_version, rules.version);
  assert.equal(p.p1_residencia, "¿Resides habitualmente en España? → Sí");
  assert.equal(p.p4_anterior, "¿Te has acogido anteriormente a la Ley de la Segunda Oportunidad? → No, nunca");
  assert.equal(p.politica_privacidad_leida, "Sí");
});

const res = (status, body) => ({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(body) });

test("sin punto de recepción configurado no se simula el envío", async () => {
  let called = false;
  const f = () => { called = true; return Promise.resolve(res(200, "")); };
  await assert.rejects(submit.send({}, { endpoint: "", fetch: f }), { code: "not-configured" });
  await assert.rejects(submit.send({}, { endpoint: "http://inseguro.test", fetch: f }), { code: "not-configured" });
  assert.equal(called, false);
});

test("éxito solo si el servidor confirma la recepción", async () => {
  let req;
  const f = (url, init) => { req = { url, init }; return Promise.resolve(res(200, '{"ok":true}')); };
  assert.deepEqual(await submit.send({ a: 1 }, { endpoint: "https://recepcion.test/f", fetch: f }), { ok: true });
  assert.equal(req.init.method, "POST");
  assert.equal(req.init.credentials, "omit");
  assert.equal(req.init.body, '{"a":1}');
});

test("respuesta de FormSubmit: success en texto", async () => {
  const f = () => Promise.resolve(res(200, '{"success":"true","message":"The form was submitted successfully."}'));
  assert.deepEqual(await submit.send({}, { endpoint: "https://formsubmit.co/ajax/x@y.es", fetch: f }), { ok: true });
});

test("campos de control del receptor", () => {
  const p = submit.buildPayload(ctx);
  assert.equal(p._replyto, "ana@dominio.es");
  assert.equal(p._honey, "");
  assert.ok(!("_gotcha" in p));
});

test("errores del servidor, respuestas negativas, red y tiempo de espera", async () => {
  const ep = { endpoint: "https://recepcion.test/f" };
  await assert.rejects(submit.send({}, { ...ep, fetch: () => Promise.resolve(res(500, "")) }), { code: "rejected" });
  await assert.rejects(submit.send({}, { ...ep, fetch: () => Promise.resolve(res(200, '{"ok":false}')) }), { code: "rejected" });
  await assert.rejects(submit.send({}, { ...ep, fetch: () => Promise.resolve(res(200, '{"errors":[{"message":"x"}]}')) }), { code: "rejected" });
  await assert.rejects(submit.send({}, { ...ep, fetch: () => Promise.resolve(res(200, '{"success":"false","message":"This form needs Activation."}')) }), { code: "rejected" });
  await assert.rejects(submit.send({}, { ...ep, fetch: () => Promise.reject(new TypeError("Failed to fetch")) }), { code: "network" });
  await assert.rejects(submit.send({}, { ...ep, timeoutMs: 30, fetch: () => new Promise(() => {}) }), { code: "timeout" });
});
