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
    support: "paper",
    turnTime: 45,
    rules: "team",
    target: 3,
    pairWords: 2
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
    $("#setup-title").textContent = mode === "front" ? "📱 Sur le front" : "🟨 Post-it en binômes";
    renderCats();
    renderSeg("#seg-rules", settings.rules);
    renderSeg("#seg-target", String(settings.target));
    renderSeg("#seg-pairwords", String(settings.pairWords));
    renderSeg("#seg-duration", String(settings.duration));
    renderSeg("#seg-control", settings.control);
    renderSeg("#seg-support", settings.support);
    renderSeg("#seg-turn", String(settings.turnTime));
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
  bindSeg("#seg-turn", "turnTime", true);
  bindSeg("#seg-rules", "rules");
  bindSeg("#seg-target", "target", true);
  bindSeg("#seg-pairwords", "pairWords", true);

  // Affiche les options utiles selon le mode et les règles
  function updateOptions() {
    const front = mode === "front";
    const teams = !front || settings.rules === "team";
    $("#opts-rules").hidden = !front;
    $("#opts-players").hidden = !teams;
    $("#opts-target").hidden = !(front && teams);
    $("#opts-duration").hidden = !(front && !teams);
    $("#opts-control").hidden = !front;
    $("#opts-postit").hidden = front;
  }

  function updateHints() {
    updateOptions();
    $("#rules-hint").textContent = settings.rules === "team"
      ? "L'appli forme les binômes. Chacun son tour, le binôme qui trouve ses mots le plus vite gagne. Les rôles s'inversent à chaque tour."
      : "Une manche chronométrée : un maximum de mots en un temps donné.";
    $("#pairwords-hint").textContent = settings.pairWords === 2
      ? "Quand le binôme trouve, les rôles s'inversent et il reçoit un nouveau mot. Il a fini quand chacun a trouvé le sien."
      : "Un seul mot par binôme, toujours le même joueur qui devine.";
    $("#control-hint").textContent = settings.control === "tilt"
      ? "Téléphone à l'horizontale sur le front, écran vers les autres. Penche la tête en avant = trouvé, en arrière = passer."
      : "Des boutons « Passer » et « Trouvé » s'affichent à l'écran (pratique si un ami tient le téléphone).";
    $("#support-hint").textContent = settings.support === "paper"
      ? "L'appli montre le mot de chaque binôme : le coéquipier l'écrit sur le post-it sans que celui qui devine ne le voie."
      : "Pas de papier : celui qui devine pose le téléphone sur son front, le mot et le chrono s'affichent pour son coéquipier.";
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
    if (mode === "front" && settings.rules === "classic") startFront();
    else startTeams(mode);
  });

  // Quitter une partie en cours
  $$("[data-quit]").forEach((b) => b.addEventListener("click", () => {
    if (fh.team && fh.phase !== "idle") {
      // En binômes, on annule seulement le tour en cours (non compté)
      if (confirm("Annuler ce tour ? Il ne sera pas compté.")) {
        endFrontRuntime();
        showTurn();
      }
      return;
    }
    if (confirm("Quitter la partie ?")) {
      endFrontRuntime();
      stopClock();
      show("home");
    }
  }));

  // =====================================================
  //                 MODE TÉLÉPHONE SUR LE FRONT
  // =====================================================
  const fh = {
    deck: [], idx: 0, results: [], word: null,
    useTilt: false, phase: "idle",   // idle | ready | count | play | feedback | over
    team: null, playStart: 0, doneAt: 0,
    timerId: null, endAt: 0, stableSince: 0, gotSensor: false,
    sensorCheck: null, countTimer: null, feedbackUntil: 0
  };

  function startFront() {
    fh.deck = buildDeck();
    if (!fh.deck.length) return toast("Aucun mot dans ces catégories");
    fh.idx = 0;
    launchFront(null);
  }

  // team = null en mode classique, sinon l'équipe dont c'est le tour
  function launchFront(team) {
    fh.team = team;
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
    $("#ready-msg").textContent = fh.team
      ? (fh.useTilt ? `${guesserOf(fh.team)}, place le téléphone sur ton front` : `${guesserOf(fh.team)}, prêt ?`)
      : (fh.useTilt ? "Place le téléphone sur ton front" : "Prêt ?");
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
    $("#fh-score").textContent = fh.team ? `${fh.team.score}/${pi.target}` : "0";
    fh.playStart = performance.now();
    fh.endAt = fh.playStart + (fh.team ? settings.turnTime : settings.duration) * 1000;
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
    const t = fh.team;
    if (t && ok) t.score++;
    $("#fh-score").textContent = t ? `${t.score}/${pi.target}` : fh.results.filter((r) => r.ok).length;
    const flash = $("#fh-flash");
    flash.textContent = ok ? "Trouvé !" : "Passe";
    flash.className = "flash " + (ok ? "ok" : "pass");
    ok ? sfx.ok() : sfx.pass();
    buzz(ok ? 60 : [30, 40, 30]);
    if (t && t.score >= pi.target) {
      // Tous les mots trouvés : le chrono du binôme s'arrête ici
      fh.doneAt = performance.now();
      fh.phase = "over";
      clearInterval(fh.timerId);
      Tilt.stop();
      setTimeout(() => finishFrontTurn(true), 900);
      return;
    }
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
    setTimeout(fh.team ? () => finishFrontTurn(false) : showFrontResults, 1500);
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
    fh.team = null;
    clearInterval(fh.timerId);
    clearTimeout(fh.countTimer);
    clearTimeout(fh.sensorCheck);
    Tilt.stop();
    keepAwake(false);
  }

  $("#btn-replay").addEventListener("click", () => { unlockAudio(); startFront(); });

  // Fin du tour d'un binôme en mode front
  function finishFrontTurn(done) {
    const t = fh.team;
    const turnMs = settings.turnTime * 1000;
    t.time += done ? Math.min(fh.doneAt - fh.playStart, turnMs) : turnMs;
    t.turns++;
    const results = fh.results;
    endFrontRuntime();
    $("#pi-timeup-logo").textContent = done ? "🎉" : "⏰";
    $("#pi-timeup-title").textContent = done ? "Tous les mots trouvés !" : "Temps écoulé !";
    const found = results.filter((r) => r.ok).length;
    $("#pi-timeup-msg").textContent = done
      ? `${teamName(t)} termine en ${fmt(t.time, true)} (${t.turns} tour${t.turns > 1 ? "s" : ""}).`
      : `${teamName(t)} : ${found} mot${found > 1 ? "s" : ""} ce tour, ${t.score}/${pi.target} au total, ${fmt(t.time)} au compteur.`;
    $("#pi-timeup-recap").innerHTML = results
      .map((r) => `<li class="${r.ok ? "ok" : "pass"}"><span>${esc(r.word)}</span><span>${r.ok ? "✓" : "✗"}</span></li>`).join("");
    $("#btn-timeup-next").textContent = "Binôme suivant";
    show("pi-timeup");
  }

  // =====================================================
  //            PARTIE EN BINÔMES (post-it et front)
  // =====================================================
  // Un joueur devine en posant des questions, son coéquipier répond (oui / non / peut-être / je ne sais pas).
  // Les binômes jouent à tour de rôle pendant settings.turnTime secondes ; le temps s'additionne
  // jusqu'à ce que le binôme ait trouvé pi.target mots. Le plus petit temps cumulé gagne.
  //  - post-it : un mot à la fois ; une fois trouvé, les rôles s'inversent avec un nouveau mot.
  //  - front   : le téléphone fait défiler les mots (on peut passer) ; les rôles s'inversent à chaque tour.
  // Nombre impair : le dernier groupe est un trio, toujours avec un seul joueur qui devine et un seul
  // qui répond par tour, pour garder les mêmes conditions qu'un binôme.
  const pi = {
    kind: "postit", target: 1, teams: [], deck: [], cur: 0, round: 1, winnerShown: false,
    dealQueue: [], dealInitial: false, afterReveal: null,
    timerId: null, startedAt: 0, banked: 0, running: false
  };

  const teamName = (t) => t.members.join(" & ");
  const isDone = (t) => t.score >= pi.target;
  const isActive = (t) => !isDone(t) && !t.gaveUp;
  const plural = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;

  function guesserOf(t) {
    return pi.kind === "front" ? t.members[t.turns % t.members.length] : t.members[t.score % t.members.length];
  }
  function answererOf(t) {
    if (pi.kind === "front") return t.members[(t.turns + 1) % t.members.length];
    const others = t.members.filter((m) => m !== guesserOf(t));
    return others[t.wordTurns % others.length];
  }

  // 83400 -> "1:23" ou "1:23,4" ; 9000 -> "9 s"
  function fmt(ms, tenths) {
    const d = tenths ? Math.round(ms / 100) : Math.floor(ms / 1000) * 10;
    const m = Math.floor(d / 600);
    const sec = (d % 600) / 10;
    const s = tenths ? sec.toFixed(1).replace(".", ",") : String(sec);
    return m ? `${m}:${sec < 10 ? "0" : ""}${s}` : `${s} s`;
  }

  function drawWord() {
    if (!pi.deck.length) pi.deck = buildDeck();
    const taken = new Set(pi.teams.map((t) => t.word));
    let i = pi.deck.findIndex((w) => !taken.has(w));
    if (i < 0) i = 0;
    const w = pi.deck.splice(i, 1)[0];
    markUsed(w);
    return w;
  }

  function makeTeams() {
    const ps = shuffle(settings.players.slice());
    const groups = [];
    while (ps.length >= 2) groups.push(ps.splice(0, 2));
    if (ps.length) groups[groups.length - 1].push(ps[0]); // trio
    pi.teams = groups.map((members) => ({ members, word: null, time: 0, turns: 0, wordTurns: 0, score: 0, gaveUp: false }));
  }

  function startTeams(kind) {
    if (settings.players.length < 4) return toast("Il faut au moins 4 joueurs (2 binômes)");
    pi.kind = kind;
    pi.target = kind === "front" ? settings.target : settings.pairWords;
    pi.deck = buildDeck();
    if (!pi.deck.length) return toast("Aucun mot dans ces catégories");
    makeTeams();
    renderTeams();
    show("pi-teams");
  }

  function renderTeams() {
    const odd = settings.players.length % 2 === 1;
    const intro = pi.kind === "front"
      ? `Course à ${plural(pi.target, "mot")} par binôme. Les rôles s'inversent à chaque tour.`
      : pi.target > 1 ? "Quand un mot est trouvé, les rôles s'inversent avec un nouveau mot." : "Un mot par binôme.";
    $("#pi-teams-hint").textContent = `${intro} 🤔 devine · 💬 répond par oui, non, peut-être ou je ne sais pas.` +
      (odd ? " Nombre impair : il y a un trio, mais à chaque tour un seul devine et un seul répond, pour que ce soit équitable." : "");
    $("#pi-teams-list").innerHTML = pi.teams.map((t, i) => {
      let lines;
      if (pi.kind === "front") {
        lines = `<span class="role">🔄 Devinent à tour de rôle : <b>${t.members.map(esc).join(", ")}</b></span>
          <span class="role">💬 Le suivant répond</span>`;
      } else {
        const guessers = t.members.slice(0, Math.min(pi.target, t.members.length));
        const others = t.members.filter((m) => m !== t.members[0]);
        lines = `<span class="role">🤔 <b>${guessers.map(esc).join("</b> puis <b>")}</b> ${guessers.length > 1 ? "devinent chacun leur tour" : "devine"}</span>
          <span class="role">💬 ${t.members.length > 2 ? "Les autres répondent à tour de rôle, un par tour" : pi.target > 1 ? "L'autre répond" : esc(others[0]) + " répond"}</span>`;
      }
      return `<li class="team"><span class="team-num">${i + 1}</span><span>${lines}</span></li>`;
    }).join("");
  }

  $("#btn-reshuffle").addEventListener("click", () => { makeTeams(); renderTeams(); });
  $("#btn-teams-ok").addEventListener("click", () => {
    pi.cur = 0;
    pi.round = 1;
    pi.winnerShown = false;
    if (pi.kind === "front") {
      fh.deck = pi.deck;
      fh.idx = 0;
      return showTurn();
    }
    pi.teams.forEach((t) => { t.word = drawWord(); });
    if (settings.support === "paper") startDeal(pi.teams.map((_, i) => i), true);
    else showTurn();
  });

  // ----- Distribution des mots à écrire sur les post-it -----
  function startDeal(queue, initial) {
    pi.dealQueue = queue;
    pi.dealInitial = initial;
    renderDeal(false);
    show("pi-deal");
  }

  function renderDeal(revealed) {
    const body = $("#pi-deal-body");
    if (!pi.dealQueue.length) {
      if (!pi.dealInitial) return advance();
      body.innerHTML = `
        <div class="logo">🟨</div>
        <h2>Tous les post-it sont prêts ?</h2>
        <p class="hint">Ceux qui devinent les collent sur leur front sans les regarder !</p>
        <div class="stack"><button class="primary" id="deal-go">Commencer la partie</button></div>`;
      $("#deal-go").onclick = showTurn;
      return;
    }
    const t = pi.teams[pi.dealQueue[0]];
    const g = guesserOf(t);
    const writers = t.members.filter((m) => m !== g);
    if (!revealed) {
      body.innerHTML = `
        <div class="sub">${pi.dealInitial ? "" : "Nouveau "}Post-it de</div>
        <div class="deal-name">${esc(g)}</div>
        <p class="hint">${esc(g)}, ne regarde pas ! 🙈<br>Donne le téléphone à ${writers.map(esc).join(" ou ")}, qui écrit le mot.</p>
        <div class="stack"><button class="primary" id="deal-show">Afficher le mot</button></div>`;
      $("#deal-show").onclick = () => renderDeal(true);
    } else {
      body.innerHTML = `
        <div class="sub">À écrire pour <b>${esc(g)}</b> :</div>
        <div class="postit-paper small"><div class="postit-word">${esc(t.word)}</div></div>
        <div class="stack">
          <button class="primary" id="deal-next">C'est écrit, suivant</button>
          <button class="secondary" id="deal-reroll">🎲 Un autre mot</button>
        </div>`;
      $("#deal-next").onclick = () => { pi.dealQueue.shift(); renderDeal(false); };
      $("#deal-reroll").onclick = () => { t.word = null; t.word = drawWord(); renderDeal(true); };
    }
  }

  // ----- Avant le tour -----
  function showTurn() {
    const t = pi.teams[pi.cur];
    const g = guesserOf(t), a = answererOf(t);
    $("#pi-round").textContent = `Tour ${pi.round}`;
    $("#pi-turn-name").textContent = teamName(t);
    $("#pi-turn-roles").innerHTML = `🤔 <b>${esc(g)}</b> devine · 💬 <b>${esc(a)}</b> répond`;
    const left = pi.target - t.score;
    $("#pi-turn-hint").textContent =
      pi.kind === "front"
        ? `${g} met le téléphone à l'horizontale sur son front. Encore ${plural(left, "mot")} à trouver. Penche en avant = trouvé, en arrière = passer.`
        : settings.support === "screen"
          ? `${g} pose le téléphone sur son front, écran vers ${a}, qui touche « Trouvé » dès que c'est trouvé.`
          : `${a} lance le chrono et touche « Trouvé » dès que c'est trouvé.`;
    $("#pi-board").innerHTML = pi.teams.map((q, i) => {
      const progress = pi.target > 1 ? `${q.score}/${pi.target} · ` : "";
      const status = isDone(q) ? "✓ " + fmt(q.time, true) : q.gaveUp ? "abandon" : progress + fmt(q.time) + " · " + plural(q.turns, "tour");
      return `<li class="${i === pi.cur ? "current" : ""} ${q.gaveUp ? "out" : ""}">
        <span class="n">${esc(teamName(q))}</span><span class="w">${status}</span></li>`;
    }).join("");
    const actions = $("#pi-turn-actions");
    actions.innerHTML = pi.kind === "front"
      ? `<button class="primary" id="pi-go">📱 C'est parti (${settings.turnTime} s)</button>`
      : `<button class="primary" id="pi-go">▶ Lancer le chrono (${settings.turnTime} s)</button>`;
    if (pi.winnerShown) actions.innerHTML += `<button class="secondary" id="pi-giveup">Ce binôme abandonne</button>`;
    actions.innerHTML += `<button class="link-btn" id="pi-stop">Terminer la partie</button>`;
    $("#pi-go").onclick = () => { unlockAudio(); pi.kind === "front" ? launchFront(t) : startClock(); };
    if (pi.winnerShown) $("#pi-giveup").onclick = () => {
      if (!confirm(`${teamName(t)} abandonne ?`)) return;
      t.gaveUp = true;
      if (pi.kind === "front") return advance();
      pi.afterReveal = null;
      reveal(`${teamName(t)} abandonne. Le mot était :`, t.word, "");
    };
    $("#pi-stop").onclick = () => { if (confirm("Terminer la partie et voir le classement ?")) endPostit(); };
    show("pi-turn");
  }

  // ----- Chrono (post-it) -----
  const turnMs = () => settings.turnTime * 1000;
  const elapsed = () => pi.banked + (pi.running ? performance.now() - pi.startedAt : 0);

  function startClock() {
    const t = pi.teams[pi.cur];
    const screenMode = settings.support === "screen";
    $("#pi-timer-team").textContent = teamName(t);
    $("#pi-timer-word").textContent = t.word;
    $("#pi-timer-postit").hidden = !screenMode;
    $("#pi-timer-roles").innerHTML = screenMode ? "" : `🤔 <b>${esc(guesserOf(t))}</b> pose ses questions<br>💬 <b>${esc(answererOf(t))}</b> répond`;
    $("#pi-total").textContent = t.turns ? `Déjà ${fmt(t.time)} au compteur` : "";
    $("#btn-pause").textContent = "⏸ Pause";
    pi.banked = 0;
    pi.running = true;
    pi.startedAt = performance.now();
    show("pi-timer");
    keepAwake(true);
    sfx.go();
    let lastSec = null;
    clearInterval(pi.timerId);
    pi.timerId = setInterval(() => {
      const left = Math.max(0, Math.ceil((turnMs() - elapsed()) / 1000));
      if (left !== lastSec) {
        lastSec = left;
        const el = $("#pi-clock");
        el.textContent = left;
        el.classList.toggle("low", left <= 10);
        if (left <= 5 && left > 0 && pi.running) sfx.tick();
      }
      if (left <= 0) turnOver();
    }, 100);
  }

  function stopClock() {
    clearInterval(pi.timerId);
    pi.timerId = null;
    pi.running = false;
    keepAwake(false);
  }

  $("#btn-pause").addEventListener("click", () => {
    if (pi.running) {
      pi.banked = elapsed();
      pi.running = false;
      $("#btn-pause").textContent = "▶ Reprendre";
    } else {
      pi.startedAt = performance.now();
      pi.running = true;
      $("#btn-pause").textContent = "⏸ Pause";
    }
  });

  $("#btn-found").addEventListener("click", () => {
    const t = pi.teams[pi.cur];
    const used = Math.min(elapsed(), turnMs());
    const word = t.word;
    stopClock();
    t.time += used;
    t.turns++;
    t.score++;
    t.wordTurns = 0;
    sfx.ok();
    buzz(80);
    if (isDone(t)) {
      pi.afterReveal = null;
      return reveal(`Bravo ${teamName(t)} ! 🎉 C'était :`, word,
        `Binôme terminé en ${fmt(t.time, true)} (${plural(t.turns, "tour")})`);
    }
    // Rôles inversés avec un nouveau mot
    t.word = drawWord();
    const idx = pi.cur;
    pi.afterReveal = settings.support === "paper" ? () => startDeal([idx], false) : null;
    reveal(`Bravo ! 🎉 C'était :`, word,
      `${t.score}/${pi.target} · ${fmt(t.time, true)} au compteur. Rôles inversés : ${guesserOf(t)} devinera un nouveau mot au prochain tour.`);
  });

  function turnOver() {
    const t = pi.teams[pi.cur];
    stopClock();
    t.time += turnMs();
    t.turns++;
    t.wordTurns++;
    sfx.end();
    buzz([100, 60, 100]);
    $("#pi-timeup-logo").textContent = "⏰";
    $("#pi-timeup-title").textContent = "Temps écoulé !";
    $("#pi-timeup-msg").textContent = `${teamName(t)} : ${fmt(t.time)} au compteur. On passe au binôme suivant !`;
    $("#pi-timeup-recap").innerHTML = "";
    show("pi-timeup");
  }
  $("#btn-timeup-next").addEventListener("click", advance);

  function reveal(label, word, extra) {
    $("#pi-reveal-label").textContent = label;
    $("#pi-reveal-word").textContent = word;
    $("#pi-reveal-time").textContent = extra;
    show("pi-reveal");
  }
  $("#btn-reveal-next").addEventListener("click", () => {
    const next = pi.afterReveal;
    pi.afterReveal = null;
    next ? next() : advance();
  });

  // Binôme suivant. Le vainqueur n'est annoncé qu'en fin de tour complet :
  // les binômes qui jouent après dans le même tour ont ainsi eu autant de temps pour faire mieux.
  function advance() {
    for (let i = pi.cur + 1; i < pi.teams.length; i++) {
      if (isActive(pi.teams[i])) { pi.cur = i; return showTurn(); }
    }
    pi.round++;
    if (!pi.teams.some(isActive)) return endPostit();
    if (!pi.winnerShown && pi.teams.some(isDone)) return showWinner();
    nextRound();
  }

  function nextRound() {
    pi.cur = pi.teams.findIndex(isActive);
    showTurn();
  }

  function showWinner() {
    pi.winnerShown = true;
    const best = pi.teams.filter(isDone).sort((a, b) => a.time - b.time)[0];
    $("#pi-winner-name").textContent = teamName(best);
    $("#pi-winner-time").textContent = `en ${fmt(best.time, true)}` + (pi.kind === "postit" && pi.target === 1 ? ` · mot : ${best.word}` : "");
    $("#pi-winner-hint").textContent = "Les autres binômes peuvent continuer pour départager le classement, ou s'arrêter là.";
    sfx.ok();
    show("pi-winner");
  }
  $("#btn-continue").addEventListener("click", nextRound);
  $("#btn-finish").addEventListener("click", endPostit);

  function endPostit() {
    stopClock();
    // Terminés d'abord (au temps), puis les autres (au nombre de mots, puis au temps)
    const ranked = [...pi.teams].sort((a, b) =>
      (isDone(b) - isDone(a)) || (isDone(a) ? a.time - b.time : (b.score - a.score) || (a.time - b.time)));
    $("#pi-ranking").innerHTML = ranked.map((t) => {
      const words = pi.kind === "postit" && pi.target === 1 ? `<span class="w">${esc(t.word)}</span>` : "";
      const status = isDone(t)
        ? fmt(t.time, true) + "<br>" + plural(t.turns, "tour")
        : (pi.target > 1 ? `${t.score}/${pi.target}<br>` : "") + (t.gaveUp ? "abandon" : "pas fini");
      return `<li class="${isDone(t) ? "" : "lost"}">
        <span><span class="n">${esc(teamName(t))}</span>${words}</span><span class="s">${status}</span></li>`;
    }).join("");
    sfx.end();
    show("pi-end");
  }

  $("#btn-pi-replay").addEventListener("click", () => startTeams(pi.kind));

  // ---------- Hors-ligne ----------
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
