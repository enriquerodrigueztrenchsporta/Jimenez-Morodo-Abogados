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

Los estilos están en `styles.css`, el comportamiento en `main.js` y los datos de la marca en
`lib/manifest.js`.

## Contacto

La web no tiene formularios (previstos para una fase posterior) ni mapa, porque el despacho no
tiene oficina física. El contacto se hace por teléfono (`tel:`) o por correo (`mailto:`).

## Contenido pendiente

Está marcado en la web con recuadros amarillos `[PENDIENTE]`, solo en las páginas legales:

- Datos del titular para el aviso legal y la política de privacidad: nombre o razón social, NIF,
  domicilio a efectos de notificaciones, colegio y número de colegiado, plazos de conservación y
  proveedor de correo.
- Los textos legales son borradores y debe revisarlos el despacho.

## Ver la web (repositorio privado)

El repositorio es privado y el plan gratuito de GitHub no permite GitHub Pages en repositorios
privados. Para verla:

- **GitHub Codespaces (recomendado):** abre
  <https://codespaces.new/enriquerodrigueztrenchsporta/Maran-Abogados?quickstart=1> y pulsa
  «Create codespace». Al arrancar se abre la web automáticamente en una pestaña nueva. Si no
  aparece, ve a la pestaña «Ports» y abre el puerto 8765. La dirección es privada: solo funciona
  con tu sesión de GitHub. Cuando termines, detén el Codespace para no consumir horas.
- **En local:** descarga el repositorio («Code → Download ZIP»), descomprímelo y abre `index.html`
  con doble clic.

## Publicación

- **GitHub Pages:** requiere un repositorio público o un plan de pago, y la web de Pages es
  accesible para cualquiera que tenga el enlace. Se publicaría desde la rama `main` (raíz). No
  admite `.htaccess`; la caché se controla con el parámetro `?v=` de los recursos.
- **Hostinger u otro hosting Apache:** sube todo el contenido de la carpeta, salvo `tools/` y `.devcontainer/`. El
  `.htaccess` incluido controla la caché. Retira la etiqueta `noindex` cuando la web pase a
  producción.

## Créditos

- Fotografías con licencias abiertas (CC0, CC BY, CC BY-SA): detalle en `aviso-legal.html#creditos`
  y en `assets/credits.json`.
- Tipografías Cormorant Garamond, Source Serif 4 y Figtree (SIL Open Font License 1.1), alojadas
  en `assets/fonts/`.
- GSAP 3.12.5 y ScrollTrigger (licencia estándar de GreenSock), alojadas en `lib/`.
