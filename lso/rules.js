/* =============================================================
   Cuestionario de la Ley de la Segunda Oportunidad — CRITERIOS
   Criterios COMERCIALES de preselección facilitados por el despacho.
   No son los requisitos legales del procedimiento (artículos 486 y
   siguientes del texto refundido de la Ley Concursal): solo deciden
   si el despacho continúa con un estudio inicial del caso.

   Cada respuesta lleva a uno de estos estados:
     "continua"   -> encaja en los criterios iniciales.
     "revision"   -> falta información o hay circunstancias que aclarar.
     "no-supera"  -> no supera el filtro comercial inicial.

   El resultado final es el estado de mayor prioridad entre las cuatro
   respuestas (ver "priority"). Una respuesta sin regla se trata como
   "revision": un error de configuración nunca descarta a nadie.

   Para cambiar un criterio basta con editar este archivo y regenerar
   la versión de caché (python tools/build.py). Actualiza "version"
   para que cada solicitud recibida indique con qué criterios se evaluó.
   ============================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.MaranLSO = root.MaranLSO || {}; root.MaranLSO.rules = api; }
})(this, function () {
  "use strict";

  return {
    version: "2026-10-20",

    // De mayor a menor prioridad
    priority: ["no-supera", "revision", "continua"],

    // Estado si una respuesta no tiene regla definida
    fallback: "revision",

    answers: {
      // P1. Criterio del despacho: residencia habitual en España.
      residencia: {
        "si": "continua",
        "no": "no-supera"
      },
      // P2. Horquilla de deuda que el despacho estudia (criterio comercial).
      // «No lo sé» nunca descarta: requiere valoración individual.
      importe: {
        "menos-10000": "no-supera",
        "10000-5000000": "continua",
        "mas-5000000": "no-supera",
        "no-lo-se": "revision"
      },
      // P3. Ninguna opción excluye. La respuesta se envía al despacho.
      tipo: {
        "prestamos-tarjetas": "continua",
        "hacienda-seguridad-social": "continua",
        "particulares-empresas": "continua",
        "varias": "continua",
        "otras": "continua"
      },
      // P4. Ninguna opción excluye. Una solicitud anterior requiere
      // valoración jurídica adicional (p. ej., plazos del art. 488 TRLC).
      anterior: {
        "nunca": "continua",
        "si-exonerado": "revision",
        "si-en-curso": "revision",
        "si-sin-exoneracion": "revision"
      }
    }
  };
});
