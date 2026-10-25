(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  // ---------- Stockage ----------
  const store = {
    get(key, def) {
      try { const v = localStorage.getItem("dt." + key); return v == null ? def : JSON.parse(v); } catch { return def; }
    },
    set(key, v) {
      try { localStorage.setItem("dt." + key, JSON.stringify(v)); } catch {}
    }
  };

  const settings = Object.assign({
    cats: ["celebrites", "personnages", "animaux", "films"],
    duration: 60,
    control: "tilt",
    players: [],
    support: "paper"
  }, store.get("settings", {}));
  const saveSettings = () => store.set("settings", settings);

  let customWords = store.get("custom", []);
  const recentlyUsed = new Set(store.get("recent", []));

  // ---------- Utilitaires ----------
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function allCategories() {
    const cats = [...window.CATEGORIES];
    if (customWords.length) cats.push({ id: "custom", name: "Mes mots", emoji: "✏️", words: customWords });
    return cats;
  }

  // Paquet de mots mélangé, en évitant les mots joués récemment
  function buildDeck() {
    const words = new Set();
    for (const c of allCategories()) if (settings.cats.includes(c.id)) c.words.forEach((w) => words.add(w));
    const all = [...words];
    const fresh = all.filter((w) => !recentlyUsed.has(w));
    if (fresh.length < Math.min(30, all.length)) {
      all.forEach((w) => recentlyUsed.delete(w));
      return shuffle(all);
    }
    return shuffle(fresh);
  }

  function markUsed(w) {
    recentlyUsed.add(w);
    const arr = [...recentlyUsed].slice(-400);
    store.set("recent", arr);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- Navigation ----------
  let onLeave = null;
  function show(id) {
    if (onLeave) { const f = onLeave; onLeave = null; f(); }
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  }

  // ---------- Son ----------
  let audio;
  function unlockAudio() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch {}
  }
  function beep(freq, dur = 0.12, type = "sine", vol = 0.25, delay = 0) {
    if (!audio) return;
    const t = audio.currentTime + delay;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  const sfx = {
    ok() { beep(660, 0.1, "triangle"); beep(990, 0.18, "triangle", 0.25, 0.09); },
    pass() { beep(300, 0.2, "sawtooth", 0.12); },
    tick() { beep(880, 0.06, "square", 0.08); },
    go() { beep(1320, 0.3, "triangle"); },
    end() { beep(520, 0.2, "square", 0.15); beep(390, 0.2, "square", 0.15, 0.2); beep(260, 0.5, "square", 0.15, 0.4); }
  };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  // ---------- Écran toujours allumé ----------
  let wakeLock = null;
  let wantWake = false;
  async function keepAwake(on) {
    wantWake = on;
    try {
      if (on && "wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch {}
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wantWake) keepAwake(true);
  });

  // ---------- Capteur d'inclinaison ----------
  // up = composante verticale de la normale à l'écran :
  //  +1 écran vers le plafond, 0 écran face aux autres (sur le front), -1 écran vers le sol.
  const Tilt = {
    handler: null,
    requestPermission() {
      const DOE = window.DeviceOrientationEvent;
      if (!DOE) return Promise.resolve(false);
      if (typeof DOE.requestPermission === "function") {
        // iOS 13+ : doit être appelé directement dans un geste utilisateur
        return DOE.requestPermission().then((r) => r === "granted").catch(() => false);
      }
      return Promise.resolve(true);
    },
    start(cb) {
      this.stop();
      this.handler = (e) => {
        if (e.beta == null || e.gamma == null) return;
        const r = Math.PI / 180;
        cb(Math.cos(e.beta * r) * Math.cos(e.gamma * r));
      };
      window.addEventListener("deviceorientation", this.handler);
    },
    stop() {
      if (this.handler) window.removeEventListener("deviceorientation", this.handler);
      this.handler = null;
    }
  };

  // ---------- Accueil ----------
  let mode = "front";
  $$(".mode-card").forEach((b) => b.addEventListener("click", () => {
    unlockAudio();
    mode = b.dataset.mode;
    openSetup();
  }));
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));

  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (standalone || !isIOS) $("#install-hint").hidden = true;

  // ---------- Mots perso ----------
  $("#btn-custom").addEventListener("click", () => {
    $("#custom-words").value = customWords.join("\n");
    show("custom");
  });
  $("#btn-save-custom").addEventListener("click", () => {
    customWords = [...new Set($("#custom-words").value.split("\n").map((s) => s.trim()).filter(Boolean))];
    store.set("custom", customWords);
    if (customWords.length && !settings.cats.includes("custom")) settings.cats.push("custom");
    if (!customWords.length) settings.cats = settings.cats.filter((c) => c !== "custom");
    saveSettings();
    toast(customWords.length ? `${customWords.length} mot(s) enregistré(s)` : "Liste vidée");
    show("home");
  });

  // ---------- Réglages ----------
  function openSetup() {
    $("#setup-title").textContent = mode === "front" ? "📱 Sur le front" : "🟨 Post-it";
    $("#opts-front").hidden = mode !== "front";
    $("#opts-postit").hidden = mode !== "postit";
    renderCats();
    renderSeg("#seg-duration", String(settings.duration));
    renderSeg("#seg-control", settings.control);
    renderSeg("#seg-support", settings.support);
    renderPlayers();
    updateHints();
    show("setup");
    $("#setup .scroll").scrollTop = 0;
  }

  function renderCats() {
    const box = $("#cats");
    box.innerHTML = "";
    for (const c of allCategories()) {
      const b = document.createElement("button");
      b.className = "cat" + (settings.cats.includes(c.id) ? " on" : "");
      b.innerHTML = `<span class="e">${c.emoji}</span><span>${esc(c.name)}<small>${c.words.length} mots</small></span>`;
      b.addEventListener("click", () => {
        settings.cats = settings.cats.includes(c.id) ? settings.cats.filter((x) => x !== c.id) : [...settings.cats, c.id];
        saveSettings();
        b.classList.toggle("on");
      });
      box.appendChild(b);
    }
  }

  function renderSeg(sel, val) {
    $$(sel + " button").forEach((b) => b.classList.toggle("on", b.dataset.v === val));
  }
  function bindSeg(sel, key, numeric) {
    $$(sel + " button").forEach((b) => b.addEventListener("click", () => {
      settings[key] = numeric ? Number(b.dataset.v) : b.dataset.v;
      saveSettings();
      renderSeg(sel, b.dataset.v);
      updateHints();
    }));
  }
  bindSeg("#seg-duration", "duration", true);
  bindSeg("#seg-control", "control");
  bindSeg("#seg-support", "support");

  function updateHints() {
    $("#control-hint").textContent = settings.control === "tilt"
      ? "Téléphone à l'horizontale sur le front, écran vers les autres. Penche la tête en avant = trouvé, en arrière = passer."
      : "Des boutons « Passer » et « Trouvé » s'affichent à l'écran (pratique si un ami tient le téléphone).";
    $("#support-hint").textContent = settings.support === "paper"
      ? "L'appli donne les mots un par un : quelqu'un les écrit sur les post-it sans que le joueur concerné ne voie."
      : "Pas de papier : à ton tour, tu poses le téléphone sur ton front et il affiche ton post-it aux autres.";
  }

  function renderPlayers() {
    const box = $("#players");
    box.innerHTML = "";
    settings.players.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "player";
      row.innerHTML = `<span>${esc(p)}</span><button aria-label="Retirer">✕</button>`;
      row.querySelector("button").addEventListener("click", () => {
        settings.players.splice(i, 1);
        saveSettings();
        renderPlayers();
      });
      box.appendChild(row);
    });
  }
  $("#add-player").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#player-name");
    const name = input.value.trim();
    if (!name) return;
    if (settings.players.some((p) => p.toLowerCase() === name.toLowerCase())) return toast("Ce prénom est déjà pris");
    if (settings.players.length >= 16) return toast("16 joueurs maximum");
    settings.players.push(name);
    saveSettings();
    input.value = "";
    renderPlayers();
  });

  $("#btn-start").addEventListener("click", () => {
    unlockAudio();
    if (!settings.cats.length) return toast("Choisis au moins une catégorie");
    if (mode === "front") startFront();
    else startPostit();
  });

  // Quitter une partie en cours
  $$("[data-quit]").forEach((b) => b.addEventListener("click", () => {
    if (confirm("Quitter la partie ?")) {
      endFrontRuntime();
      show("home");
    }
  }));

  // =====================================================
  //                 MODE TÉLÉPHONE SUR LE FRONT
  // =====================================================
  const fh = {
    deck: [], idx: 0, results: [], word: null,
    useTilt: false, phase: "idle",   // idle | ready | count | play | feedback | over
    timerId: null, endAt: 0, stableSince: 0, gotSensor: false,
    sensorCheck: null, countTimer: null, feedbackUntil: 0
  };

  function startFront() {
    fh.deck = buildDeck();
    if (!fh.deck.length) return toast("Aucun mot dans ces catégories");
    fh.idx = 0;
    fh.results = [];
    fh.useTilt = settings.control === "tilt";

    if (fh.useTilt) {
      // Appel direct dans le geste utilisateur (exigence iOS)
      Tilt.requestPermission().then((ok) => {
        if (!ok) {
          toast("Capteurs refusés : passage en mode boutons");
          fh.useTilt = false;
        }
        enterReady();
      });
    } else {
      enterReady();
    }
  }

  function enterReady() {
    fh.phase = "ready";
    fh.gotSensor = false;
    fh.stableSince = 0;
    $("#ready-count").textContent = "";
    $("#ready-msg").textContent = fh.useTilt ? "Place le téléphone sur ton front" : "Prêt ?";
    $("#btn-ready").hidden = fh.useTilt;
    show("fh-ready");
    keepAwake(true);
    onLeave = null;

    if (fh.useTilt) {
      Tilt.start(onTilt);
      clearTimeout(fh.sensorCheck);
      fh.sensorCheck = setTimeout(() => {
        if (!fh.gotSensor && fh.phase === "ready") {
          // Pas de capteur (ordinateur, http non sécurisé…)
          Tilt.stop();
          fh.useTilt = false;
          toast("Capteur d'inclinaison indisponible : mode boutons");
          $("#ready-msg").textContent = "Prêt ?";
          $("#btn-ready").hidden = false;
        }
      }, 1500);
    }
  }

  $("#btn-ready").addEventListener("click", () => { unlockAudio(); startCountdown(); });

  function startCountdown() {
    if (fh.phase !== "ready") return;
    fh.phase = "count";
    $("#btn-ready").hidden = true;
    $("#ready-msg").textContent = "Attention…";
    let n = 3;
    const step = () => {
      if (fh.phase !== "count") return;
      if (n === 0) return beginPlay();
      $("#ready-count").textContent = n;
      sfx.tick();
      n--;
      fh.countTimer = setTimeout(step, 1000);
    };
    step();
  }

  function onTilt(up) {
    fh.gotSensor = true;
    const now = performance.now();
    if (fh.phase === "ready") {
      // On attend que le téléphone soit vertical et stable sur le front
      if (Math.abs(up) < 0.35) {
        if (!fh.stableSince) fh.stableSince = now;
        else if (now - fh.stableSince > 700) startCountdown();
      } else fh.stableSince = 0;
    } else if (fh.phase === "play") {
      if (up < -0.6) answer(true);
      else if (up > 0.6) answer(false);
    } else if (fh.phase === "feedback") {
      if (now >= fh.feedbackUntil && Math.abs(up) < 0.4) nextWord();
    }
  }

  function beginPlay() {
    $("#tap-zones").classList.toggle("show", !fh.useTilt);
    $("#fh-score").textContent = "0";
    fh.endAt = performance.now() + settings.duration * 1000;
    show("fh-play");
    sfx.go();
    nextWord();
    let lastSec = null;
    clearInterval(fh.timerId);
    fh.timerId = setInterval(() => {
      const left = Math.max(0, Math.ceil((fh.endAt - performance.now()) / 1000));
      if (left !== lastSec) {
        lastSec = left;
        const el = $("#fh-timer");
        el.textContent = left;
        el.classList.toggle("low", left <= 10);
        if (left <= 5 && left > 0) sfx.tick();
      }
      if (left <= 0) timeUp();
    }, 100);
  }

  function nextWord() {
    if (fh.idx >= fh.deck.length) {
      fh.deck = shuffle(fh.deck.slice());
      fh.idx = 0;
    }
    fh.word = fh.deck[fh.idx++];
    markUsed(fh.word);
    $("#fh-word").textContent = fh.word;
    $("#fh-flash").className = "flash";
    fh.phase = "play";
  }

  function answer(ok) {
    if (fh.phase !== "play") return;
    fh.results.push({ word: fh.word, ok });
    $("#fh-score").textContent = fh.results.filter((r) => r.ok).length;
    const flash = $("#fh-flash");
    flash.textContent = ok ? "Trouvé !" : "Passe";
    flash.className = "flash " + (ok ? "ok" : "pass");
    ok ? sfx.ok() : sfx.pass();
    buzz(ok ? 60 : [30, 40, 30]);
    fh.phase = "feedback";
    fh.feedbackUntil = performance.now() + 700;
    if (!fh.useTilt) setTimeout(() => { if (fh.phase === "feedback") nextWord(); }, 650);
  }

  $$("#tap-zones button").forEach((b) => b.addEventListener("click", () => answer(b.dataset.act === "ok")));

  document.addEventListener("keydown", (e) => {
    if (fh.phase === "play") {
      if (e.key === "ArrowDown") answer(true);
      if (e.key === "ArrowUp") answer(false);
    }
  });

  function timeUp() {
    if (fh.phase === "over") return;
    if (fh.phase === "play" && fh.word) fh.results.push({ word: fh.word, ok: false });
    fh.phase = "over";
    clearInterval(fh.timerId);
    Tilt.stop();
    sfx.end();
    buzz([100, 60, 100]);
    const flash = $("#fh-flash");
    flash.textContent = "Temps écoulé !";
    flash.className = "flash end";
    setTimeout(showFrontResults, 1500);
  }

  function showFrontResults() {
    keepAwake(false);
    const score = fh.results.filter((r) => r.ok).length;
    $("#fh-final").textContent = score;
    $("#fh-final-label").textContent = score > 1 ? "mots trouvés" : "mot trouvé";
    $("#fh-recap").innerHTML = fh.results
      .map((r) => `<li class="${r.ok ? "ok" : "pass"}"><span>${esc(r.word)}</span><span>${r.ok ? "✓" : "✗"}</span></li>`)
      .join("") || `<li class="pass"><span>Aucun mot joué</span></li>`;
    show("fh-end");
  }

  function endFrontRuntime() {
    fh.phase = "idle";
    clearInterval(fh.timerId);
    clearTimeout(fh.countTimer);
    clearTimeout(fh.sensorCheck);
    Tilt.stop();
    keepAwake(false);
  }

  $("#btn-replay").addEventListener("click", () => { unlockAudio(); startFront(); });

  // =====================================================
  //                       MODE POST-IT
  // =====================================================
  const pi = { players: [], deck: [], cur: 0, dealIdx: 0 };

  function drawWord() {
    if (!pi.deck.length) pi.deck = buildDeck();
    const taken = new Set(pi.players.map((p) => p.word));
    let i = pi.deck.findIndex((w) => !taken.has(w));
    if (i < 0) i = 0;
    const w = pi.deck.splice(i, 1)[0];
    markUsed(w);
    return w;
  }

  function startPostit() {
    if (settings.players.length < 2) return toast("Ajoute au moins 2 joueurs");
    pi.deck = buildDeck();
    if (!pi.deck.length) return toast("Aucun mot dans ces catégories");
    pi.players = settings.players.map((name) => ({ name, word: null, found: false, gaveUp: false, turns: 0 }));
    pi.players.forEach((p) => { p.word = drawWord(); });
    pi.cur = Math.floor(Math.random() * pi.players.length);
    if (settings.support === "paper") {
      pi.dealIdx = 0;
      renderDeal(false);
      show("pi-deal");
    } else {
      showTurn();
    }
  }

  // Distribution des mots à écrire sur les post-it
  function renderDeal(revealed) {
    const body = $("#pi-deal-body");
    if (pi.dealIdx >= pi.players.length) {
      body.innerHTML = `
        <div class="logo">🟨</div>
        <h2>Tous les post-it sont prêts ?</h2>
        <p class="hint">Collez-les sur vos fronts sans les regarder !</p>
        <div class="stack"><button class="primary" id="deal-go">Commencer la partie</button></div>`;
      $("#deal-go").onclick = showTurn;
      return;
    }
    const p = pi.players[pi.dealIdx];
    const count = `<div class="sub">${pi.dealIdx + 1} / ${pi.players.length}</div>`;
    if (!revealed) {
      body.innerHTML = `
        ${count}
        <div class="sub">Post-it de</div>
        <div class="deal-name">${esc(p.name)}</div>
        <p class="hint">${esc(p.name)}, ne regarde pas ! 🙈<br>Donne le téléphone à quelqu'un d'autre, qui écrira le mot.</p>
        <div class="stack"><button class="primary" id="deal-show">Afficher le mot</button></div>`;
      $("#deal-show").onclick = () => renderDeal(true);
    } else {
      body.innerHTML = `
        ${count}
        <div class="sub">À écrire pour <b>${esc(p.name)}</b> :</div>
        <div class="postit-paper small"><div class="postit-word">${esc(p.word)}</div></div>
        <div class="stack">
          <button class="primary" id="deal-next">C'est écrit, suivant</button>
          <button class="secondary" id="deal-reroll">🎲 Un autre mot</button>
        </div>`;
      $("#deal-next").onclick = () => { pi.dealIdx++; renderDeal(false); };
      $("#deal-reroll").onclick = () => { p.word = null; p.word = drawWord(); renderDeal(true); };
    }
  }

  const active = () => pi.players.filter((p) => !p.found && !p.gaveUp);

  function showTurn() {
    const p = pi.players[pi.cur];
    $("#pi-round").textContent = `Tour ${Math.min(...active().map((q) => q.turns)) + 1}`;
    $("#pi-turn-name").textContent = p.name;
    const screenMode = settings.support === "screen";
    $("#pi-turn-hint").textContent = screenMode
      ? "Prends le téléphone, affiche ton post-it et pose-le sur ton front, écran vers les autres. Pose une question oui / non !"
      : "Pose une question oui / non aux autres. Si c'est « oui », tu peux en poser une autre !";
    $("#pi-board").innerHTML = pi.players.map((q, i) => {
      const known = q.found || q.gaveUp;
      return `<li class="${i === pi.cur ? "current" : ""} ${q.found ? "found" : ""}">
        <span class="n">${esc(q.name)}</span>
        <span class="w ${known ? "" : "hidden"}">${known ? esc(q.word) : q.turns + " tour" + (q.turns > 1 ? "s" : "")}</span>
      </li>`;
    }).join("");
    const actions = $("#pi-turn-actions");
    actions.innerHTML = screenMode
      ? `<button class="primary" id="pi-act">Afficher mon post-it</button>`
      : `<button class="primary" id="pi-act">Fin du tour de ${esc(p.name)}</button>`;
    actions.innerHTML += `<button class="link-btn" id="pi-stop">Terminer la partie</button>`;
    $("#pi-act").onclick = screenMode ? showPostit : askResult;
    $("#pi-stop").onclick = () => { if (confirm("Terminer la partie et voir le classement ?")) endPostit(); };
    show("pi-turn");
  }

  function showPostit() {
    const p = pi.players[pi.cur];
    $("#pi-word").textContent = p.word;
    show("pi-show");
    keepAwake(true);
    onLeave = () => keepAwake(false);
    // Petit délai pour éviter de valider par erreur en le posant sur le front
    const scr = $("#pi-show");
    scr.onclick = null;
    setTimeout(() => { scr.onclick = askResult; }, 1200);
  }

  function askResult() {
    $("#pi-result-name").textContent = pi.players[pi.cur].name;
    show("pi-result");
  }

  $("#btn-found").addEventListener("click", () => {
    const p = pi.players[pi.cur];
    p.turns++;
    p.found = true;
    sfx.ok();
    buzz(80);
    reveal(`Bravo ${p.name} ! 🎉 C'était bien :`, p.word);
  });
  $("#btn-notfound").addEventListener("click", () => {
    pi.players[pi.cur].turns++;
    advance();
  });
  $("#btn-giveup").addEventListener("click", () => {
    const p = pi.players[pi.cur];
    if (!confirm(`${p.name} abandonne ?`)) return;
    p.turns++;
    p.gaveUp = true;
    sfx.pass();
    reveal(`Dommage ${p.name}… C'était :`, p.word);
  });

  function reveal(label, word) {
    $("#pi-reveal-label").textContent = label;
    $("#pi-reveal-word").textContent = word;
    show("pi-reveal");
  }
  $("#btn-reveal-next").addEventListener("click", advance);

  function advance() {
    if (!active().length) return endPostit();
    const n = pi.players.length;
    let i = pi.cur;
    do i = (i + 1) % n;
    while (pi.players[i].found || pi.players[i].gaveUp);
    pi.cur = i;
    showTurn();
  }

  function endPostit() {
    const ranked = [...pi.players].sort((a, b) => {
      if (a.found !== b.found) return a.found ? -1 : 1;
      return a.turns - b.turns;
    });
    $("#pi-ranking").innerHTML = ranked.map((p) => `
      <li class="${p.found ? "" : "lost"}">
        <span><span class="n">${esc(p.name)}</span><span class="w">${esc(p.word)}</span></span>
        <span class="s">${p.found ? p.turns + " tour" + (p.turns > 1 ? "s" : "") : p.gaveUp ? "abandon" : "pas trouvé"}</span>
      </li>`).join("");
    sfx.end();
    show("pi-end");
  }

  $("#btn-pi-replay").addEventListener("click", startPostit);

  // ---------- Hors-ligne ----------
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
