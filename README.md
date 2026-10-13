# Maran Abogados — sitio web

Web estática (HTML, CSS y JavaScript sin frameworks) del despacho Maran Abogados, basada en el
boceto de Ionos y desarrollada por Trenchs Advisory.

**Estado:** versión preliminar para revisión del cliente. Las páginas llevan
`<meta name="robots" content="noindex, nofollow">` para que los buscadores no la indexen mientras
se revisa.

## Páginas

| Archivo | Página |
|---|---|
| `index.html` | Inicio |
| `nosotros.html` | Sobre Nosotros |
| `servicios.html` | Servicios (áreas de práctica) |
| `blog.html` | Blog (tarjetas revolving, préstamos e hipotecas, deudas) |
| `contacto.html` | Contacto |
| `aviso-legal.html` | Aviso legal y créditos fotográficos |
| `privacidad.html` | Política de privacidad |
| `terminos.html` | Términos y condiciones |
| `cookies.html` | Política de cookies |
| `404.html` | Página no encontrada |

## Cómo editar

Las páginas de la raíz se **generan**. No las edites a mano:

1. Edita el contenido en `tools/pages/<página>.html` o las partes comunes en `tools/partials/`
   (cabecera, pie y bloque de contacto).
2. Regenera las páginas:

   ```bash
   python tools/build.py            # usa la fecha de hoy como versión de caché (?v=AAAAMMDD)
   ```

3. Vista previa local: `python -m http.server 8765` y abre `http://localhost:8765/`.

Los estilos están en `styles.css`, el comportamiento en `main.js` y los datos de la marca en
`lib/manifest.js`.

## Contacto y formulario

`contacto.html#formulario` tiene un formulario con Nombre, Asunto y Problema. **No envía datos a
ningún servidor**: al pulsar «Enviar» abre la aplicación de correo del visitante con el mensaje
preparado para `info@maranabogados.es`. Así la web no almacena datos ni depende de servicios de
terceros. Los botones «Ponte en contacto con nosotros» llevan a ese formulario; desde el blog
rellenan el asunto automáticamente (`contacto.html?asunto=...`).

La web no usa cookies ni almacenamiento en el navegador, y no tiene mapa.

## Páginas legales

La web es meramente informativa. Por decisión del despacho, el aviso legal y la política de
privacidad no incluyen nombre o razón social, NIF, domicilio ni datos de colegiación; solo el
nombre comercial, el correo y el teléfono.

## Ver la web

Publicada con GitHub Pages desde la rama `main`:
<https://enriquerodrigueztrenchsporta.github.io/Maran-Abogados/>

Cada `git push` a `main` vuelve a publicarla en un par de minutos. Si cambias CSS o JS, regenera
con `python tools/build.py` para que el parámetro `?v=` cambie y los navegadores no usen la caché.

## Publicación

- **GitHub Pages (actual):** rama `main`, raíz. No admite `.htaccess`; la caché se controla con
  el parámetro `?v=` de los recursos.
- **Hostinger u otro hosting Apache:** sube todo el contenido de la carpeta, salvo `tools/`. El
  `.htaccess` incluido controla la caché. Retira la etiqueta `noindex` cuando la web pase a
  producción.

## Créditos

- Fotografías con licencias abiertas (CC0, CC BY, CC BY-SA): detalle en `aviso-legal.html#creditos`
  y en `assets/credits.json`.
- Tipografías Cormorant Garamond, Source Serif 4 y Figtree (SIL Open Font License 1.1), alojadas
  en `assets/fonts/`.
- GSAP 3.12.5 y ScrollTrigger (licencia estándar de GreenSock), alojadas en `lib/`.
