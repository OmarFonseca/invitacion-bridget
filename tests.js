/* Tests minimalistas (sin frameworks) */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  function li(text, ok) {
    const el = document.createElement("li");
    el.textContent = text;
    el.style.color = ok ? "rgba(122, 255, 176, 0.95)" : "rgba(255, 107, 134, 0.95)";
    return el;
  }

  function setStatus(kind, text) {
    const dot = $("#statusDot");
    const t = $("#statusText");
    dot.classList.remove("ok", "bad");
    if (kind === "ok") dot.classList.add("ok");
    if (kind === "bad") dot.classList.add("bad");
    t.textContent = text;
  }

  function assert(name, condition) {
    return { name, ok: Boolean(condition) };
  }

  function run() {
    const ul = $("#results");
    ul.innerHTML = "";
    setStatus("", "Corriendo...");

    const api = window.__INVITACION__;
    if (!api) {
      ul.appendChild(li("No se encontró __INVITACION__. ¿Cargó script.js?", false));
      setStatus("bad", "Falló");
      return;
    }

    // Limpieza para empezar de cero
    api.clearRecords();

    const tests = [];

    // validateForm
    tests.push(assert("validateForm: nombre requerido", api.validateForm({ name: "", adults: 1, kids: 0 }).ok === false));
    tests.push(assert("validateForm: no permite lugares 0", api.validateForm({ name: "X", adults: 0, kids: 0 }).ok === false));
    tests.push(assert("validateForm: acepta valores válidos", api.validateForm({ name: "Familia Pérez", adults: 2, kids: 1 }).ok === true));

    // storage roundtrip
    const sample = [
      { name: "Familia A", adults: 2, kids: 0, createdAt: new Date().toISOString() },
      { name: "Familia B", adults: 1, kids: 2, createdAt: new Date().toISOString() },
    ];
    api.saveRecords(sample);
    const loaded = api.loadRecords();
    tests.push(assert("localStorage: roundtrip guarda/carga", Array.isArray(loaded) && loaded.length === 2));
    tests.push(assert("localStorage: createdAt existe", Boolean(loaded[0]?.createdAt) && Boolean(loaded[1]?.createdAt)));

    // totals
    const totals = api.computeTotals(loaded);
    tests.push(assert("computeTotals: adultos=3", totals.adults === 3));
    tests.push(assert("computeTotals: niños=2", totals.kids === 2));
    tests.push(assert("computeTotals: invitados=5", totals.guests === 5));

    // slugify
    const slug = api.slugify("Familia Gómez Dávila !!!");
    tests.push(assert("slugify: normaliza y quita acentos", slug.includes("gomez") && slug.includes("davila")));

    // render
    let okCount = 0;
    for (const t of tests) {
      ul.appendChild(li(`${t.ok ? "OK" : "FAIL"} — ${t.name}`, t.ok));
      if (t.ok) okCount++;
    }

    const allOk = okCount === tests.length;
    setStatus(allOk ? "ok" : "bad", allOk ? `OK (${okCount}/${tests.length})` : `Falló (${okCount}/${tests.length})`);
  }

  function clear() {
    const ul = $("#results");
    ul.innerHTML = "";
    if (window.__INVITACION__) window.__INVITACION__.clearRecords();
    setStatus("ok", "Storage limpio");
  }

  function init() {
    $("#runBtn").addEventListener("click", run);
    $("#clearBtn").addEventListener("click", clear);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

