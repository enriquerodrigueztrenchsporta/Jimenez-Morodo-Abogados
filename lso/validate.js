/* =============================================================
   Cuestionario de la Ley de la Segunda Oportunidad — VALIDACIÓN
   Reglas de los campos del formulario de contacto. Funciones puras:
   devuelven un mensaje de error o "" si el valor es correcto.
   ============================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.JimenezMorodoLSO = root.JimenezMorodoLSO || {}; root.JimenezMorodoLSO.validate = api; }
})(this, function () {
  "use strict";

  var LIMITS = { nombre: 120, telefono: 25, email: 254, comentarios: 1000 };

  function nombre(v) {
    v = (v || "").trim();
    if (!v) return "Indica tu nombre y apellidos.";
    if (v.length < 2) return "El nombre parece incompleto.";
    if (v.length > LIMITS.nombre) return "El nombre no puede superar " + LIMITS.nombre + " caracteres.";
    return "";
  }

  // Teléfono español de 9 cifras (6, 7, 8 o 9) o número con prefijo
  // internacional (+ o 00) de 8 a 15 cifras. Admite espacios, puntos,
  // guiones y paréntesis.
  function telefono(v) {
    v = (v || "").trim();
    if (!v) return "Indica un teléfono de contacto.";
    if (!/^[+\d][\d\s().-]*$/.test(v)) return "El teléfono solo puede contener números, espacios y el prefijo +.";
    var digits = v.replace(/\D/g, "");
    var international = v.charAt(0) === "+" || digits.indexOf("00") === 0;
    if (international) {
      if (digits.indexOf("00") === 0 && v.charAt(0) !== "+") digits = digits.slice(2);
      if (digits.length < 8 || digits.length > 15) return "Revisa el teléfono: con prefijo internacional debe tener entre 8 y 15 cifras.";
      return "";
    }
    if (!/^[6789]\d{8}$/.test(digits)) return "Revisa el teléfono: debe tener 9 cifras (por ejemplo, 600 123 456) o incluir el prefijo internacional.";
    return "";
  }

  function email(v) {
    v = (v || "").trim();
    if (!v) return "Indica tu correo electrónico.";
    if (v.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      return "Revisa el correo electrónico (por ejemplo, nombre@dominio.es).";
    }
    return "";
  }

  function comentarios(v) {
    v = (v || "").trim();
    if (v.length > LIMITS.comentarios) return "Los comentarios no pueden superar " + LIMITS.comentarios + " caracteres.";
    return "";
  }

  function privacidad(checked) {
    return checked ? "" : "Para enviar la solicitud debes confirmar que has leído la política de privacidad.";
  }

  // Valida todos los campos. Devuelve { valid, errors: { campo: mensaje } }
  function all(data) {
    var errors = {};
    var checks = {
      nombre: nombre(data.nombre),
      telefono: telefono(data.telefono),
      email: email(data.email),
      comentarios: comentarios(data.comentarios),
      privacidad: privacidad(data.privacidad)
    };
    Object.keys(checks).forEach(function (k) { if (checks[k]) errors[k] = checks[k]; });
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  return {
    LIMITS: LIMITS,
    nombre: nombre,
    telefono: telefono,
    email: email,
    comentarios: comentarios,
    privacidad: privacidad,
    all: all
  };
});
