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

Los estilos están en `styles.css` y el comportamiento en `main.js`; los datos de contacto que usan
los formularios, en `lib/manifest.js`.

## Formularios

Los formularios **no envían datos a ningún servidor**: al pulsar «Enviar» se abre la aplicación de
correo del visitante con el mensaje preparado para `maran.abogados@gmail.com`. Para recibirlos
directamente desde la web haría falta un servicio de formularios, que debe aprobarse antes porque
implica tratar datos personales con un tercero.

## Contenido pendiente

Está marcado en la web con recuadros amarillos `[PENDIENTE]`:

- Dirección del despacho.
- Historia, equipo y datos de colegiación (colegio y número de colegiado).
- Datos del titular para el aviso legal y la política de privacidad (nombre o razón social, NIF,
  domicilio, plazos de conservación, proveedor de correo).
- Los textos legales son borradores y debe revisarlos el despacho.

## Publicación

- **GitHub Pages:** se publica desde la rama `main` (raíz). No admite `.htaccess`; la caché se
  controla con el parámetro `?v=` de los recursos.
- **Hostinger u otro hosting Apache:** sube todo el contenido de la carpeta, salvo `tools/`. El
  `.htaccess` incluido controla la caché. Retira la etiqueta `noindex` cuando la web pase a
  producción.

## Créditos

- Fotografías con licencias abiertas (CC0, CC BY, CC BY-SA): detalle en `aviso-legal.html#creditos`
  y en `assets/credits.json`.
- Tipografías Cormorant Garamond, Source Serif 4 y Figtree (SIL Open Font License 1.1), alojadas
  en `assets/fonts/`.
- GSAP 3.12.5 y ScrollTrigger (licencia estándar de GreenSock), alojadas en `lib/`.
