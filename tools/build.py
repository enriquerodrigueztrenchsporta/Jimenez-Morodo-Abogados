#!/usr/bin/env python3
"""
Generador de páginas de Maran Abogados (solo en desarrollo; no se publica).

Compone cada página HTML de la raíz a partir de:
  tools/partials/*.html  -> cabecera, pie, bloque de contacto (comunes)
  tools/pages/*.html     -> contenido propio de cada página

Uso:
  python tools/build.py                 # versión de caché = fecha de hoy
  python tools/build.py --version 20261013

Así la cabecera, el pie y el cache-buster ?v= son idénticos en todas las páginas.
Solo usa la biblioteca estándar de Python.
"""

import argparse
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"

# clave de navegación, archivo de salida, título, descripción, ¿splash?
PAGES = [
    ("inicio", "index.html",
     "Maran Abogados · Derecho Civil, Penal y Extranjería",
     "Despacho de abogados especializado en Derecho Civil, Derecho Penal y Extranjería. "
     "Asesoramiento y defensa jurídica con atención personalizada.", True),
    ("nosotros", "nosotros.html",
     "Sobre nosotros · Maran Abogados",
     "La historia, la misión y los valores de Maran Abogados: integridad, compromiso y respeto "
     "en la defensa jurídica de nuestros clientes.", False),
    ("servicios", "servicios.html",
     "Servicios jurídicos · Maran Abogados",
     "Áreas de práctica de Maran Abogados: Derecho Civil, Responsabilidad Civil, Derecho Penal "
     "y Extranjería.", False),
    ("blog", "blog.html",
     "Blog · Maran Abogados",
     "Tarjetas revolving, préstamos e hipotecas, deudas que no puedes pagar: casos frecuentes "
     "en los que Maran Abogados puede ayudarte.", False),
    ("contacto", "contacto.html",
     "Contacto · Maran Abogados",
     "Solicita una consulta con Maran Abogados por teléfono, correo electrónico o mediante "
     "nuestro formulario.", False),
    ("aviso", "aviso-legal.html",
     "Aviso legal · Maran Abogados",
     "Aviso legal e información del titular del sitio web de Maran Abogados.", False),
    ("privacidad", "privacidad.html",
     "Política de privacidad · Maran Abogados",
     "Política de privacidad y protección de datos del sitio web de Maran Abogados.", False),
    ("404", "404.html",
     "Página no encontrada · Maran Abogados",
     "La página solicitada no existe.", False),
]

NAV = [
    ("inicio", "index.html", "Inicio"),
    ("nosotros", "nosotros.html", "Sobre Nosotros"),
    ("servicios", "servicios.html", "Servicios"),
    ("blog", "blog.html", "Blog"),
    ("contacto", "contacto.html", "Contacto"),
]


def read(path):
    return path.read_text(encoding="utf-8")


def nav_items(active, template):
    out = []
    for i, (key, href, label) in enumerate(NAV, start=1):
        current = ' aria-current="page"' if key == active else ""
        out.append(template.format(href=href, label=label, current=current, n=f"{i:02d}"))
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default=dt.date.today().strftime("%Y%m%d"))
    args = ap.parse_args()
    v = args.version

    layout = read(TOOLS / "partials" / "layout.html")
    header = read(TOOLS / "partials" / "header.html")
    footer = read(TOOLS / "partials" / "footer.html")
    contact = read(TOOLS / "partials" / "contact.html")
    splash = read(TOOLS / "partials" / "splash.html")

    for key, filename, title, description, with_splash in PAGES:
        body = read(TOOLS / "pages" / filename)
        body = body.replace("{{CONTACT}}", contact)
        head = header.replace(
            "{{NAV}}", nav_items(key, '<li><a href="{href}"{current}>{label}</a></li>')
        ).replace(
            "{{NAV_MOBILE}}",
            nav_items(key, '<li><a class="mobile-menu__link" href="{href}"{current}>{label} <span>{n}</span></a></li>'),
        )
        html = (layout
                .replace("{{TITLE}}", title)
                .replace("{{DESCRIPTION}}", description)
                .replace("{{SPLASH}}", splash if with_splash else "")
                .replace("{{HEADER}}", head)
                .replace("{{MAIN}}", body)
                .replace("{{FOOTER}}", footer)
                .replace("{{V}}", v))
        (ROOT / filename).write_text(html, encoding="utf-8", newline="\n")
        print(f"  {filename}")
    print(f"Versión de caché: ?v={v}")


if __name__ == "__main__":
    main()
