/* =============================================================
   Cuestionario de la Ley de la Segunda Oportunidad — MOTOR
   Funciones puras: no tocan el DOM ni guardan estado. Reciben las
   respuestas ({ idPregunta: idRespuesta }) y la configuración de
   lso/content.js y lso/rules.js, y devuelven el resultado.
   ============================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.JimenezMorodoLSO = root.JimenezMorodoLSO || {}; root.JimenezMorodoLSO.engine = api; }
})(this, function () {
  "use strict";

  function findOption(question, optionId) {
    for (var i = 0; i < question.options.length; i++) {
      if (question.options[i].id === optionId) return question.options[i];
    }
    return null;
  }

  // Estado de una respuesta concreta según las reglas
  function outcomeFor(rules, questionId, optionId) {
    var byQuestion = rules.answers[questionId] || {};
    var outcome = byQuestion[optionId];
    return rules.priority.indexOf(outcome) === -1 ? rules.fallback : outcome;
  }

  // ¿Están respondidas todas las preguntas con opciones válidas?
  function isComplete(questions, answers) {
    return questions.every(function (q) { return !!findOption(q, answers[q.id]); });
  }

  /**
   * Evalúa las respuestas.
   * Devuelve { complete, status, reasons } donde:
   *   complete -> false si falta alguna respuesta (status es null).
   *   status   -> "continua" | "revision" | "no-supera".
   *   reasons  -> respuestas que han determinado el estado final.
   */
  function evaluate(questions, rules, answers) {
    answers = answers || {};
    if (!isComplete(questions, answers)) return { complete: false, status: null, reasons: [] };

    var detail = questions.map(function (q) {
      return { question: q.id, answer: answers[q.id], outcome: outcomeFor(rules, q.id, answers[q.id]) };
    });
    var rank = function (s) { return rules.priority.indexOf(s); };
    var status = detail.reduce(function (best, d) {
      return rank(d.outcome) < rank(best) ? d.outcome : best;
    }, rules.priority[rules.priority.length - 1]);

    return {
      complete: true,
      status: status,
      reasons: detail.filter(function (d) { return d.outcome === status; })
    };
  }

  // Respuestas en texto legible, en el orden de las preguntas
  function describe(questions, answers) {
    return questions.map(function (q) {
      var opt = findOption(q, answers[q.id]);
      return { id: q.id, question: q.text, answer: opt ? opt.label : "" };
    });
  }

  // Comprueba que cada respuesta del contenido tiene una regla válida.
  // Devuelve una lista de problemas (vacía si todo es coherente).
  function checkRules(questions, rules) {
    var problems = [];
    questions.forEach(function (q) {
      var byQuestion = rules.answers[q.id];
      if (!byQuestion) { problems.push("Sin reglas para la pregunta «" + q.id + "»"); return; }
      q.options.forEach(function (o) {
        if (rules.priority.indexOf(byQuestion[o.id]) === -1) {
          problems.push("Sin regla válida para «" + q.id + "» = «" + o.id + "»");
        }
      });
      Object.keys(byQuestion).forEach(function (k) {
        if (!findOption(q, k)) problems.push("Regla para una respuesta inexistente: «" + q.id + "» = «" + k + "»");
      });
    });
    return problems;
  }

  return {
    evaluate: evaluate,
    isComplete: isComplete,
    describe: describe,
    checkRules: checkRules,
    outcomeFor: outcomeFor
  };
});
