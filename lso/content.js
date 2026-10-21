/* =============================================================
   Cuestionario de la Ley de la Segunda Oportunidad — CONTENIDO
   Textos de las preguntas, respuestas y resultados. No contiene
   reglas: qué respuesta lleva a qué resultado está en lso/rules.js.

   Los identificadores (id) de preguntas y respuestas enlazan este
   archivo con las reglas: si se cambia un id aquí, hay que cambiarlo
   también en lso/rules.js (las pruebas lo comprueban).
   ============================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.JimenezMorodoLSO = root.JimenezMorodoLSO || {}; root.JimenezMorodoLSO.content = api; }
})(this, function () {
  "use strict";

  return {
    questions: [
      {
        id: "residencia",
        text: "¿Resides habitualmente en España?",
        options: [
          { id: "si", label: "Sí" },
          { id: "no", label: "No" }
        ]
      },
      {
        id: "importe",
        text: "¿A cuánto asciende aproximadamente tu deuda total?",
        options: [
          { id: "menos-10000", label: "Menos de 10.000 €" },
          { id: "10000-5000000", label: "Entre 10.000 € y 5.000.000 €" },
          { id: "mas-5000000", label: "Más de 5.000.000 €" },
          { id: "no-lo-se", label: "No lo sé con exactitud" }
        ]
      },
      {
        id: "tipo",
        text: "¿Qué tipo de deudas tienes?",
        options: [
          { id: "prestamos-tarjetas", label: "Préstamos personales o tarjetas de crédito" },
          { id: "hacienda-seguridad-social", label: "Deudas con Hacienda o la Seguridad Social" },
          { id: "particulares-empresas", label: "Deudas con particulares o empresas" },
          { id: "varias", label: "Varias de las anteriores" },
          { id: "otras", label: "Otras" }
        ]
      },
      {
        id: "anterior",
        text: "¿Te has acogido anteriormente a la Ley de la Segunda Oportunidad?",
        options: [
          { id: "nunca", label: "No, nunca" },
          { id: "si-exonerado", label: "Sí, y obtuve la exoneración de mis deudas" },
          { id: "si-en-curso", label: "Sí, pero el procedimiento sigue en curso" },
          { id: "si-sin-exoneracion", label: "Sí, pero no obtuve la exoneración" }
        ]
      }
    ],

    // Un bloque por cada estado que puede devolver el motor (lso/engine.js)
    results: {
      "continua": {
        badge: "Encaja en los criterios iniciales",
        title: "Podemos continuar con la valoración de tu caso",
        text: "Por las respuestas facilitadas, tu situación encaja en nuestros criterios iniciales de valoración. Deja tus datos y un abogado de Jimenez & Morodo Abogados se pondrá en contacto contigo para estudiar tu caso.",
        note: "Este resultado es orientativo y no constituye una confirmación de que puedas acogerte legalmente al procedimiento.",
        form: true
      },
      "revision": {
        badge: "Requiere revisión",
        title: "Necesitamos conocer mejor tu situación",
        text: "Con la información facilitada no podemos completar la valoración inicial. Puedes dejar tus datos para que nuestro equipo estudie tu consulta.",
        note: "Este resultado es orientativo y no constituye una confirmación de que puedas acogerte legalmente al procedimiento.",
        form: true
      },
      "no-supera": {
        badge: "Fuera de los criterios iniciales",
        title: "Tu caso no encaja actualmente en nuestros criterios iniciales",
        text: "Según las respuestas facilitadas, tu situación no cumple actualmente nuestros criterios iniciales de selección. Si tus circunstancias cambian o necesitas aclarar alguna cuestión, puedes contactar con nosotros.",
        note: "Estos criterios son propios del despacho para esta valoración inicial y no determinan si tienes o no derecho a solicitar el procedimiento.",
        form: false
      }
    },

    form: {
      title: "Un abogado puede estudiar tu situación",
      text: "Déjanos tus datos y nos pondremos en contacto contigo para continuar con la valoración.",
      submit: "Solicitar valoración de mi caso",
      success: {
        title: "Hemos recibido tu solicitud",
        text: "Gracias. Un abogado de Jimenez & Morodo Abogados revisará tus respuestas y se pondrá en contacto contigo por teléfono o por correo electrónico."
      }
    }
  };
});
