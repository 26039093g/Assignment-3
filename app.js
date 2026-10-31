(() => {
  "use strict";
  const STORAGE_KEY = "mallow-garden-v1";
  const DECAY_INTERVAL = 2 * 60 * 1000;
  const CARE_WINDOW_MS = 30 * 1000;
  const CARE_LIMIT_PER_WINDOW = 2;
  const PASSIVE_GAIN_INTERVAL = 10 * 1000;
  const DEFAULT_STATE = {
    happiness: 0,
    growthStage: 0,
    lastTick: Date.now(),
    paused: false,
    pausedAt: null,
    decayInterval: DECAY_INTERVAL,
    careHistory: { water: [], sun: [] },
    passiveCareAt: Date.now()
  };
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
      if (!saved || typeof saved !== "object" || !Number.isFinite(saved.lastTick)) throw new Error("Invalid saved garden");
      const hasGrowthStage = Object.prototype.hasOwnProperty.call(saved, "growthStage");
      const savedHappiness = hasGrowthStage && Number.isFinite(saved.happiness) ? saved.happiness : 0;
      const savedStage = hasGrowthStage && Number.isInteger(saved.growthStage) ? saved.growthStage : 0;
      const savedCareHistory = saved && typeof saved.careHistory === "object" ? saved.careHistory : {};
      const now = Date.now();
      const intervalChanged = saved.decayInterval !== DECAY_INTERVAL;
      state = {
        happiness: Math.max(0, Math.min(100, savedHappiness)),
        growthStage: Math.max(0, Math.min(2, savedStage)),
        lastTick: intervalChanged ? now : saved.lastTick,
        paused: saved.paused === true,
        pausedAt: saved.paused === true
          ? intervalChanged ? now : Number.isFinite(saved.pausedAt) ? saved.pausedAt : null
          : null,
        decayInterval: DECAY_INTERVAL,
        careHistory: {
          water: Array.isArray(savedCareHistory.water) ? savedCareHistory.water.filter((timestamp) => Number.isFinite(timestamp)) : [],
          sun: Array.isArray(savedCareHistory.sun) ? savedCareHistory.sun.filter((timestamp) => Number.isFinite(timestamp)) : []
        },
        passiveCareAt: Number.isFinite(saved.passiveCareAt) ? saved.passiveCareAt : now
      };
      pruneCareHistory("water");
      pruneCareHistory("sun");
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
    const lost = Math.floor(elapsed / DECAY_INTERVAL) * 5;
    if (lost > 0) {
      state.happiness = Math.max(0, state.happiness - lost);
      state.lastTick += Math.floor(elapsed / DECAY_INTERVAL) * DECAY_INTERVAL;
    }
  }

  function isPageOpen() {
    return !document.hidden && document.visibilityState === "visible";
  }

  function applyPassiveCare() {
    if (state.paused || !isPageOpen()) return;
    const now = Date.now();
    const elapsed = Math.max(0, now - (state.passiveCareAt || now));
    const gained = Math.floor(elapsed / PASSIVE_GAIN_INTERVAL);
    if (gained > 0) {
      state.happiness = Math.min(100, state.happiness + gained);
      state.passiveCareAt += gained * PASSIVE_GAIN_INTERVAL;
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
    const remaining = DECAY_INTERVAL - (elapsed % DECAY_INTERVAL);
    if (remaining < 60_000) return "Next dip in less than a minute";
    const minutes = Math.ceil(remaining / 60_000);
    return `Next dip in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  function pruneCareHistory(kind) {
    const now = Date.now();
    if (!state.careHistory || !Array.isArray(state.careHistory[kind])) {
      state.careHistory = { ...state.careHistory, [kind]: [] };
      return;
    }
    state.careHistory[kind] = state.careHistory[kind].filter((timestamp) => now - timestamp < CARE_WINDOW_MS);
  }

  function getCareCooldown(kind) {
    pruneCareHistory(kind);
    const history = state.careHistory && Array.isArray(state.careHistory[kind]) ? state.careHistory[kind] : [];
    if (history.length < CARE_LIMIT_PER_WINDOW) return 0;
    const oldest = history[0];
    const remaining = CARE_WINDOW_MS - (Date.now() - oldest);
    return Math.max(0, remaining);
  }

  function canGiveCare(kind) {
    pruneCareHistory(kind);
    return Boolean(state.careHistory && Array.isArray(state.careHistory[kind]) && state.careHistory[kind].length < CARE_LIMIT_PER_WINDOW);
  }

  function recordCare(kind) {
    pruneCareHistory(kind);
    state.careHistory[kind].push(Date.now());
  }

  function bothCareLimitsReached() {
    pruneCareHistory("water");
    pruneCareHistory("sun");
    return state.careHistory.water.length >= CARE_LIMIT_PER_WINDOW && state.careHistory.sun.length >= CARE_LIMIT_PER_WINDOW;
  }

  function getCareLimitMessage(kind) {
    if (bothCareLimitsReached()) {
      return "Agi needs a few seconds to absorb everything. Stick around for 30 seconds.";
    }
    const label = kind === "water" ? "water" : "sunlight";
    return `Agi has already had two ${label} boosts in the last 30 seconds.`;
  }

  function getStageClass() {
    if (state.growthStage === 0) return "stage-bud";
    if (state.growthStage === 1) return "stage-sprout";
    return "stage-flower";
  }

  function advanceGrowthStage() {
    if (state.growthStage >= 2 || state.happiness < 100) return false;
    state.growthStage += 1;
    state.happiness = 0;
    state.lastTick = Date.now();
    return true;
  }

  function render() {
    applyElapsedTime();
    applyPassiveCare();
    if (state.happiness >= 100) advanceGrowthStage();
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
    els.flower.classList.remove("is-happy", "is-sad", "is-parched", "is-low-happiness", "is-medium-happiness", "is-high-happiness", "stage-bud", "stage-sprout", "stage-flower");
    if (mood.cls) els.flower.classList.add(mood.cls);
    els.flower.classList.add(value <= 45 ? "is-low-happiness" : value >= 85 ? "is-high-happiness" : "is-medium-happiness");
    els.flower.classList.add(getStageClass());
    els.pause.textContent = state.paused ? "Resume" : "Pause";
    els.pause.setAttribute("aria-pressed", String(state.paused));
    els.pauseDescription.textContent = state.paused ? "Time is paused; Agi's mood is resting." : "Time is passing gently.";
    saveState();
  }

  function animateCare(kind) {
    els.flower.classList.remove("is-watering", "is-sunny", "is-happy");
    void els.flower.offsetWidth;
    els.flower.classList.add(kind === "water" ? "is-watering" : "is-sunny");
    if (state.happiness >= 85) els.flower.classList.add("is-happy");
    window.setTimeout(() => els.flower.classList.remove("is-watering", "is-sunny"), 1500);
    if (kind === "water") makeItRain();
    else makeSunshine();
  }

  function care(kind) {
    render();
    if (!canGiveCare(kind)) {
      setMessage(getCareLimitMessage(kind));
      animateCare(kind);
      render();
      return;
    }
    const before = state.happiness;
    const amount = kind === "water" ? 18 : 13;
    if (before >= 100) {
      setMessage(`Agi is already full of ${kind === "water" ? "freshness" : "sunshine"}. A quiet hello is enough for now.`);
      animateCare(kind);
      render(); return;
    }
    recordCare(kind);
    state.happiness = Math.min(100, before + amount);
    const gained = Math.round(state.happiness - before);
    if (!state.paused && before < 100) state.lastTick = Date.now();
    if (state.happiness >= 100 && state.growthStage < 2) {
      state.growthStage += 1;
      state.happiness = 0;
      state.lastTick = Date.now();
      setMessage(state.growthStage === 1
        ? "Agi's bud has opened into a tiny magnolia sprout."
        : "A tiny sprout has grown into the full magnolia bloom.");
    } else {
      setMessage(kind === "water"
        ? `A refreshing sip! Agi's happiness rose by ${gained}%.`
        : `A warm sunbeam! Agi's happiness rose by ${gained}%.`);
    }
    animateCare(kind);
    render();
    if (!storageAvailable) els.feedback.textContent = `${lastVisibleMessage} (Not saved.)`;
  }

  let waterDrag = null;
  let suppressWaterClick = false;
  let rainTimeout;
  let sunshineTimeout;

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

  function makeSunshine() {
    els.garden.classList.remove("is-sunny");
    void els.garden.offsetWidth;
    els.garden.classList.add("is-sunny");
    window.clearTimeout(sunshineTimeout);
    sunshineTimeout = window.setTimeout(() => els.garden.classList.remove("is-sunny"), 1500);
  }

  function attachCareDrag(button, kind) {
    let drag = null;
    let suppressClick = false;
    const targetClass = `is-${kind}-target`;

    function finishDrag() {
      if (!drag) return;
      drag.ghost?.remove();
      button.classList.remove("is-dragging");
      els.garden.classList.remove(targetClass);
      drag = null;
    }

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        ghost: null
      };
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.ghost = document.createElement("div");
        drag.ghost.className = kind === "water" ? "water-drag-ghost" : "sun-drag-ghost";
        drag.ghost.setAttribute("aria-hidden", "true");
        drag.ghost.innerHTML = button.innerHTML;
        document.body.append(drag.ghost);
        button.classList.add("is-dragging");
      }
      drag.ghost.style.left = `${event.clientX}px`;
      drag.ghost.style.top = `${event.clientY}px`;
      els.garden.classList.toggle(targetClass, waterDropTargetAt(event.clientX, event.clientY));
    });
    button.addEventListener("pointerup", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const droppedInGarden = drag.moved && waterDropTargetAt(event.clientX, event.clientY);
      const wasDragged = drag.moved;
      finishDrag();
      if (!wasDragged) return;
      event.preventDefault();
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 0);
      if (droppedInGarden) {
        care(kind);
      } else setMessage(`Drop the ${kind === "water" ? "water" : "sunlight"} anywhere in Agi's garden.`);
    });
    button.addEventListener("pointercancel", finishDrag);
    button.addEventListener("lostpointercapture", finishDrag);
    button.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        return;
      }
      care(kind);
    });
  }

  attachCareDrag(els.water, "water");
  attachCareDrag(els.sun, "sun");
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
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      state.passiveCareAt = Date.now();
      render();
    }
  });

  loadState();
  if (!storageAvailable) lastVisibleMessage = "Your browser isn't saving this garden, but you can still care for Agi while this page is open.";
  render();
  els.feedback.textContent = lastVisibleMessage;
  window.setInterval(() => {
    const before = state.happiness;
    render();
    if (state.happiness < before) setMessage("A little time passed, and Agi's happiness gently dipped by 5%.");
  }, 1_000);
})();
