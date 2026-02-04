/*
  Invitación Bridget — JavaScript Vanilla
  Restricciones:
  - Sin backend: todo funciona en GitHub Pages.
  - Persistencia simple con localStorage + descarga de archivo (JSON).
  - Código comentado y fácil de extender.
*/

(() => {
  "use strict";

  // =========================
  // Config / constantes
  // =========================
  const STORAGE_KEY = "bridget_rsvp_records_v1";

  // Límites razonables (evitan valores absurdos por error de tecleo)
  const MAX_ADULTS = 30;
  const MAX_KIDS = 30;

  // =========================
  // Helpers
  // =========================
  const $ = (sel) => document.querySelector(sel);
  const clampInt = (value, min, max) => Math.max(min, Math.min(max, value));

  // Nombre para boleto: primer nombre + primer apellido (heurística MX común).
  // Ej:
  // - "Mixtli Omar Fonseca Vega" -> "Mixtli Fonseca"
  // - "Evan Fonseca Gonzalez" -> "Evan Fonseca"
  // - "Familia Pérez" -> "Familia Pérez"
  function toTicketName(fullName) {
    const parts = String(fullName || "")
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .filter(Boolean);

    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
    return `${parts[0]} ${parts[parts.length - 2]}`;
  }

  function safeParseJson(maybeJson, fallback) {
    try {
      const parsed = JSON.parse(maybeJson);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function showToast(message, type = "info") {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
    el.classList.add("is-visible");

    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => el.classList.remove("is-visible"), 3200);
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function downloadTextFile(filename, text, mime = "application/json") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Nota importante (GitHub Pages / sin backend):
  // No podemos “crear/actualizar un archivo en el servidor” desde el navegador.
  // Los registros se guardan en localStorage de ESTE dispositivo.

  // =========================
  // Persistencia (localStorage)
  // =========================
  function loadRecords() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = safeParseJson(raw, []);
    return Array.isArray(arr) ? arr : [];
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function addRecord(record) {
    const records = loadRecords();
    records.push(record);
    saveRecords(records);
    return records;
  }

  function clearRecords() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // =========================
  // UI: totales y lista
  // =========================
  function computeTotals(records) {
    let adults = 0;
    let kids = 0;
    for (const r of records) {
      adults += Number(r.adults || 0);
      kids += Number(r.kids || 0);
    }
    return { adults, kids, guests: adults + kids };
  }

  function renderTotals(records) {
    const totals = computeTotals(records);
    const a = $("#totalAdults");
    const k = $("#totalKids");
    const g = $("#totalGuests");
    if (a) a.textContent = String(totals.adults);
    if (k) k.textContent = String(totals.kids);
    if (g) g.textContent = String(totals.guests);
  }

  function renderList(records) {
    const ul = $("#recordsList");
    if (!ul) return;
    ul.innerHTML = "";

    if (!records.length) {
      const li = document.createElement("li");
      li.textContent = "Aún no hay confirmaciones guardadas en este dispositivo.";
      ul.appendChild(li);
      return;
    }

    for (const r of records.slice().reverse()) {
      const li = document.createElement("li");
      const places = Number(r.adults || 0) + Number(r.kids || 0);
      li.textContent = `${r.name} — ${r.adults} adulto(s), ${r.kids} niño(s) · ${places} lugar(es)`;
      ul.appendChild(li);
    }
  }

  function refreshSidebar() {
    const records = loadRecords();
    renderTotals(records);
    renderList(records);
  }

  // =========================
  // FX: burbujas + peces “clickables”
  // =========================
  const fxLayer = $("#fxLayer");

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnBubbles({ x, y, count = 10 }) {
    if (!fxLayer) return;
    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      b.className = "bubble";
      const size = rand(8, 22);
      b.style.setProperty("--s", `${size}px`);
      b.style.left = `${x + rand(-24, 24)}px`;
      b.style.top = `${y + rand(-10, 10)}px`;
      b.style.setProperty("--d", `${rand(3.2, 5.6)}s`);
      b.style.setProperty("--x", `${rand(-70, 70)}px`);
      fxLayer.appendChild(b);
      window.setTimeout(() => b.remove(), 6500);
    }
  }

  function spawnFishBurst({ from = "left", y = 200, count = 3 }) {
    if (!fxLayer) return;

    for (let i = 0; i < count; i++) {
      const fish = document.createElement("div");
      fish.className = "fish swim";

      const w = rand(44, 88);
      fish.style.setProperty("--w", `${w}px`);
      fish.style.setProperty("--d", `${rand(6.5, 12)}s`);
      fish.style.setProperty("--y", `${y + rand(-40, 40)}px`);
      fish.style.setProperty("--r", `${rand(-6, 6)}deg`);
      // Variación de color (ligera) para que se vea más vivo
      fish.style.filter = `hue-rotate(${rand(-18, 18)}deg) saturate(${rand(1.05, 1.25)})`;

      if (from === "left") {
        fish.style.setProperty("--fromX", "-18vw");
        fish.style.setProperty("--toX", "118vw");
      } else {
        // Si viene “de la derecha”, invertimos desde/to (y volteamos el pez).
        fish.classList.add("is-right");
        fish.style.setProperty("--fromX", "118vw");
        fish.style.setProperty("--toX", "-18vw");
      }

      fxLayer.appendChild(fish);
      window.setTimeout(() => fish.remove(), 14000);
    }
  }

  // =========================
  // Fondo PRO (Canvas): peces + medusas + mantarrayas
  // =========================
  function startOceanCanvas() {
    const canvas = $("#oceanCanvas");
    if (!canvas) return null;

    // Siempre renderizamos (aunque haya reduced-motion): si aplica, reducimos la animación, pero no “desaparecemos” el fondo.
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const state = {
      w: 0,
      h: 0,
      dpr: 1,
      lastT: performance.now(),
      entities: [],
      bubbles: [],
      raf: 0,
    };

    // Performance-first: SOLO 5 animales en total (para móviles).
    // Se dibujan desde el primer frame (sin “tardan en salir”).
    const fishCount = 3;
    const jellyCount = 1;
    const mantaCount = 1;
    const bubbleCount = window.innerWidth < 520 ? 12 : 16;

    function resize() {
      // Reducimos DPR para mejorar FPS en móviles.
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      state.dpr = dpr;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      state.w = Math.floor(cw * dpr);
      state.h = Math.floor(ch * dpr);
      canvas.width = state.w;
      canvas.height = state.h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function rand01() {
      return Math.random();
    }

    function addFish() {
      const type = pick(["clown", "blue", "gold", "puffer"]);
      const dir = rand01() > 0.5 ? 1 : -1;
      const W = canvas.clientWidth || window.innerWidth;
      const H = canvas.clientHeight || window.innerHeight;
      state.entities.push({
        kind: "fish",
        type,
        // visible desde el inicio
        x: 40 + Math.random() * (W - 80),
        y0: 50 + Math.random() * (H - 140),
        dir,
        speed: 14 + Math.random() * 20,
        amp: 8 + Math.random() * 14,
        freq: 0.012 + Math.random() * 0.018,
        phase: Math.random() * Math.PI * 2,
        size: 22 + Math.random() * 22,
        hue: -18 + Math.random() * 36, // se mantiene para compatibilidad, pero evitamos ctx.filter
      });
    }

    function addJelly() {
      const W = canvas.clientWidth || window.innerWidth;
      const H = canvas.clientHeight || window.innerHeight;
      state.entities.push({
        kind: "jelly",
        x: 60 + Math.random() * (W - 120),
        // visible desde el inicio
        y: 80 + Math.random() * (H - 160),
        vy: 7 + Math.random() * 8,
        wobble: 0.9 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        size: 24 + Math.random() * 26,
        hue: 160 + Math.random() * 40,
      });
    }

    function addManta() {
      const dir = rand01() > 0.5 ? 1 : -1;
      const W = canvas.clientWidth || window.innerWidth;
      const H = canvas.clientHeight || window.innerHeight;
      state.entities.push({
        kind: "manta",
        // visible desde el inicio
        x: 80 + Math.random() * (W - 160),
        y0: 70 + Math.random() * (H - 220),
        dir,
        speed: 12 + Math.random() * 12,
        amp: 10 + Math.random() * 18,
        freq: 0.008 + Math.random() * 0.012,
        phase: Math.random() * Math.PI * 2,
        size: 52 + Math.random() * 34,
        hue: 190 + Math.random() * 30,
      });
    }

    function addBubble() {
      state.bubbles.push({
        x: Math.random() * canvas.clientWidth,
        y: canvas.clientHeight + 20 + Math.random() * 120,
        r: 3 + Math.random() * 7,
        vy: 18 + Math.random() * 26,
        drift: -12 + Math.random() * 24,
        phase: Math.random() * Math.PI * 2,
        life: 1,
      });
    }

    function pick(arr) {
      return arr[(Math.random() * arr.length) | 0];
    }

    // init
    resize();
    // Si por algún motivo el canvas aún no tiene tamaño (caso raro), reintenta en el próximo frame.
    if (canvas.clientWidth < 10 || canvas.clientHeight < 10) {
      requestAnimationFrame(() => {
        resize();
      });
    }
    state.entities.length = 0;
    state.bubbles.length = 0;
    for (let i = 0; i < fishCount; i++) addFish();
    for (let i = 0; i < jellyCount; i++) addJelly();
    for (let i = 0; i < mantaCount; i++) addManta();
    for (let i = 0; i < bubbleCount; i++) addBubble();

    function drawFish(e, t) {
      const x = e.x;
      const y = e.y;
      const s = e.size;
      const dir = e.dir;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);

      // cuerpo
      const grad = ctx.createLinearGradient(-s, -s, s, s);
      if (e.type === "clown") {
        grad.addColorStop(0, "rgba(255, 143, 177, 0.95)");
        grad.addColorStop(1, "rgba(255, 210, 120, 0.95)");
      } else if (e.type === "puffer") {
        grad.addColorStop(0, "rgba(255, 242, 214, 0.95)");
        grad.addColorStop(1, "rgba(125, 227, 246, 0.95)");
      } else if (e.type === "gold") {
        grad.addColorStop(0, "rgba(255, 210, 120, 0.95)");
        grad.addColorStop(1, "rgba(255, 143, 177, 0.8)");
      } else {
        grad.addColorStop(0, "rgba(125, 227, 246, 0.95)");
        grad.addColorStop(1, "rgba(122, 169, 255, 0.95)");
      }

      ctx.fillStyle = grad;
      roundRect2(ctx, -s * 1.15, -s * 0.65, s * 2.1, s * 1.25, s * 0.65);
      ctx.fill();

      // cola (mueve con sin)
      const wag = Math.sin(t * 0.012 + e.phase) * 0.5;
      ctx.save();
      ctx.translate(-s * 1.18, 0);
      ctx.rotate(wag * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-s * 0.7, -s * 0.55);
      ctx.lineTo(-s * 0.7, s * 0.55);
      ctx.closePath();
      ctx.fillStyle = "rgba(122,169,255,0.85)";
      ctx.fill();
      ctx.restore();

      // franjas para clown
      if (e.type === "clown") {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        roundRect2(ctx, -s * 0.25, -s * 0.62, s * 0.25, s * 1.24, s * 0.25);
        ctx.fill();
        roundRect2(ctx, s * 0.35, -s * 0.62, s * 0.22, s * 1.24, s * 0.22);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ojo + sonrisa
      ctx.fillStyle = "rgba(21,50,62,0.82)";
      ctx.beginPath();
      ctx.arc(s * 0.55, -s * 0.15, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(s * 0.52, -s * 0.18, s * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // sonrisa (arco)
      ctx.strokeStyle = "rgba(21,50,62,0.45)";
      ctx.lineWidth = Math.max(2, s * 0.06);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(s * 0.62, s * 0.12, s * 0.18, Math.PI * 0.12, Math.PI * 0.92);
      ctx.stroke();

      ctx.restore();
    }

    function drawJelly(e, t) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const s = e.size;
      const wob = Math.sin(t * 0.003 * e.wobble + e.phase) * 6;

      // cúpula
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(0, -s * 1.25, s, 0);
      ctx.quadraticCurveTo(0, s * 0.55, -s, 0);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fill();
      ctx.strokeStyle = "rgba(125,227,246,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // carita
      ctx.fillStyle = "rgba(21,50,62,0.55)";
      ctx.beginPath();
      ctx.arc(-s * 0.25, -s * 0.05, 2.5, 0, Math.PI * 2);
      ctx.arc(s * 0.25, -s * 0.05, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(21,50,62,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, s * 0.18, s * 0.18, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();

      // tentáculos (wiggle)
      ctx.strokeStyle = "rgba(255,143,177,0.34)";
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        const x0 = (i / 3) * s * 0.55;
        ctx.beginPath();
        ctx.moveTo(x0, s * 0.25);
        ctx.quadraticCurveTo(x0 + wob, s * 0.7, x0 - wob, s * 1.25);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawManta(e, t) {
      const x = e.x;
      const y = e.y;
      const s = e.size;
      const dir = e.dir;
      const flap = Math.sin(t * 0.006 + e.phase) * 0.35;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);

      ctx.beginPath();
      // alas
      ctx.moveTo(-s * 1.25, 0);
      ctx.quadraticCurveTo(-s * 0.2, -s * (0.8 + flap), 0, -s * 0.15);
      ctx.quadraticCurveTo(s * 0.2, -s * (0.8 - flap), s * 1.25, 0);
      // cuerpo
      ctx.quadraticCurveTo(0, s * 0.75, -s * 1.25, 0);
      ctx.closePath();
      ctx.fillStyle = "rgba(122,169,255,0.42)";
      ctx.fill();
      ctx.strokeStyle = "rgba(21,50,62,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // carita
      ctx.fillStyle = "rgba(21,50,62,0.48)";
      ctx.beginPath();
      ctx.arc(s * 0.22, -s * 0.05, 2.6, 0, Math.PI * 2);
      ctx.arc(s * 0.42, -s * 0.05, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(21,50,62,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s * 0.34, s * 0.12, s * 0.22, Math.PI * 0.12, Math.PI * 0.9);
      ctx.stroke();

      // cola
      ctx.strokeStyle = "rgba(21,50,62,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 1.1, 0);
      ctx.quadraticCurveTo(-s * 1.6, s * 0.45, -s * 2.0, s * 0.1);
      ctx.stroke();

      ctx.restore();
    }

    function roundRect2(ctx2, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx2.beginPath();
      ctx2.moveTo(x + rr, y);
      ctx2.arcTo(x + w, y, x + w, y + h, rr);
      ctx2.arcTo(x + w, y + h, x, y + h, rr);
      ctx2.arcTo(x, y + h, x, y, rr);
      ctx2.arcTo(x, y, x + w, y, rr);
      ctx2.closePath();
    }

    function step(now) {
      const dt = Math.min(0.034, (now - state.lastT) / 1000);
      state.lastT = now;

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      // Diagnóstico visible si el canvas no tiene tamaño (evita “no veo nada”)
      if (W < 10 || H < 10) {
        ctx.clearRect(0, 0, Math.max(1, W), Math.max(1, H));
        state.raf = requestAnimationFrame(step);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      // burbujas de fondo
      for (let i = state.bubbles.length - 1; i >= 0; i--) {
        const b = state.bubbles[i];
        b.y -= b.vy * dt * (reduceMotion ? 0.25 : 1);
        b.x += (Math.sin(now * 0.001 + b.phase) * 0.6 + b.drift * 0.04) * dt * 60;
        b.life -= dt * 0.08;
        const alpha = Math.max(0, Math.min(0.55, b.life));

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(125,227,246,0.35)";
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (b.y < -40 || b.life <= 0) {
          state.bubbles.splice(i, 1);
          addBubble();
        }
      }

      // entidades
      for (const e of state.entities) {
        if (e.kind === "fish") {
          e.x += e.dir * e.speed * dt * (reduceMotion ? 0.25 : 1);
          e.y = e.y0 + Math.sin(e.phase + e.x * e.freq) * e.amp;
          if (e.dir === 1 && e.x > W + 80) {
            e.x = -80;
            e.y0 = 50 + Math.random() * (H - 140);
          } else if (e.dir === -1 && e.x < -160) {
            e.x = W + 80;
            e.y0 = 50 + Math.random() * (H - 140);
          }
          drawFish(e, now);
        } else if (e.kind === "jelly") {
          e.y -= e.vy * dt * (reduceMotion ? 0.25 : 1);
          e.x += Math.sin(now * 0.0018 + e.phase) * 0.18;
          if (e.y < -120) {
            e.y = H + 140;
            e.x = 40 + Math.random() * (W - 80);
          }
          drawJelly(e, now);
        } else if (e.kind === "manta") {
          e.x += e.dir * e.speed * dt * (reduceMotion ? 0.25 : 1);
          e.y = e.y0 + Math.sin(e.phase + e.x * e.freq) * e.amp;
          if (e.dir === 1 && e.x > W + 140) {
            e.x = -140;
            e.y0 = 60 + Math.random() * (H - 220);
          } else if (e.dir === -1 && e.x < -140) {
            e.x = W + 140;
            e.y0 = 60 + Math.random() * (H - 220);
          }
          drawManta(e, now);
        }
      }

      state.raf = requestAnimationFrame(step);
    }

    state.raf = requestAnimationFrame(step);

    // Resize robusto: window + ResizeObserver para asegurar tamaño real
    window.addEventListener("resize", resize, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => resize());
      ro.observe(canvas);
    }

    return state;
  }

  // =========================
  // Sonido opcional (sin archivo): burbuja suave con WebAudio
  // =========================
  let audioReady = false;
  let audioCtx = null;
  let audioNoiseBuffer = null;

  function ensureAudio() {
    if (audioReady) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    audioCtx = new AudioContext();
    audioReady = true;
    return true;
  }

  function withAudioReady(fn) {
    // Muchos navegadores (especialmente móvil) requieren “desbloquear” audio con gesto del usuario.
    // Esta función asegura que si el contexto está suspendido, primero se reanuda y luego se ejecuta `fn`.
    if (!ensureAudio() || !audioCtx) return;
    const run = () => {
      try {
        fn();
      } catch {
        // Silencioso: no rompemos UX si el audio falla
      }
    };
    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(run).catch(() => { });
    } else {
      run();
    }
  }

  function getNoiseBuffer() {
    if (!audioCtx) return null;
    if (audioNoiseBuffer) return audioNoiseBuffer;
    const seconds = 1;
    const sampleRate = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, sampleRate * seconds, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    audioNoiseBuffer = buffer;
    return audioNoiseBuffer;
  }

  function playBubbleSound() {
    withAudioReady(() => {
      const t0 = audioCtx.currentTime + 0.005;
      const dur = 0.25;

      // “Pop” suave: seno + filtro + envolvente rápida
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0 + dur);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, t0);
      filter.frequency.exponentialRampToValueAtTime(700, t0 + dur);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    });
  }

  // Jingle ORIGINAL (sin melodías reconocibles).
  // Corto (~1.2s), “fiesta” con percusión + bajo + stabs.
  function playFiestaJingle() {
    withAudioReady(() => {
      const t0 = audioCtx.currentTime + 0.02;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.exponentialRampToValueAtTime(0.34, t0 + 0.03);
      master.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.25);
      master.connect(audioCtx.destination);

      // Helpers
      const scheduleKick = (time) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(55, time + 0.11);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(0.95, time + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
        osc.connect(g);
        g.connect(master);
        osc.start(time);
        osc.stop(time + 0.16);
      };

      const scheduleNoiseHit = (time, { type = "clap", gain = 0.28 } = {}) => {
        const buf = getNoiseBuffer();
        if (!buf) return;
        const src = audioCtx.createBufferSource();
        src.buffer = buf;

        const g = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        const hp = audioCtx.createBiquadFilter();

        if (type === "hat") {
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(9500, time);
          filter.Q.setValueAtTime(0.9, time);
          hp.type = "highpass";
          hp.frequency.setValueAtTime(7200, time);
        } else {
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(2400, time);
          filter.Q.setValueAtTime(0.75, time);
          hp.type = "highpass";
          hp.frequency.setValueAtTime(950, time);
        }

        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(gain, time + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, time + (type === "hat" ? 0.05 : 0.10));

        src.connect(filter);
        filter.connect(hp);
        hp.connect(g);
        g.connect(master);

        src.start(time);
        src.stop(time + 0.14);
      };

      const scheduleBass = (time, freq, dur = 0.18) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const lp = audioCtx.createBiquadFilter();

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, time);
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(240, time);
        lp.Q.setValueAtTime(0.7, time);

        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(0.32, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc.connect(lp);
        lp.connect(g);
        g.connect(master);
        osc.start(time);
        osc.stop(time + dur + 0.02);
      };

      const scheduleStab = (time, freqs, dur = 0.12) => {
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(0.18, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        g.connect(master);

        for (const f of freqs) {
          const osc = audioCtx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, time);
          osc.connect(g);
          osc.start(time);
          osc.stop(time + dur + 0.02);
        }
      };

      // Tempo
      const bpm = 122;
      const beat = 60 / bpm;
      const steps = 8;

      for (let i = 0; i < steps; i++) {
        const t = t0 + i * beat;
        if (i === 0 || i === 4) scheduleKick(t);
        const swing = i % 2 === 1 ? beat * 0.08 : 0;
        scheduleNoiseHit(t + swing, { type: "hat", gain: 0.16 });
        if (i === 2 || i === 6) scheduleNoiseHit(t + 0.005, { type: "clap", gain: 0.28 });
      }

      const A2 = 110;
      const C3 = 130.81;
      const E3 = 164.81;
      scheduleBass(t0 + beat * 0, A2, 0.22);
      scheduleBass(t0 + beat * 1, A2, 0.16);
      scheduleBass(t0 + beat * 2, C3, 0.18);
      scheduleBass(t0 + beat * 3, E3, 0.18);
      scheduleBass(t0 + beat * 4, A2, 0.22);
      scheduleBass(t0 + beat * 6, C3, 0.16);

      const A4 = 440;
      const C5 = 523.25;
      const E5 = 659.25;
      scheduleStab(t0 + beat * 0.5, [A4, C5, E5], 0.10);
      scheduleStab(t0 + beat * 2.5, [A4, C5, E5], 0.10);
      scheduleStab(t0 + beat * 4.5, [A4, C5, E5], 0.10);
      scheduleStab(t0 + beat * 6.5, [A4, C5, E5], 0.10);
    });
  }

  // =========================
  // Ticket: render UI + export a PNG (canvas)
  // =========================
  function setTicketUI({ name, adults, kids }) {
    const places = adults + kids;
    $("#ticketName").textContent = name;
    $("#ticketAdults").textContent = String(adults);
    $("#ticketKids").textContent = String(kids);
    $("#ticketMessage").textContent = `Hemos reservado ${places} lugar(es) para ti.`;

    $("#ticket").hidden = false;
  }

  function drawTicketToCanvas({ name, adults, kids }) {
    // Si existe el canvas en el DOM (index.html), lo reutilizamos.
    // Si no existe (p.ej. ticket-test.html), creamos uno offscreen.
    const canvas =
      $("#ticketCanvas") ||
      (() => {
        const c = document.createElement("canvas");
        c.width = 1200;
        c.height = 700;
        return c;
      })();
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Tamaño del canvas ya está en HTML (1200x700).
    const W = canvas.width;
    const H = canvas.height;

    // Fondo
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#baf3ff");
    bg.addColorStop(1, "#ffe0ea");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Burbujas decorativas
    ctx.globalAlpha = 0.32;
    for (let i = 0; i < 18; i++) {
      const r = rand(16, 44);
      const x = rand(60, W - 60);
      const y = rand(60, H - 60);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(125,227,246,0.5)";
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Tarjeta central
    const pad = 70;
    const cardX = pad;
    const cardY = pad;
    const cardW = W - pad * 2;
    const cardH = H - pad * 2;
    const radius = 34;

    // Sombra
    ctx.save();
    ctx.shadowColor = "rgba(21,50,62,0.22)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fill();
    ctx.restore();

    // Borde suave
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(21,50,62,0.10)";
    ctx.stroke();

    // Header
    ctx.fillStyle = "rgba(21,50,62,0.9)";
    ctx.font = "900 54px 'Baloo 2', system-ui, sans-serif";
    ctx.fillText("🐠 Fiesta de 3 años", cardX + 46, cardY + 95);

    ctx.font = "800 40px 'Nunito', system-ui, sans-serif";
    ctx.fillStyle = "rgba(21,50,62,0.85)";
    ctx.fillText("Boleto digital", cardX + 46, cardY + 150);

    // ===== Layout vertical seguro (sin solapes) =====
    // Definimos una zona inferior fija para detalles/footer y calculamos el resto en flujo.
    const left = cardX + 46;
    const right = cardX + cardW - 46;
    const maxWidth = right - left;

    const footerText = "Presenta este boleto al llegar.";
    const details1 = "Misa: 11:50 am · Inmaculada Concepción";
    const details2 = "Salón: 1:00–1:30 pm · Salón de banquetes Arana";

    const footerY = cardY + cardH - 44;
    const details2Y = footerY - 30;
    const details1Y = details2Y - 34;
    const messageBottom = details1Y - 16;

    // Pre-calculamos métricas del mensaje para evitar que el texto “suba” y se meta encima de los cuadros.
    const messageFont = "900 38px 'Nunito', system-ui, sans-serif";
    ctx.font = messageFont;
    const msgMetrics = getFontMetrics(ctx);

    // Nombre (1–2 líneas) con altura real
    ctx.font = "900 56px 'Baloo 2', system-ui, sans-serif";
    ctx.fillStyle = "#15323e";
    let y = cardY + 220;
    y = drawWrappedText(ctx, String(name || "").trim(), left, y, maxWidth, 58, 2);

    // Conteos (altura dinámica según espacio disponible)
    const boxGap = 24;
    const boxW = (cardW - 46 * 2 - boxGap) / 2;
    const leftX = left;
    const rightX = leftX + boxW + boxGap;

    const minMessageH = 42; // al menos 1 línea
    const boxMarginAfter = 20; // margen extra para casos con nombre largo
    const desiredBoxH = 150;

    const boxY = y + 12; // debajo del nombre
    // Asegura espacio para que el mensaje no se encime con los cuadros:
    // - boxMarginAfter: espacio visual entre cuadros y texto
    // - msgMetrics.ascent: evita que el texto (que sube sobre la línea base) pise el borde superior
    // - msgMetrics.descent: asegura que la parte inferior del texto no choque con el límite
    const maxBoxH = messageBottom - boxY - boxMarginAfter - msgMetrics.ascent - msgMetrics.descent - 6;
    // IMPORTANTE: NO forzamos un mínimo fijo. Si el nombre ocupa 2 líneas, el cuadro debe encogerse
    // para garantizar que el mensaje quede debajo y dentro del recuadro blanco.
    let boxH = Math.min(desiredBoxH, Math.floor(maxBoxH));
    // Límite inferior “técnico” para que el cuadro siga dibujándose legible (con clipping).
    boxH = Math.max(56, boxH);

    drawCountBox(ctx, leftX, boxY, boxW, boxH, "Adultos", adults);
    drawCountBox(ctx, rightX, boxY, boxW, boxH, "Niños", kids);

    const places = adults + kids;
    // La coordenada Y en canvas para fillText es la línea base.
    // Para que el texto NO se vea encima de los cuadros, empujamos la línea base por el ascent.
    let messageTop = boxY + boxH + boxMarginAfter + msgMetrics.ascent;
    const messageMaxBaselineY = messageBottom - msgMetrics.descent;

    // Si aún no cabe (caso extremo con nombre muy largo), reducimos boxH para abrir espacio.
    if (messageTop > messageMaxBaselineY) {
      const overflow = messageTop - messageMaxBaselineY;
      boxH = Math.max(56, boxH - overflow - 8);
      messageTop = boxY + boxH + boxMarginAfter + msgMetrics.ascent;
    }

    // Si sigue sin caber, bajamos el tamaño del mensaje.
    if (messageTop > messageMaxBaselineY) {
      const smallerMessageFont = "900 34px 'Nunito', system-ui, sans-serif";
      ctx.font = smallerMessageFont;
      const m2 = getFontMetrics(ctx);
      const maxBoxH2 = messageBottom - boxY - boxMarginAfter - m2.ascent - m2.descent - 6;
      boxH = Math.min(desiredBoxH, Math.floor(maxBoxH2));
      boxH = Math.max(56, boxH);
      messageTop = boxY + boxH + boxMarginAfter + m2.ascent;
      ctx.font = smallerMessageFont;
    } else {
      ctx.font = messageFont;
    }

    // Mensaje: se ajusta al espacio disponible y se trunca si es necesario
    ctx.fillStyle = "rgba(21,50,62,0.9)";
    drawWrappedTextClamped(ctx, `Hemos reservado ${places} lugar(es) para ti.`, left, messageTop, maxWidth, 42, messageBottom);

    // Detalles (siempre dentro del card)
    ctx.font = "800 28px 'Nunito', system-ui, sans-serif";
    ctx.fillStyle = "rgba(21,50,62,0.78)";
    ctx.fillText(ellipsize(ctx, details1, maxWidth), left, details1Y);
    ctx.fillText(ellipsize(ctx, details2, maxWidth), left, details2Y);

    // Footer
    ctx.font = "800 26px 'Nunito', system-ui, sans-serif";
    ctx.fillStyle = "rgba(21,50,62,0.58)";
    ctx.fillText(ellipsize(ctx, footerText, maxWidth), left, footerY);

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawCountBox(ctx, x, y, w, h, label, value) {
    roundRect(ctx, x, y, w, h, 26);
    ctx.fillStyle = "rgba(255,242,214,0.55)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(21,50,62,0.10)";
    ctx.stroke();

    // Clip: evita que textos se dibujen fuera del recuadro cuando el alto se reduce.
    ctx.save();
    roundRect(ctx, x, y, w, h, 26);
    ctx.clip();

    ctx.fillStyle = "rgba(21,50,62,0.86)";
    const numSize = clampInt(Math.floor(h * 0.46), 20, 64);
    ctx.font = `900 ${numSize}px 'Baloo 2', system-ui, sans-serif`;
    ctx.fillText(String(value), x + 24, y + Math.max(54, Math.floor(h * 0.62)));

    ctx.fillStyle = "rgba(21,50,62,0.70)";
    const labelSize = clampInt(Math.floor(h * 0.22), 14, 30);
    ctx.font = `900 ${labelSize}px 'Nunito', system-ui, sans-serif`;
    ctx.fillText(label, x + 24, y + Math.max(68, Math.floor(h * 0.84)));

    ctx.restore();
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = String(text).split(/\s+/).filter(Boolean);
    let line = "";
    let lines = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
        continue;
      }

      // pinta línea actual
      if (line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        lines++;
      }

      // si ya no caben más líneas, truncamos
      if (lines >= maxLines - 1) {
        const rest = [word, ...words.slice(i + 1)].join(" ");
        ctx.fillText(ellipsize(ctx, rest, maxWidth), x, y);
        return y + lineHeight;
      }

      line = word;
    }

    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  function drawWrappedTextClamped(ctx, text, x, y, maxWidth, lineHeight, maxY) {
    // Similar a drawWrappedText pero no se pasa de maxY; si no cabe, el último renglón va con …
    const words = String(text).split(/\s+/).filter(Boolean);
    let line = "";
    while (words.length) {
      // si ya no cabe otra línea completa, truncamos el resto
      if (y + lineHeight > maxY) {
        const rest = [line, ...words].join(" ").trim();
        ctx.fillText(ellipsize(ctx, rest, maxWidth), x, y);
        return y + lineHeight;
      }

      const word = words.shift();
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
        continue;
      }

      // pinta línea actual y reinicia con la palabra que no cupo
      if (line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
      }
      line = word;
    }

    if (line) {
      ctx.fillText(ellipsize(ctx, line, maxWidth), x, y);
      y += lineHeight;
    }
    return y;
  }

  function getFontMetrics(ctx) {
    // `actualBoundingBoxAscent/Descent` ayuda a evitar solapes por diferencias de fuentes.
    const m = ctx.measureText("Mg");
    const ascent = Number.isFinite(m.actualBoundingBoxAscent) ? m.actualBoundingBoxAscent : 30;
    const descent = Number.isFinite(m.actualBoundingBoxDescent) ? m.actualBoundingBoxDescent : 10;
    return { ascent, descent };
  }

  function ellipsize(ctx, text, maxWidth) {
    let s = String(text);
    if (ctx.measureText(s).width <= maxWidth) return s;
    while (s.length > 0 && ctx.measureText(s + "…").width > maxWidth) {
      s = s.slice(0, -1);
    }
    return (s || "").trimEnd() + "…";
  }

  function truncate(text, maxLen) {
    const s = String(text || "").trim();
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + "…";
  }

  async function ensureFontsReady(timeoutMs = 2500) {
    // En canvas, lo más importante es dibujar DESPUÉS de que carguen las fuentes
    // para que el PNG use la tipografía final (y no fallback).
    if (!document.fonts || !document.fonts.ready) return;
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // no bloqueamos la descarga si algo falla
    }
  }

  async function downloadTicketPng(record) {
    await ensureFontsReady();
    const canvas = drawTicketToCanvas(record);
    if (!canvas) {
      showToast("No se pudo generar el boleto (canvas no disponible).", "error");
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `boleto-${slugify(record.name)}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      "image/png",
      1
    );
  }

  function slugify(text) {
    return String(text || "invitado")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);
  }

  // =========================
  // Descarga de registros (JSON)
  // =========================
  // Nota: por requerimiento de UX, evitamos descargas automáticas de registros.
  // El único botón de descarga visible es el del boleto en PNG.

  // =========================
  // Validación de formulario
  // =========================
  function validateForm({ name, adults, kids }) {
    const errors = [];

    if (!name || !name.trim()) errors.push("El nombre es obligatorio.");

    if (!Number.isFinite(adults) || adults < 0) errors.push("Adultos debe ser un número positivo (0 o más).");
    if (!Number.isFinite(kids) || kids < 0) errors.push("Niños debe ser un número positivo (0 o más).");

    if (adults > MAX_ADULTS) errors.push(`Adultos no puede ser mayor a ${MAX_ADULTS}.`);
    if (kids > MAX_KIDS) errors.push(`Niños no puede ser mayor a ${MAX_KIDS}.`);

    const places = adults + kids;
    if (places <= 0) errors.push("Debes reservar al menos 1 lugar (adultos + niños).");

    return { ok: errors.length === 0, errors };
  }

  // =========================
  // Eventos
  // =========================
  let lastConfirmedRecord = null;

  function onConfirmSubmit(ev) {
    ev.preventDefault();

    const name = $("#guestName").value;
    const adultsRaw = Number($("#adults").value);
    const kidsRaw = Number($("#kids").value);

    const adults = clampInt(Math.floor(adultsRaw), 0, MAX_ADULTS);
    const kids = clampInt(Math.floor(kidsRaw), 0, MAX_KIDS);

    // Si el usuario escribió decimales/valores fuera de rango, normalizamos inputs
    $("#adults").value = String(adults);
    $("#kids").value = String(kids);

    const v = validateForm({ name, adults, kids });
    if (!v.ok) {
      showToast(v.errors[0], "error");
      // Pequeña animación “negativa”: burbujas mínimas para feedback sin castigo
      const rect = $("#confirmBtn").getBoundingClientRect();
      spawnBubbles({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 6 });
      return;
    }

    // Registro
    const fullName = String(name || "").trim();
    const ticketName = toTicketName(fullName);
    const record = {
      // `crypto` existe en navegadores modernos; esta forma evita ReferenceError en entornos viejos.
      id:
        globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: nowIso(),
      // `name`: lo que se muestra en ticket/lista (corto)
      name: ticketName,
      // `nameFull`: para export/consolidación (si se requiere)
      nameFull: fullName,
      adults,
      kids,
      places: adults + kids,
    };

    const records = addRecord(record);
    lastConfirmedRecord = record;

    // Enviar al backend (Cloudflare D1) - "Fire and forget" para no bloquear UI
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch((err) => console.error("Error al guardar en backend:", err));

    // UI
    refreshSidebar();
    setTicketUI(record);

    // Animaciones de celebración
    const btnRect = $("#confirmBtn").getBoundingClientRect();
    spawnBubbles({ x: btnRect.left + btnRect.width / 2, y: btnRect.top + btnRect.height / 2, count: 14 });
    spawnFishBurst({
      from: Math.random() > 0.5 ? "left" : "right",
      y: btnRect.top + btnRect.height / 2,
      count: 4,
    });

    // Sonido suave (siempre activo; el navegador lo permite por interacción)
    playBubbleSound();
    playFiestaJingle();

    showToast("¡Asistencia confirmada! Tu boleto está listo para descargar.", "success");
    scrollToId("ticket");
  }

  function onClearLocal() {
    clearRecords();
    refreshSidebar();
    showToast("Listo: se borraron los registros de este dispositivo.", "success");
  }

  function onDownloadTicketPng() {
    if (!lastConfirmedRecord) {
      showToast("Primero confirma tu asistencia para generar tu boleto.", "info");
      scrollToId("rsvp");
      return;
    }
    downloadTicketPng(lastConfirmedRecord);
    showToast("Boleto generado en PNG.", "success");
  }

  function onFabClick() {
    // Abre/cierra RSVP con scroll suave + mini FX
    const rect = $("#fabRsvp").getBoundingClientRect();
    spawnBubbles({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 10 });
    spawnFishBurst({ from: "left", y: rect.top + rect.height / 2, count: 2 });
    scrollToId("rsvp");
  }

  function attachButtonFx(btn) {
    if (!btn) return;
    btn.addEventListener("click", (ev) => {
      // Si es submit, el handler principal se encarga; aquí hacemos FX ligeros en clicks generales
      if (btn.type === "submit") return;
      const r = btn.getBoundingClientRect();
      spawnBubbles({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 8 });
      spawnFishBurst({ from: Math.random() > 0.5 ? "left" : "right", y: r.top + r.height / 2, count: 2 });
    });
  }

  // =========================
  // Música de fondo (Macarena)
  // =========================
  function playBackgroundMusic() {
    const audio = new Audio("./music/Macarena.mp3");
    audio.currentTime = 2; // Inicia en el segundo 2
    audio.loop = true;
    audio.volume = 0.4; // Volumen moderado

    const attemptPlay = () => {
      audio.play().catch(() => {
        // Si falla (bloqueo de autoplay), esperamos a la primera interacción
        document.addEventListener("click", () => audio.play(), { once: true });
        document.addEventListener("touchstart", () => audio.play(), { once: true });
      });
    };

    attemptPlay();
  }

  // =========================
  // Init
  // =========================
  function init() {
    playBackgroundMusic();
    refreshSidebar();

    // Desbloqueo temprano de audio (primer toque/clic) para iOS/Android.
    window.addEventListener(
      "pointerdown",
      () => {
        withAudioReady(() => { });
      },
      { once: true, passive: true }
    );

    // Fondo pro (canvas)
    startOceanCanvas();

    // Eventos UI
    const form = $("#rsvpForm");
    if (form) form.addEventListener("submit", onConfirmSubmit);

    const clearBtn = $("#clearLocalBtn");
    if (clearBtn) clearBtn.addEventListener("click", onClearLocal);

    const dlTicketBtn = $("#downloadTicketPngBtn");
    if (dlTicketBtn) dlTicketBtn.addEventListener("click", onDownloadTicketPng);

    const fab = $("#fabRsvp");
    if (fab) fab.addEventListener("click", onFabClick);

    // Efectos extra en botones
    attachButtonFx($("#downloadTicketPngBtn"));
    attachButtonFx($("#clearLocalBtn"));

    // CTA del hero (mismo scroll + FX)
    const cta = $("#ctaRsvp");
    if (cta) {
      cta.addEventListener("click", () => {
        const r = cta.getBoundingClientRect();
        spawnBubbles({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 10 });
        spawnFishBurst({ from: "right", y: r.top + r.height / 2, count: 2 });
      });
    }

    // Ajuste: si cambia tamaño de pantalla, recolocamos burbujas de fondo (reinicio simple)
    window.addEventListener(
      "resize",
      debounce(() => {
        // El canvas se encarga de reajustar por su listener interno.
      }, 250)
    );

    // Cursor fish (desktop): efecto visual ligero
    initCursorFish();
  }

  function debounce(fn, wait) {
    let t = null;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  }

  function initCursorFish() {
    const el = $("#cursorFish");
    if (!el) return;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let on = false;

    const tick = () => {
      // suavizado (lerp)
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const enable = () => {
      if (on) return;
      on = true;
      el.classList.add("is-on");
      raf = requestAnimationFrame(tick);
    };

    const disable = () => {
      on = false;
      el.classList.remove("is-on");
      cancelAnimationFrame(raf);
    };

    // Usamos pointer para soportar mouse/touch; en touch lo activamos solo cuando mueve.
    window.addEventListener("pointermove", (e) => {
      // Posicionamos relativo al viewport; compensamos un poco para “seguir”
      tx = e.clientX + 12;
      ty = e.clientY + 10;
      enable();
    });

    window.addEventListener("pointerleave", disable);
    window.addEventListener("blur", disable);
  }

  // Exports de depuración para tests (sin romper producción)
  if (globalThis.__INVITACION_DEBUG__) {
    globalThis.__INVITACION__ = {
      loadRecords,
      saveRecords,
      clearRecords,
      validateForm,
      computeTotals,
      slugify,
      // Debug visual: permite generar el canvas del boleto en páginas de prueba
      drawTicketToCanvas,
      toTicketName,
    };
  }

  // Arranque
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

