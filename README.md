# Jimenez & Morodo Abogados — sitio web

Web estática (HTML, CSS y JavaScript sin frameworks) del despacho Jimenez & Morodo Abogados, basada en el
boceto de Ionos y desarrollada por Trenchs Advisory.

**Estado:** versión de producción publicada en GitHub Pages. Las páginas de contenido permiten
la indexación; la página 404 conserva `noindex`. El generador mantiene sincronizados
las URL canónicas, los datos estructurados, `sitemap.xml` y `robots.txt`.

## Páginas

| Archivo | Página |
|---|---|
| `index.html` | Inicio |
| `nosotros.html` | Sobre Nosotros |
| `servicios.html` | Servicios (áreas de práctica) |
| `ley-segunda-oportunidad.html` | Ley de la Segunda Oportunidad (detalle del servicio) |
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

## Contacto y formulario de la página Contacto

`contacto.html#formulario` tiene un formulario con Nombre, Asunto y Problema. **No envía datos a
ningún servidor**: al pulsar «Enviar» abre la aplicación de correo del visitante con el mensaje
preparado para `info@jimenezmorodoabogados.es`. Así la web no almacena datos ni depende de servicios de
terceros. Los botones «Ponte en contacto con nosotros» llevan a ese formulario; desde el blog
rellenan el asunto automáticamente (`contacto.html?asunto=...`).

La web no usa cookies ni almacenamiento en el navegador, y no tiene mapa.

## Cuestionario de la Ley de la Segunda Oportunidad

La portada incluye, justo después del hero, un cuestionario de cuatro preguntas con un formulario
de captación (código en `lso/`). Las solicitudes llegan a `info@jimenezmorodoabogados.es` a través de
FormSubmit. **El primer envío dispara un correo de activación a esa dirección, que hay que
confirmar una vez.** Los criterios, el envío y la protección de datos están en
[`docs/segunda-oportunidad.md`](docs/segunda-oportunidad.md).

## Pruebas

```bash
python tools/build.py
node --test "tools/tests/*.test.js"
```

## Páginas legales

La web es meramente informativa. Por decisión del despacho, el aviso legal y la política de
privacidad no incluyen nombre o razón social, NIF, domicilio ni datos de colegiación; solo el
nombre comercial, el correo y el teléfono.

## Ver la web

Publicada con GitHub Pages desde la rama `main`:
<https://enriquerodrigueztrenchsporta.github.io/Jimenez-Morodo-Abogados/>

Cada `git push` a `main` vuelve a publicarla en un par de minutos. Si cambias CSS o JS, regenera
con `python tools/build.py` para que el parámetro `?v=` cambie y los navegadores no usen la caché.

## Publicación

- **GitHub Pages (actual):** rama `main`, raíz. No admite `.htaccess`; la caché se controla con
  el parámetro `?v=` de los recursos.
- **Hostinger u otro hosting Apache:** sube todo el contenido de la carpeta, salvo `tools/` y `docs/`. El
  `.htaccess` incluido controla la caché. La indexación ya está habilitada para las páginas de contenido.

## Créditos

- Fotografías con licencias abiertas (CC0, CC BY, CC BY-SA): detalle en `aviso-legal.html#creditos`
  y en `assets/credits.json`.
- Tipografías Cormorant Garamond, Source Serif 4 y Figtree (SIL Open Font License 1.1), alojadas
  en `assets/fonts/`.
- GSAP 3.12.5 y ScrollTrigger (licencia estándar de GreenSock), alojadas en `lib/`.

## Cambio futuro a dominio propio

La dirección de producción actual sigue siendo la de GitHub Pages. No hay dominio propio
configurado. Para cambiarlo, actualiza `SITE_URL` en `tools/build.py` y regenera:

```bash
python tools/build.py --site-url https://www.jimenezmorodoabogados.es/
node --test "tools/tests/*.test.js"
```

Después configura el dominio en Settings > Pages y sus DNS en el proveedor. No cambies
los registros de correo. El generador actualiza también el sitemap y robots.txt.

## Comprobaciones operativas del despacho

- Confirmar el correo de activación de FormSubmit en `info@jimenezmorodoabogados.es` y comprobar
  la recepción de una solicitud de prueba. El repositorio no permite verificar esa activación.
- El formulario de Contacto abre la aplicación de correo: requiere que el visitante
  termine el envío desde ella.
- El despacho debe validar los textos legales y sus datos identificativos antes de
  considerar cerrada la revisión del contenido. La preparación técnica no acredita
  esa validación.
