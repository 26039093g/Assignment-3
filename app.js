(() => {
  "use strict";
  const STORAGE_KEY = "mallow-garden-v1";
  const HOUR = 60 * 60 * 1000;
  const DEFAULT_STATE = { happiness: 72, lastTick: Date.now(), paused: false, pausedAt: null };
  let state = { ...DEFAULT_STATE };
  let storageAvailable = true;
  let lastVisibleMessage = "Agi is glad you're here.";

  const els = {
    flower: document.querySelector("#flower"), value: document.querySelector("#happiness-value"),
    garden: document.querySelector(".garden-card"),
    track: document.querySelector("#meter-track"), fill: document.querySelector("#meter-fill"),
    hint: document.querySelector("#care-hint"), next: document.querySelector("#next-change"),
    mood: document.querySelector("#mood-label"), dot: document.querySelector("#status-dot"),
    feedback: document.querySelector("#feedback"), resetDialog: document.querySelector("#reset-dialog"),
    settingsDialog: document.querySelector("#settings-dialog"), pause: document.querySelector("#pause-button"),
    pauseDescription: document.querySelector("#pause-description"), water: document.querySelector("#water-button"),
    rain: document.querySelector(".garden-rain"),
    sun: document.querySelector("#sun-button")
  };

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object" || !Number.isFinite(saved.happiness) || !Number.isFinite(saved.lastTick)) throw new Error("Invalid saved garden");
      state = {
        happiness: Math.max(0, Math.min(100, saved.happiness)),
        lastTick: saved.lastTick,
        paused: saved.paused === true,
        pausedAt: Number.isFinite(saved.pausedAt) ? saved.pausedAt : null
      };
      if (state.paused && state.pausedAt === null) state.paused = false;
      applyElapsedTime();
    } catch (error) {
      state = { ...DEFAULT_STATE, lastTick: Date.now() };
      if (error && error.name === "SecurityError") storageAvailable = false;
      else { try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) { storageAvailable = false; } }
    }
  }

  function saveState() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) {
      storageAvailable = false;
      lastVisibleMessage = "Your browser isn't saving this garden, but you can still care for Agi while this page is open.";
    }
  }

  function applyElapsedTime() {
    if (state.paused) return;
    const now = Date.now();
    const elapsed = Math.max(0, now - state.lastTick);
    const lost = Math.floor(elapsed / HOUR) * 5;
    if (lost > 0) {
      state.happiness = Math.max(0, state.happiness - lost);
      state.lastTick += Math.floor(elapsed / HOUR) * HOUR;
    }
  }

  function setMessage(message) {
    lastVisibleMessage = message;
    els.feedback.textContent = message;
    els.feedback.classList.remove("pop");
    void els.feedback.offsetWidth;
    els.feedback.classList.add("pop");
  }

  function moodFor(value) {
    if (value <= 20) return { mood: "Agi is feeling a little low", hint: "A sip of water or a bit of sun could help.", cls: "is-sad", color: "#d39b8c" };
    if (value <= 45) return { mood: "Agi could use some care", hint: "Try a little water to lift the mood.", cls: "is-parched", color: "#d8b66b" };
    if (value >= 85) return { mood: "Agi is blooming happily", hint: "Agi feels lovely and cared for.", cls: "is-happy", color: "#91a77b" };
    if (value >= 60) return { mood: "Agi is feeling okay", hint: "A little sunshine might brighten the day.", cls: "", color: "#91a77b" };
    return { mood: "Agi is ready for a pick-me-up", hint: "Water brings a refreshing boost.", cls: "", color: "#c9a856" };
  }

  function timeUntilDip() {
    if (state.paused) return "Clock paused";
    const elapsed = Math.max(0, Date.now() - state.lastTick);
    const remaining = HOUR - (elapsed % HOUR);
    const minutes = Math.ceil(remaining / 60000);
    if (minutes <= 1) return "Next dip in less than a minute";
    if (minutes < 60) return `Next dip in ${minutes} minutes`;
    return "Next dip in 1 hour";
  }

  function render() {
    applyElapsedTime();
    const value = Math.round(state.happiness);
    const mood = moodFor(value);
    els.value.innerHTML = `${value}<span>%</span>`;
    els.fill.style.width = `${value}%`;
    els.fill.style.background = `linear-gradient(90deg, ${mood.color}, #bdc78a)`;
    els.track.setAttribute("aria-valuenow", String(value));
    els.mood.textContent = mood.mood;
    els.hint.textContent = mood.hint;
    els.next.textContent = timeUntilDip();
    els.dot.style.background = mood.color;
    els.flower.classList.remove("is-happy", "is-sad", "is-parched");
    if (mood.cls) els.flower.classList.add(mood.cls);
    els.pause.textContent = state.paused ? "Resume" : "Pause";
    els.pause.setAttribute("aria-pressed", String(state.paused));
    els.pauseDescription.textContent = state.paused ? "Time is paused; Agi's mood is resting." : "Time is passing gently.";
    saveState();
  }

  function care(kind) {
    render();
    const before = state.happiness;
    const amount = kind === "water" ? 18 : 13;
    if (before >= 100) {
      setMessage(`Agi is already full of ${kind === "water" ? "freshness" : "sunshine"}. A quiet hello is enough for now.`);
      render(); return;
    }
    state.happiness = Math.min(100, before + amount);
    const gained = Math.round(state.happiness - before);
    if (!state.paused && before < 100) state.lastTick = Date.now();
    setMessage(kind === "water"
      ? `A refreshing sip! Agi's happiness rose by ${gained}%.`
      : `A warm sunbeam! Agi's happiness rose by ${gained}%.`);
    els.flower.classList.remove("is-watering", "is-sunny", "is-happy");
    void els.flower.offsetWidth;
    els.flower.classList.add(kind === "water" ? "is-watering" : "is-sunny");
    if (state.happiness >= 85) els.flower.classList.add("is-happy");
    window.setTimeout(() => els.flower.classList.remove("is-watering", "is-sunny"), 1500);
    render();
    if (!storageAvailable) els.feedback.textContent = `${lastVisibleMessage} (Not saved.)`;
  }

  let waterDrag = null;
  let suppressWaterClick = false;
  let rainTimeout;

  function waterDropTargetAt(x, y) {
    const garden = els.garden.getBoundingClientRect();
    return x >= garden.left && x <= garden.right && y >= garden.top && y <= garden.bottom;
  }

  function makeItRain() {
    els.garden.classList.remove("is-raining");
    void els.rain.offsetWidth;
    els.garden.classList.add("is-raining");
    window.clearTimeout(rainTimeout);
    rainTimeout = window.setTimeout(() => els.garden.classList.remove("is-raining"), 1100);
  }

  function finishWaterDrag() {
    if (!waterDrag) return;
    waterDrag.ghost?.remove();
    els.water.classList.remove("is-dragging");
    els.garden.classList.remove("is-water-target");
    waterDrag = null;
  }

  els.water.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    waterDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null
    };
    els.water.setPointerCapture(event.pointerId);
  });
  els.water.addEventListener("pointermove", (event) => {
    if (!waterDrag || waterDrag.pointerId !== event.pointerId) return;
    if (!waterDrag.moved && Math.hypot(event.clientX - waterDrag.startX, event.clientY - waterDrag.startY) < 8) return;
    if (!waterDrag.moved) {
      waterDrag.moved = true;
      waterDrag.ghost = document.createElement("div");
      waterDrag.ghost.className = "water-drag-ghost";
      waterDrag.ghost.setAttribute("aria-hidden", "true");
      waterDrag.ghost.innerHTML = els.water.innerHTML;
      document.body.append(waterDrag.ghost);
      els.water.classList.add("is-dragging");
    }
    waterDrag.ghost.style.left = `${event.clientX}px`;
    waterDrag.ghost.style.top = `${event.clientY}px`;
    els.garden.classList.toggle("is-water-target", waterDropTargetAt(event.clientX, event.clientY));
  });
  els.water.addEventListener("pointerup", (event) => {
    if (!waterDrag || waterDrag.pointerId !== event.pointerId) return;
    const droppedOnFlower = waterDrag.moved && waterDropTargetAt(event.clientX, event.clientY);
    const wasDragged = waterDrag.moved;
    finishWaterDrag();
    if (!wasDragged) return;
    event.preventDefault();
    suppressWaterClick = true;
    window.setTimeout(() => { suppressWaterClick = false; }, 0);
    if (droppedOnFlower) {
      care("water");
      makeItRain();
    } else setMessage("Drop the water anywhere in Agi's garden to give her a sip.");
  });
  els.water.addEventListener("pointercancel", finishWaterDrag);
  els.water.addEventListener("lostpointercapture", finishWaterDrag);
  els.water.addEventListener("click", (event) => {
    if (suppressWaterClick) {
      event.preventDefault();
      return;
    }
    care("water");
  });
  document.querySelector("#sun-button").addEventListener("click", () => care("sun"));
  document.querySelector("#reset-button").addEventListener("click", () => els.resetDialog.showModal());
  document.querySelector("#confirm-reset").addEventListener("click", (event) => {
    event.preventDefault();
    state = { ...DEFAULT_STATE, lastTick: Date.now() };
    setMessage("A fresh start for Agi. Thanks for being here!");
    saveState(); render(); els.resetDialog.close();
  });
  document.querySelector("#settings-button").addEventListener("click", () => els.settingsDialog.showModal());
  els.pause.addEventListener("click", () => {
    const now = Date.now();
    if (state.paused) {
      const pausedDuration = Math.max(0, now - (state.pausedAt || now));
      state.lastTick += pausedDuration;
      state.paused = false; state.pausedAt = null;
      setMessage("The garden clock is running again whenever you're ready.");
    } else {
      applyElapsedTime(); state.paused = true; state.pausedAt = now;
      setMessage("The garden clock is taking a little rest.");
    }
    render();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

  loadState();
  if (!storageAvailable) lastVisibleMessage = "Your browser isn't saving this garden, but you can still care for Agi while this page is open.";
  render();
  els.feedback.textContent = lastVisibleMessage;
  window.setInterval(() => {
    const before = state.happiness;
    render();
    if (state.happiness < before) setMessage("A little time passed, and Agi's happiness gently dipped by 5%.");
  }, 30_000);
})();

