(function () {
  "use strict";
  // Datos de la marca. El contenido visible está escrito en el HTML; esto solo
  // alimenta comportamientos (destinatario de los formularios, etc.).
  window.__BRAND__ = {
    name: "Jimenez & Morodo Abogados",
    contact: {
      email: "info@jimenezmorodoabogados.es",
      phone: "+34 624 566 690",
      phoneHref: "+34624566690"
    },
    forms: {
      // Cuestionario de la Ley de la Segunda Oportunidad (lso/submit.js).
      // Dirección HTTPS que recibe las solicitudes (proveedor de formularios
      // o función serverless). Vacía = envío desactivado: el formulario lo
      // indica y no simula envíos. Ver docs/segunda-oportunidad.md.
      // Nunca pongas aquí contraseñas ni claves privadas: este archivo es público.
      // Receptor: FormSubmit, que reenvía cada solicitud a info@jimenezmorodoabogados.es.
      // El primer envío dispara un correo de activación a esa dirección: hasta
      // pulsar «Activate Form», el formulario mostrará un error (no simula envíos).
      segundaOportunidad: {
        endpoint: "https://formsubmit.co/ajax/info@jimenezmorodoabogados.es"
      }
    }
  };
})();
