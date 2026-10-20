#!/usr/bin/env python3
"""
Generador de páginas de Maran Abogados (solo en desarrollo; no se publica).

Compone cada página HTML de la raíz a partir de:
  tools/partials/*.html  -> cabecera, pie, bloque de contacto (comunes)
  tools/pages/*.html     -> contenido propio de cada página

Uso:
  python tools/build.py                 # versión de caché = fecha de hoy
  python tools/build.py --version 20261013
  python tools/build.py --site-url https://www.maranabogados.es/

Así la cabecera, el pie y el cache-buster ?v= son idénticos en todas las páginas.
También genera sitemap.xml, las URL canónicas y los datos estructurados.
Solo usa la biblioteca estándar de Python.
"""

import argparse
import datetime as dt
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"

# Dirección pública de la web (con barra final). Cámbiala, o usa --site-url,
# cuando la web pase al dominio definitivo: de ella salen las URL canónicas,
# og:url y sitemap.xml.
SITE_URL = "https://enriquerodrigueztrenchsporta.github.io/Maran-Abogados/"

# clave de navegación, archivo de salida, título, descripción
PAGES = [
    ("inicio", "index.html",
     "Maran Abogados · Derecho Civil, Penal y Extranjería",
     "Despacho de abogados especializado en Derecho Civil, Derecho Penal y Extranjería. "
     "Asesoramiento y defensa jurídica con atención personalizada y valoración inicial "
     "de casos de Ley de la Segunda Oportunidad."),
    ("nosotros", "nosotros.html",
     "Sobre nosotros · Maran Abogados",
     "La historia, la misión y los valores de Maran Abogados: integridad, compromiso y respeto "
     "en la defensa jurídica de nuestros clientes."),
    ("servicios", "servicios.html",
     "Servicios jurídicos · Maran Abogados",
     "Áreas de práctica de Maran Abogados: Derecho Civil, Responsabilidad Civil, Derecho Penal, "
     "Extranjería y Ley de la Segunda Oportunidad."),
    ("segunda-oportunidad", "ley-segunda-oportunidad.html",
     "Ley de la Segunda Oportunidad · Maran Abogados",
     "Asesoramiento en la Ley de la Segunda Oportunidad para particulares y autónomos con "
     "sobreendeudamiento. Estudiamos tu caso y te orientamos sobre la exoneración de deudas."),
    ("blog", "blog.html",
     "Blog · Maran Abogados",
     "Tarjetas revolving, préstamos e hipotecas, deudas que no puedes pagar: casos frecuentes "
     "en los que Maran Abogados puede ayudarte."),
    ("contacto", "contacto.html",
     "Contacto · Maran Abogados",
     "Solicita una consulta con Maran Abogados por teléfono, correo electrónico o mediante "
     "nuestro formulario."),
    ("aviso", "aviso-legal.html",
     "Aviso legal · Maran Abogados",
     "Aviso legal e información del titular del sitio web de Maran Abogados."),
    ("privacidad", "privacidad.html",
     "Política de privacidad · Maran Abogados",
     "Política de privacidad y protección de datos del sitio web de Maran Abogados."),
    ("terminos", "terminos.html",
     "Términos y condiciones · Maran Abogados",
     "Términos y condiciones de uso del sitio web de Maran Abogados."),
    ("cookies", "cookies.html",
     "Política de cookies · Maran Abogados",
     "Política de cookies del sitio web de Maran Abogados."),
    ("404", "404.html",
     "Página no encontrada · Maran Abogados",
     "La página solicitada no existe."),
]

NAV = [
    ("inicio", "index.html", "Inicio"),
    ("nosotros", "nosotros.html", "Sobre Nosotros"),
    ("servicios", "servicios.html", "Servicios"),
    ("blog", "blog.html", "Blog"),
    ("contacto", "contacto.html", "Contacto"),
]

# Apartados que se despliegan al pasar por encima de cada sección del menú
# (solo escritorio). Cada enlace debe apuntar a un ancla existente: las
# pruebas de tools/tests/site.test.js lo comprueban.
NAV_SUB = {
    "inicio": [
        ("index.html#segunda-oportunidad", "Ley de la Segunda Oportunidad"),
        ("index.html#despacho", "El despacho"),
        ("index.html#compromiso", "Compromiso"),
        ("index.html#servicios", "Servicios jurídicos"),
        ("index.html#consulta", "Solicita una consulta"),
    ],
    "nosotros": [
        ("nosotros.html", "Historia y misión"),
        ("nosotros.html#valores", "Valores"),
        ("nosotros.html#consulta", "Solicita una consulta"),
    ],
    "servicios": [
        ("ley-segunda-oportunidad.html", "Ley de la Segunda Oportunidad"),
        ("servicios.html#derecho-civil", "Derecho Civil"),
        ("servicios.html#responsabilidad-civil", "Responsabilidad Civil"),
        ("servicios.html#derecho-penal", "Derecho Penal"),
        ("servicios.html#extranjeria", "Extranjería"),
    ],
    "blog": [
        ("blog.html#tarjetas-revolving", "Tarjetas revolving"),
        ("blog.html#prestamos-hipotecas", "Préstamos e hipotecas"),
        ("blog.html#deudas", "Deudas"),
    ],
    "contacto": [
        ("contacto.html#formulario", "Formulario de contacto"),
        ("tel:+34624566690", "Teléfono: +34 624 566 690"),
        ("mailto:info@maranabogados.es", "info@maranabogados.es"),
    ],
}

# Scripts adicionales por página (se cargan con defer después de lib/manifest.js)
LSO_SCRIPTS = ["lso/content.js", "lso/rules.js", "lso/engine.js", "lso/validate.js",
               "lso/submit.js", "lso/quiz.js"]
PAGE_SCRIPTS = {
    "inicio": LSO_SCRIPTS,
}

# Páginas que no deben tener URL canónica ni figurar en sitemap.xml
NOT_INDEXED = {"404"}


def read(path):
    return path.read_text(encoding="utf-8")


def nav_items(active, template):
    out = []
    for i, (key, href, label) in enumerate(NAV, start=1):
        current = ' aria-current="page"' if key == active else ""
        out.append(template.format(href=href, label=label, current=current, n=f"{i:02d}"))
    return "\n".join(out)


def nav_desktop(active):
    """Menú de escritorio: cada sección con su lista desplegable de apartados."""
    out = []
    for key, href, label in NAV:
        current = ' aria-current="page"' if key == active else ""
        sub = NAV_SUB.get(key, [])
        if not sub:
            out.append(f'<li><a href="{href}"{current}>{label}</a></li>')
            continue
        links = "\n".join(f'              <li><a href="{h}">{t}</a></li>' for h, t in sub)
        out.append(
            f'<li class="nav__item">\n'
            f'            <a href="{href}"{current}>{label}<span class="nav__caret" aria-hidden="true"></span></a>\n'
            f'            <ul class="nav__sub" aria-label="Apartados de {label}">\n{links}\n            </ul>\n'
            f'          </li>')
    return "\n".join(out)


def page_url(site_url, filename):
    return site_url if filename == "index.html" else site_url + filename


def plain_text(fragment):
    text = re.sub(r"<[^>]+>", " ", fragment)
    text = html.unescape(text).replace(" ", " ")
    return re.sub(r"\s+", " ", text).strip()


def faq_items(body):
    """Preguntas y respuestas de los bloques <details class="faq__item"> de la página."""
    pattern = re.compile(
        r'<details class="faq__item[^"]*">\s*<summary><h3 class="faq__q">(.*?)</h3></summary>'
        r'\s*<div class="faq__a">(.*?)</div>\s*</details>', re.S)
    return [(plain_text(q), plain_text(a)) for q, a in pattern.findall(body)]


def structured_data(key, body, url, site_url, description):
    """Datos estructurados JSON-LD, solo con información visible en la página."""
    if key != "segunda-oportunidad":
        return []
    blocks = [{
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Ley de la Segunda Oportunidad",
        "serviceType": "Asesoramiento jurídico en exoneración del pasivo insatisfecho",
        "description": description,
        "url": url,
        "provider": {
            "@type": "LegalService",
            "name": "Maran Abogados",
            "url": site_url,
            "telephone": "+34624566690",
            "email": "info@maranabogados.es",
        },
    }]
    faqs = faq_items(body)
    if faqs:
        blocks.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            } for q, a in faqs],
        })
    return blocks


def head_extra(key, filename, body, site_url, description):
    lines = []
    if key not in NOT_INDEXED:
        url = page_url(site_url, filename)
        lines.append(f'  <link rel="canonical" href="{url}">')
        lines.append(f'  <meta property="og:url" content="{url}">')
        for block in structured_data(key, body, url, site_url, description):
            data = json.dumps(block, ensure_ascii=False, indent=2).replace("</", "<\\/")
            lines.append('  <script type="application/ld+json">\n' + data + "\n  </script>")
    return "\n".join(lines)


def scripts_extra(key, v):
    return "\n".join(f'  <script defer src="{src}?v={v}"></script>' for src in PAGE_SCRIPTS.get(key, []))


def fill(template, name, value):
    """Sustituye {{name}}; si el valor está vacío, elimina también la línea."""
    if not value:
        return template.replace("{{" + name + "}}\n", "")
    return template.replace("{{" + name + "}}", value)


def sitemap(site_url):
    urls = [page_url(site_url, filename) for key, filename, *_ in PAGES if key not in NOT_INDEXED]
    items = "\n".join(f"  <url><loc>{html.escape(u)}</loc></url>" for u in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{items}\n</urlset>\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default=dt.date.today().strftime("%Y%m%d"))
    ap.add_argument("--site-url", default=SITE_URL)
    args = ap.parse_args()
    v = args.version
    site_url = args.site_url if args.site_url.endswith("/") else args.site_url + "/"

    layout = read(TOOLS / "partials" / "layout.html")
    header = read(TOOLS / "partials" / "header.html")
    footer = read(TOOLS / "partials" / "footer.html")
    contact = read(TOOLS / "partials" / "contact.html")

    for key, filename, title, description in PAGES:
        body = read(TOOLS / "pages" / filename)
        body = body.replace("{{CONTACT}}", contact)
        head = header.replace(
            "{{NAV}}", nav_desktop(key)
        ).replace(
            "{{NAV_MOBILE}}",
            nav_items(key, '<li><a class="mobile-menu__link" href="{href}"{current}>{label} <span>{n}</span></a></li>'),
        )
        html_out = fill(layout, "HEAD_EXTRA", head_extra(key, filename, body, site_url, description))
        html_out = fill(html_out, "SCRIPTS_EXTRA", scripts_extra(key, v))
        html_out = (html_out
                    .replace("{{TITLE}}", title)
                    .replace("{{DESCRIPTION}}", description)
                    .replace("{{HEADER}}", head)
                    .replace("{{MAIN}}", body)
                    .replace("{{FOOTER}}", footer)
                    .replace("{{V}}", v))
        (ROOT / filename).write_text(html_out, encoding="utf-8", newline="\n")
        print(f"  {filename}")
    (ROOT / "sitemap.xml").write_text(sitemap(site_url), encoding="utf-8", newline="\n")
    print("  sitemap.xml")
    print(f"Versión de caché: ?v={v}")


if __name__ == "__main__":
    main()
