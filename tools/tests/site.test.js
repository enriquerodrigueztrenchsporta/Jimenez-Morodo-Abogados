// Pruebas de las páginas generadas (ejecutar después de python tools/build.py).
// Ejecutar: node --test tools/tests/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

test("portada: hero, sección LSO y «El despacho» en ese orden, sin duplicados", () => {
  const html = read("index.html");
  const at = (s) => html.indexOf(s);
  const hero = at('aria-labelledby="hero-title"');
  const strip = at('class="index-strip"');
  const lso = at('id="segunda-oportunidad"');
  const despacho = at('aria-labelledby="despacho-title"');
  const compromiso = at('aria-labelledby="compromiso-title"');
  const servicios = at('aria-labelledby="servicios-title"');
  [hero, strip, lso, despacho, compromiso, servicios].forEach((i) => assert.ok(i > 0));
  assert.ok(hero < strip && strip < lso && lso < despacho && despacho < compromiso && compromiso < servicios);
  // Entre el hero y la sección LSO solo está la cinta de áreas
  const between = html.slice(html.indexOf("</section>", hero), lso);
  assert.equal((between.match(/<section/g) || []).length, 1, "solo la propia sección LSO");
  assert.equal((html.match(/id="cuestionario-segunda-oportunidad"/g) || []).length, 1);
  assert.equal((html.match(/data-lso-quiz/g) || []).length, 1);
  assert.equal((html.match(/Abogados expertos<br>en Derecho Civil/g) || []).length, 1, "hero original intacto");
});

test("portada: carga los módulos del cuestionario en orden y antes de main.js", () => {
  const html = read("index.html");
  const order = ["lib/manifest.js", "lso/content.js", "lso/rules.js", "lso/engine.js", "lso/validate.js",
    "lso/submit.js", "lso/quiz.js", "main.js"].map((s) => html.indexOf(`src="${s}?v=`));
  order.forEach((i) => assert.ok(i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("servicios: seis áreas en portada, la LSO la primera y sin duplicados", () => {
  const index = read("index.html");
  const nums = [...index.matchAll(/<span class="service__num">([IVX]+)\.<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(nums, ["I", "II", "III", "IV", "V", "VI"]);
  const titles = [...index.matchAll(/<h3 class="service__title">([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.equal(titles[0], "Ley de la Segunda Oportunidad");
  assert.equal(titles.filter((x) => x === "Ley de la Segunda Oportunidad").length, 1);
  const serv = read("servicios.html");
  assert.equal((serv.match(/<article class="practice" id="segunda-oportunidad"/g) || []).length, 1);
  const order = [...serv.matchAll(/<article class="practice" id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ["segunda-oportunidad", "derecho-civil", "responsabilidad-civil", "derecho-penal", "extranjeria"]);
  assert.match(serv, /<a href="#segunda-oportunidad"><span>I\.<\/span> Ley de la Segunda Oportunidad<\/a>/);
  const kickers = [...serv.matchAll(/<p class="kicker reveal">([IVX]+)\. Área<\/p>/g)].map((m) => m[1]);
  assert.deepEqual(kickers, ["I", "II", "III", "IV", "V"]);
});

test("menú: cinco secciones con desplegable; la LSO solo como apartado de Servicios", () => {
  pages.forEach((f) => {
    const nav = read(f).match(/<nav class="nav"[\s\S]*?<\/nav>/)[0];
    const top = [...nav.matchAll(/<li class="nav__item">\s*<a href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(top, ["index.html", "nosotros.html", "servicios.html", "blog.html", "contacto.html"], f);
    assert.equal((nav.match(/class="nav__sub"/g) || []).length, 5, f);
    const servSub = nav.match(/Apartados de Servicios">([\s\S]*?)<\/ul>/)[1];
    assert.match(servSub.match(/<a href="([^"]+)"/)[1], /ley-segunda-oportunidad\.html/, f);
  });
});

test("página de detalle: H1 único, canonical, descripción y datos estructurados válidos", () => {
  const html = read("ley-segunda-oportunidad.html");
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.match(html, /<title>Ley de la Segunda Oportunidad · Maran Abogados<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/ley-segunda-oportunidad\.html">/);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.deepEqual(blocks.map((b) => b["@type"]), ["Service", "FAQPage"]);
  assert.equal(blocks[1].mainEntity.length, (html.match(/class="faq__item/g) || []).length);
  assert.match(html, /href="index\.html#cuestionario-segunda-oportunidad"/);
  assert.doesNotMatch(html, /aggregateRating|review|address/i);
});

test("sitemap.xml incluye la nueva página y excluye la 404", () => {
  const xml = read("sitemap.xml");
  assert.match(xml, /ley-segunda-oportunidad\.html<\/loc>/);
  assert.doesNotMatch(xml, /404\.html/);
});

test("enlaces y recursos internos: relativos, existentes y con anclas válidas", () => {
  const problems = [];
  const idCache = {};
  pages.forEach((f) => {
    const html = read(f);
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
      if (url.startsWith("/")) { problems.push(`${f}: ruta absoluta ${url} (falla bajo /Maran-Abogados/)`); continue; }
      const [pathPart, hash] = url.split("#");
      const file = pathPart.split("?")[0] || f;
      if (!fs.existsSync(path.join(ROOT, file))) { problems.push(`${f}: no existe ${file}`); continue; }
      if (hash && file.endsWith(".html")) {
        idCache[file] = idCache[file] || idsOf(read(file));
        if (!idCache[file].has(hash)) problems.push(`${f}: no existe el ancla #${hash} en ${file}`);
      }
    }
  });
  assert.deepEqual(problems, []);
});

test("ningún secreto ni dato personal en el código público del cuestionario", () => {
  const files = fs.readdirSync(path.join(ROOT, "lso")).map((f) => path.join("lso", f)).concat(["lib/manifest.js"]);
  files.forEach((f) => {
    const src = read(f);
    assert.doesNotMatch(src, /(api[_-]?key|secret|token|password|contraseña)\s*[:=]\s*["'][^"']+["']/i, f);
    assert.doesNotMatch(src, /console\.(log|info|debug)/, f);
    assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB/, f);
  });
});


test("producción: indexación y sitemap coherentes con la dirección publicada", () => {
  const sitemap = read("sitemap.xml");
  const home = sitemap.match(/<loc>(https:\/\/[^<]+)<\/loc>/)[1];
  assert.equal(read("robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${home}sitemap.xml\n`);
  pages.forEach((file) => {
    const html = read(file);
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/, file);
    if (file === "404.html") {
      assert.match(html, /name="robots" content="noindex, follow"/, file);
      assert.doesNotMatch(html, /rel="canonical"/, file);
    } else {
      assert.match(html, /name="robots" content="index, follow"/, file);
      const expected = file === "index.html" ? home : home + file;
      assert.ok(html.includes(`rel="canonical" href="${expected}"`), file);
      assert.ok(sitemap.includes(`<loc>${expected}</loc>`), file);
    }
  });
});
