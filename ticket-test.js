(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  function blobToDataUrl(blob) {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.readAsDataURL(blob);
    });
  }

  async function canvasToImg(canvas) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    const url = await blobToDataUrl(blob);
    const img = document.createElement("img");
    img.className = "img";
    img.src = url;
    return img;
  }

  async function generate() {
    const api = window.__INVITACION__;
    const grid = $("#grid");
    grid.innerHTML = "";

    if (!api || typeof api.drawTicketToCanvas !== "function") {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = "No se encontró __INVITACION__.drawTicketToCanvas (debug).";
      grid.appendChild(div);
      return;
    }

    const cases = [
      { name: "Mixtli Omar Fonseca Vega", adults: 1, kids: 0 },
      { name: "Familia Pérez", adults: 2, kids: 3 },
      { name: "Nombre MUY LARGO para probar que nunca se salga del recuadro blanco aunque tenga muchas palabras", adults: 2, kids: 1 },
      { name: "SupercalifragilisticoespialidosoSupercalifragilisticoespialidoso", adults: 3, kids: 2 },
    ];

    // Espera fuentes si existe (para reproducir caso real)
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
    }

    for (const c of cases) {
      const card = document.createElement("div");
      card.className = "card";

      const displayName = api.toTicketName ? api.toTicketName(c.name) : c.name;
      let canvas = null;
      try {
        canvas = api.drawTicketToCanvas({ ...c, name: displayName });
      } catch (e) {
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `Error en drawTicketToCanvas: ${String(e)}`;
        card.appendChild(meta);
        grid.appendChild(card);
        continue;
      }

      if (!canvas) {
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = "drawTicketToCanvas devolvió null (no se pudo generar canvas).";
        card.appendChild(meta);
        grid.appendChild(card);
        continue;
      }

      const img = await canvasToImg(canvas);
      card.appendChild(img);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `full="${c.name}" · ticket="${displayName}" · adultos=${c.adults} · niños=${c.kids}`;
      card.appendChild(meta);

      grid.appendChild(card);
    }
  }

  function init() {
    $("#genBtn").addEventListener("click", () => void generate());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

