# Ley de la Segunda Oportunidad: sección, cuestionario y página de servicio

Documentación técnica de la funcionalidad añadida el 20/10/2026.

## Dónde está

| Elemento | Ubicación |
|---|---|
| Sección con el cuestionario | Portada (`tools/pages/index.html`), después del hero y de la cinta de áreas y antes de «El despacho». Ancla de la sección: `#segunda-oportunidad`; ancla del cuestionario: `#cuestionario-segunda-oportunidad` |
| Área de práctica VI | Portada, lista «Servicios jurídicos» |
| Área V | `servicios.html#segunda-oportunidad` (índice lateral incluido) |
| Página de detalle | `ley-segunda-oportunidad.html` (fuente: `tools/pages/ley-segunda-oportunidad.html`) |
| Otros enlaces | Cinta de áreas de la portada, pie (columna «Áreas»), artículo «Deudas» del blog |

Por indicación del encargo, la página **no** se añade al menú principal.

## Arquitectura del cuestionario

Cada responsabilidad está en un archivo distinto, sin dependencias externas:

| Archivo | Responsabilidad |
|---|---|
| `lso/content.js` | Textos: preguntas, respuestas, resultados y formulario |
| `lso/rules.js` | Criterios comerciales: qué estado produce cada respuesta |
| `lso/engine.js` | Evaluación (funciones puras, sin DOM) |
| `lso/validate.js` | Validación de los campos del formulario |
| `lso/submit.js` | Construcción de la solicitud y envío HTTPS |
| `lso/quiz.js` | Estado, interacción, accesibilidad y transiciones |
| `styles.css` (sección 10) | Presentación |
| `lib/manifest.js` → `forms.segundaOportunidad.endpoint` | Dirección de recepción de solicitudes |

`tools/build.py` añade estos scripts solo a la portada (`PAGE_SCRIPTS`). Para reutilizar el
cuestionario en otra página basta con añadir esa clave en `PAGE_SCRIPTS` e incluir el marcado
`<div data-lso-quiz> … <div data-lso-app hidden></div> … </div>`.

## Reglas de evaluación

Son criterios **comerciales** del despacho, no requisitos legales. Cada respuesta produce un estado y
el resultado final es el de mayor prioridad: `no-supera` > `revision` > `continua`.

| Pregunta | Respuesta | Estado |
|---|---|---|
| P1 Residencia | Sí | continúa |
| | No | no supera |
| P2 Importe | Menos de 10.000 € | no supera |
| | Entre 10.000 € y 5.000.000 € | continúa |
| | Más de 5.000.000 € | no supera |
| | No lo sé con exactitud | revisión |
| P3 Tipo de deuda | Cualquiera de las cinco | continúa |
| P4 Solicitud anterior | No, nunca | continúa |
| | Sí (cualquiera de las tres) | revisión |

- Se responden siempre las cuatro preguntas; el resultado se calcula al final.
- Una respuesta sin regla, o con un estado mal escrito, cuenta como `revision`: un error de
  configuración nunca descarta a nadie.
- Para cambiar un criterio, edita `lso/rules.js`, actualiza `version` (llega en cada solicitud) y
  ejecuta las pruebas. Para cambiar los tramos de importe, cambia también las etiquetas en
  `lso/content.js`; las pruebas fallan si los identificadores no coinciden.

## Envío de solicitudes: estado actual

**Receptor configurado: FormSubmit → info@maranabogados.es** (decisión del 20/10/2026). La
dirección `https://formsubmit.co/ajax/info@maranabogados.es` está en `lib/manifest.js`.

**Activación pendiente (una sola vez):** el primer envío real hace que FormSubmit mande a
`info@maranabogados.es` un correo con el enlace «Activate Form». Hasta pulsarlo, FormSubmit responde
`{"success":"false"}` y el formulario muestra un error (no confirma nada). Una vez activado, cada
solicitud llega como correo con una tabla de campos, y «Responder» va al correo del solicitante
(`_replyto`).

Tras la activación, FormSubmit permite sustituir la dirección de correo de la URL por un alias
aleatorio. Es opcional, porque el correo ya es público en la web.

Si se deja `endpoint` vacío, el formulario vuelve al modo «Envío pendiente de activación»: valida
los datos pero no los envía, y lo dice. No se simula ningún envío ni se usa `mailto:`.

**Protección de datos:** FormSubmit (Devro LABS) es un tercero que transmite los datos. Su política
de privacidad (https://formsubmit.co/privacy.pdf, de 2019) declara que no usa los datos para fines
propios, pero no indica el país del tratamiento ni ofrece un contrato de encargado del tratamiento
(art. 28 RGPD). Si el despacho necesita esas garantías, conviene sustituirlo por un proveedor que
firme ese contrato o por una función propia (opciones abajo); solo cambia `endpoint`.

Cuando hay `endpoint`, el formulario envía un `POST` JSON por HTTPS y solo muestra la confirmación si
el servidor responde 2xx sin indicar error. Incluye estado de carga, bloqueo de envíos duplicados,
tiempo de espera de 15 s y mensajes de error. Los datos no se escriben en la consola ni se guardan
en el navegador.

### Cambiar de receptor

Cualquier receptor sirve si cumple dos condiciones: que acepte JSON por HTTPS y que reenvíe la
solicitud a `info@maranabogados.es`. Alternativas a FormSubmit:

1. **Proveedor de formularios** (p. ej., Formspree). Se crea el formulario en la cuenta del despacho
   con destino `info@maranabogados.es` y se copia su dirección (`https://formspree.io/f/…`) en
   `lib/manifest.js`. Esa dirección es pública por diseño y no es un secreto. Es la opción más
   rápida, pero los datos pasan por un tercero (normalmente en EE. UU.). Requiere contrato de
   encargado del tratamiento. El campo trampa se llama `_gotcha` en Formspree: ajusta el nombre en
   `lso/submit.js` y `lso/quiz.js`.
2. **Función serverless propia** (Cloudflare Workers, Vercel, etc.) que reciba el JSON y lo envíe
   por el SMTP de IONOS. La contraseña SMTP va en una variable de entorno del proveedor, **nunca**
   en el repositorio. La función debe limitar CORS al dominio de la web, limitar la frecuencia de
   envíos, descartar las solicitudes con `_honey` relleno y no registrar el contenido.

Después de cambiar de receptor:

1. Escribe la dirección en `lib/manifest.js` y ejecuta `python tools/build.py`.
2. Haz un envío real de prueba y comprueba que llega a `info@maranabogados.es`.
3. Actualiza el proveedor en `privacidad.html` (sección «Destinatarios») y en el bloque informativo
   de `lso/quiz.js`.

### Campos que llegan al despacho

`nombre`, `telefono`, `email`, `comentarios`, `politica_privacidad_leida`, `resultado_filtro`,
`resultado_codigo`, `criterios_version`, `fecha_envio` (ISO 8601, UTC), `pagina` y
`p1_residencia` … `p4_anterior` (pregunta → respuesta). Los campos de control de FormSubmit son
`_subject`, `_replyto`, `_template`, `_captcha` y `_honey`.

## Accesibilidad

- Cada pregunta es un `fieldset` con `legend` y radios nativos con aspecto de tarjeta. Se puede
  completar con teclado: Tab llega al grupo, las flechas cambian la respuesta **sin** avanzar, y
  Espacio o Intro avanzan. El clic o toque avanza automáticamente.
- Al cambiar de paso, el foco pasa a la respuesta (o al título del resultado) y una región
  `aria-live` anuncia «Pregunta N de 4».
- El estado seleccionado no depende solo del color: lleva marca de verificación y negrita. El
  resultado lleva icono y texto.
- Los errores se asocian a cada campo (`aria-describedby`, `aria-invalid`) y el foco va al primer
  campo erróneo.
- Con `prefers-reduced-motion` se desactivan las transiciones.
- Sin JavaScript, la tarjeta muestra el teléfono y el correo del despacho.

## SEO

- Página de detalle con `title` y `description` propios, un único H1 y H2/H3 semánticos.
- `canonical` y `og:url` en todas las páginas (salvo la 404). Datos estructurados `Service` y
  `FAQPage`, generados a partir de las preguntas frecuentes visibles.
- `sitemap.xml` generado por `build.py`.
- La web sigue con `noindex` por ser una versión preliminar. Al pasar al dominio definitivo:
  `python tools/build.py --site-url https://<dominio>/` (o cambia `SITE_URL`) y retira el `noindex`
  de `tools/partials/layout.html`.

## Pruebas

```bash
python tools/build.py
node --test "tools/tests/*.test.js"
```

- `tools/tests/lso.test.js` cubre preguntas y opciones literales, coherencia de reglas, las 160
  combinaciones, la prioridad, la validación y el envío (con un servidor simulado).
- `tools/tests/site.test.js` cubre el orden de secciones en la portada, la ausencia de duplicados,
  las seis áreas, el menú, el SEO de la página de detalle, el sitemap, los enlaces relativos y las
  anclas, y la ausencia de secretos, `console.log` y almacenamiento en el navegador.

## Fuentes jurídicas

Los textos de la página de detalle se basan en los artículos 486 a 489 del texto refundido de la
Ley Concursal (Real Decreto Legislativo 1/2020), en la redacción de la Ley 16/2022, según el texto
consolidado del BOE (última actualización publicada el 03/01/2025), consultado el 20/10/2026:
https://www.boe.es/buscar/act.php?id=BOE-A-2020-4859
