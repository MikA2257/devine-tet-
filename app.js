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

  const DEFAULT_CATS = ["footballeurs", "sportifs", "acteurs", "chanteurs", "superheros", "dessinsanimes", "films"];
  const settings = Object.assign({
    cats: DEFAULT_CATS,
    control: "tilt",
    players: [],
    support: "paper",
    turnTime: 45,
    pairWords: 2,
    skips: 1
  }, store.get("settings", {}));
  const saveSettings = () => store.set("settings", settings);

  let customWords = store.get("custom", []);

  // Catégories d'une ancienne version : on repart des catégories par défaut
  {
    const known = new Set([...window.CATEGORIES.map((c) => c.id), "custom"]);
    settings.cats = settings.cats.filter((c) => known.has(c));
    if (!settings.cats.some((c) => c !== "custom")) settings.cats = [...DEFAULT_CATS, ...settings.cats];
  }
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
  // Composantes verticales (entre -1 et 1) de trois directions du téléphone :
  //  up    : normale à l'écran (+1 écran vers le plafond, 0 écran face aux autres, -1 vers le sol)
  //  top   : bord haut (±1 quand il est tenu en portrait)
  //  right : bord droit (±1 quand il est tenu en paysage, +1 si le bord droit est en haut)
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
        const b = e.beta * r, g = e.gamma * r;
        cb({ up: Math.cos(b) * Math.cos(g), top: Math.sin(b), right: -Math.cos(b) * Math.sin(g) });
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
    renderSeg("#seg-pairwords", String(settings.pairWords));
    renderSeg("#seg-skips", String(settings.skips));
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
  bindSeg("#seg-control", "control");
  bindSeg("#seg-support", "support");
  bindSeg("#seg-turn", "turnTime", true);
  bindSeg("#seg-pairwords", "pairWords", true);
  bindSeg("#seg-skips", "skips", true);

  function updateHints() {
    $("#opts-control").hidden = mode !== "front";
    $("#opts-postit").hidden = mode === "front";
    $("#skips-hint").textContent = settings.skips
      ? `Avant de commencer avec un nouveau mot, celui qui fait deviner le découvre et peut le changer ${settings.skips === 1 ? "une fois" : "jusqu'à 2 fois"} (s'il ne connaît pas la personne, par exemple).`
      : "Pas de changement possible : on joue le mot tiré.";
    $("#pairwords-hint").textContent = settings.pairWords === 2
      ? "Quand le binôme trouve, les rôles s'inversent et il reçoit un nouveau mot. Il a fini quand chacun a trouvé le sien."
      : "Un seul mot par binôme, toujours le même joueur qui devine.";
    $("#control-hint").textContent = settings.control === "tilt"
      ? "Téléphone à l'horizontale sur le front, écran vers le coéquipier. Dès qu'on le retire du front, le chrono se met en pause et l'appli demande si le mot est trouvé."
      : "Un bouton « Pause » s'affiche à l'écran : le coéquipier le touche pour arrêter le chrono.";
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
    startTeams(mode);
  });

  // Quitter une partie en cours
  $$("[data-quit]").forEach((b) => b.addEventListener("click", () => {
    if (fh.team && fh.phase !== "idle") {
      // Pendant un tour : pause plutôt que quitter la partie
      if (fh.phase === "play") return pauseFront();
      if (fh.banked > 0) return showAsk();
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
  // Mêmes règles que le post-it : le téléphone sur le front affiche le mot du binôme ; dès qu'il
  // quitte le front, le chrono se met en pause et on demande si le mot a été trouvé.
  const fh = {
    useTilt: false, phase: "idle",   // idle | ready | count | play | asked | over
    team: null, banked: 0, playStart: 0, offSince: 0, stageRot: "",
    timerId: null, endAt: 0, stableSince: 0, gotSensor: false,
    sensorCheck: null, countTimer: null
  };

  function launchFront(team) {
    fh.team = team;
    fh.banked = 0;
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
    $("#ready-msg").textContent = readyText();
    $("#btn-ready").hidden = fh.useTilt;
    show("fh-ready");
    keepAwake(true);

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

  function readyText() {
    const who = guesserOf(fh.team);
    return fh.useTilt
      ? `${who}, ${fh.banked > 0 ? "remets" : "mets"} le téléphone à l'horizontale sur ton front`
      : `${who}, prêt ?`;
  }

  $("#btn-ready").addEventListener("click", () => { unlockAudio(); startCountdown(); });

  function startCountdown() {
    if (fh.phase !== "ready") return;
    fh.phase = "count";
    fh.offSince = 0;
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

  // Si l'écran reste en portrait (rotation verrouillée) alors que le téléphone est à l'horizontale,
  // on tourne l'affichage pour que le mot soit lisible.
  function orientStage(right) {
    const portraitScreen = window.innerHeight > window.innerWidth;
    const cls = !portraitScreen || Math.abs(right) < 0.7 ? "" : right > 0 ? "rot-cw" : "rot-ccw";
    if (cls === fh.stageRot) return;
    fh.stageRot = cls;
    $$(".stage").forEach((el) => {
      el.classList.toggle("rot-cw", cls === "rot-cw");
      el.classList.toggle("rot-ccw", cls === "rot-ccw");
    });
  }

  function onTilt({ up, top, right }) {
    fh.gotSensor = true;
    const now = performance.now();
    // À l'horizontale (paysage) et debout, écran face aux autres : position « sur le front »
    const landscape = Math.abs(right) > 0.75;
    const inPose = landscape && Math.abs(up) < 0.4;
    const onForehead = Math.abs(up) < 0.5 && Math.abs(top) < 0.6;
    if (fh.phase === "ready" || fh.phase === "count") orientStage(right);
    if (fh.phase === "ready") {
      // Le compte à rebours ne démarre que téléphone à l'horizontale, stable sur le front
      $("#ready-msg").textContent = landscape ? readyText() : "🔄 Tourne le téléphone à l'horizontale";
      if (inPose) {
        if (!fh.stableSince) fh.stableSince = now;
        else if (now - fh.stableSince > 700) startCountdown();
      } else fh.stableSince = 0;
    } else if (fh.phase === "count") {
      // Téléphone retiré pendant le compte à rebours : on attend de nouveau
      if (inPose) fh.offSince = 0;
      else if (!fh.offSince) fh.offSince = now;
      else if (now - fh.offSince > 300) {
        clearTimeout(fh.countTimer);
        fh.phase = "ready";
        fh.stableSince = 0;
        $("#ready-count").textContent = "";
      }
    } else if (fh.phase === "play") {
      // Téléphone redressé / retiré du front : pause
      if (onForehead) fh.offSince = 0;
      else if (!fh.offSince) fh.offSince = now;
      else if (now - fh.offSince > 350) pauseFront();
    }
  }

  function beginPlay() {
    $("#tap-zones").classList.toggle("show", !fh.useTilt);
    fh.playStart = performance.now();
    fh.offSince = 0;
    fh.endAt = fh.playStart + settings.turnTime * 1000 - fh.banked;
    $("#fh-word").textContent = fh.team.word;
    $("#fh-flash").className = "flash";
    fh.phase = "play";
    show("fh-play");
    sfx.go();
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

  $("#tap-zones [data-act=pause]").addEventListener("click", pauseFront);

  document.addEventListener("keydown", (e) => {
    if (fh.phase === "play" && e.key === " ") pauseFront();
  });

  // ----- Pause : le mot est caché, on demande ce qui s'est passé -----
  function pauseFront() {
    if (fh.phase !== "play") return;
    fh.banked += performance.now() - fh.playStart;
    clearInterval(fh.timerId);
    clearTimeout(fh.sensorCheck);
    Tilt.stop();
    sfx.tick();
    buzz(60);
    showAsk();
  }

  function showAsk() {
    const t = fh.team;
    fh.phase = "asked";
    const left = Math.max(0, settings.turnTime * 1000 - fh.banked);
    $("#fh-ask-time").textContent = `Chrono en pause · il reste ${Math.ceil(left / 1000)} s`;
    $("#btn-ask-giveup").hidden = !pi.teams.some((o) => o !== t && isDone(o));
    show("fh-ask");
  }

  $("#btn-ask-found").addEventListener("click", () => {
    const used = Math.min(fh.banked, settings.turnTime * 1000);
    endFrontRuntime();
    teamFound(used);
  });
  $("#btn-ask-resume").addEventListener("click", () => { unlockAudio(); enterReady(); });
  $("#btn-ask-giveup").addEventListener("click", () => {
    const t = fh.team;
    if (!confirm(`${teamName(t)} abandonne ?`)) return;
    endFrontRuntime();
    teamGiveUp(t);
  });

  function timeUp() {
    if (fh.phase === "over") return;
    fh.phase = "over";
    clearInterval(fh.timerId);
    Tilt.stop();
    sfx.end();
    buzz([100, 60, 100]);
    const flash = $("#fh-flash");
    flash.textContent = "Temps écoulé !";
    flash.className = "flash end";
    setTimeout(() => {
      endFrontRuntime();
      teamTimeout();
    }, 1500);
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

  // =====================================================
  //            PARTIE EN BINÔMES (post-it et front)
  // =====================================================
  // Un joueur devine en posant des questions, son coéquipier répond (oui / non / peut-être / je ne sais pas).
  // Les binômes jouent à tour de rôle pendant settings.turnTime secondes ; le temps s'additionne
  // jusqu'à ce que le binôme ait trouvé pi.target mots. Le plus petit temps cumulé gagne.
  // Un mot à la fois ; une fois trouvé, les rôles s'inversent avec un nouveau mot (si pi.target = 2).
  //  - post-it : mot sur un vrai post-it ou sur l'écran, le coéquipier gère le chrono.
  //  - front   : le téléphone sur le front affiche le mot ; le retirer met le chrono en pause.
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
    return t.members[t.score % t.members.length];
  }
  function answererOf(t) {
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

  // Nouveau mot pour une équipe, avec ses jokers « changer de mot » remis à zéro
  function newWord(t) {
    t.word = null;
    t.word = drawWord();
    t.skipsLeft = settings.skips;
    t.seen = false;
  }

  function skipWord(t) {
    t.skipsLeft--;
    const left = t.skipsLeft;
    t.word = null;
    t.word = drawWord();
    t.skipsLeft = left;
  }

  const skipLabel = (t) => `⏭ Changer de mot (${t.skipsLeft} restant${t.skipsLeft > 1 ? "s" : ""})`;

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
    pi.target = settings.pairWords;
    pi.deck = buildDeck();
    if (!pi.deck.length) return toast("Aucun mot dans ces catégories");
    makeTeams();
    renderTeams();
    show("pi-teams");
  }

  function renderTeams() {
    const odd = settings.players.length % 2 === 1;
    const intro = pi.target > 1 ? "Quand un mot est trouvé, les rôles s'inversent avec un nouveau mot." : "Un mot par binôme.";
    $("#pi-teams-hint").textContent = `${intro} 🤔 devine · 💬 répond par oui, non, peut-être ou je ne sais pas.` +
      (odd ? " Nombre impair : il y a un trio, mais à chaque tour un seul devine et un seul répond, pour que ce soit équitable." : "");
    $("#pi-teams-list").innerHTML = pi.teams.map((t, i) => {
      const guessers = t.members.slice(0, Math.min(pi.target, t.members.length));
      const others = t.members.filter((m) => m !== t.members[0]);
      const lines = `<span class="role">🤔 <b>${guessers.map(esc).join("</b> puis <b>")}</b> ${guessers.length > 1 ? "devinent chacun leur tour" : "devine"}</span>
        <span class="role">💬 ${t.members.length > 2 ? "Les autres répondent à tour de rôle, un par tour" : pi.target > 1 ? "L'autre répond" : esc(others[0]) + " répond"}</span>`;
      return `<li class="team"><span class="team-num">${i + 1}</span><span>${lines}</span></li>`;
    }).join("");
  }

  $("#btn-reshuffle").addEventListener("click", () => { makeTeams(); renderTeams(); });
  $("#btn-teams-ok").addEventListener("click", () => {
    pi.cur = 0;
    pi.round = 1;
    pi.winnerShown = false;
    pi.teams.forEach(newWord);
    if (pi.kind === "postit" && settings.support === "paper") startDeal(pi.teams.map((_, i) => i), true);
    else showTurn();
  });

  // ----- Distribution des mots à écrire sur les post-it -----
  function startDeal(queue, initial) {
    pi.dealQueue = queue;
    pi.dealInitial = initial;
    $("#pi-deal-title").textContent = "Distribution";
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
        <p class="hint">${esc(g)}, ne regarde pas ! 🙈<br>Donne le téléphone à ${writers.map(esc).join(" ou ")}, qui écrit le mot.${t.skipsLeft ? "<br>S'il ne connaît pas la personne, il peut changer de mot." : ""}</p>
        <div class="stack"><button class="primary" id="deal-show">Afficher le mot</button></div>`;
      $("#deal-show").onclick = () => renderDeal(true);
    } else {
      body.innerHTML = `
        <div class="sub">À écrire pour <b>${esc(g)}</b> :</div>
        <div class="postit-paper small"><div class="postit-word">${esc(t.word)}</div></div>
        <div class="stack">
          <button class="primary" id="deal-next">C'est écrit, suivant</button>
          ${t.skipsLeft > 0 ? `<button class="secondary" id="deal-reroll">${skipLabel(t)}</button>` : ""}
        </div>`;
      $("#deal-next").onclick = () => { t.seen = true; pi.dealQueue.shift(); renderDeal(false); };
      if (t.skipsLeft > 0) $("#deal-reroll").onclick = () => { skipWord(t); renderDeal(true); };
    }
  }

  // ----- Avant le tour -----
  function showTurn() {
    const t = pi.teams[pi.cur];
    const g = guesserOf(t), a = answererOf(t);
    $("#pi-round").textContent = `Tour ${pi.round}`;
    $("#pi-turn-name").textContent = teamName(t);
    $("#pi-turn-roles").innerHTML = `🤔 <b>${esc(g)}</b> devine · 💬 <b>${esc(a)}</b> répond`;
    $("#pi-turn-hint").textContent =
      pi.kind === "front"
        ? `${g} met le téléphone à l'horizontale sur son front, écran vers ${a}. ` +
          (settings.control === "tilt" ? "Pour dire « trouvé », retire le téléphone du front : le chrono se met en pause." : `${a} touche « Pause » pour arrêter le chrono.`)
        : settings.support === "screen"
          ? `${g} pose le téléphone sur son front, écran vers ${a}, qui touche « Trouvé » dès que c'est trouvé.`
          : `${a} lance le chrono et touche « Trouvé » dès que c'est trouvé.`;
    $("#pi-board").innerHTML = pi.teams.map((q, i) => {
      const progress = pi.target > 1 ? `${q.score}/${pi.target} · ` : "";
      const status = isDone(q) ? "✓ " + fmt(q.time, true) : q.gaveUp ? "abandon" : progress + fmt(q.time) + " · " + plural(q.turns, "tour");
      return `<li class="${i === pi.cur ? "current" : ""} ${q.gaveUp ? "out" : ""}">
        <span class="n">${esc(teamName(q))}</span><span class="w">${status}</span></li>`;
    }).join("");
    // Nouveau mot avec joker : celui qui fait deviner le découvre d'abord (et peut le changer)
    const peek = !t.seen && t.skipsLeft > 0;
    const actions = $("#pi-turn-actions");
    actions.innerHTML = peek
      ? `<button class="primary" id="pi-go">👀 ${esc(a)} découvre le mot</button>`
      : pi.kind === "front"
        ? `<button class="primary" id="pi-go">📱 C'est parti (${settings.turnTime} s)</button>`
        : `<button class="primary" id="pi-go">▶ Lancer le chrono (${settings.turnTime} s)</button>`;
    // Abandon possible dès qu'une autre équipe a fini
    const canGiveUp = pi.teams.some((o) => o !== t && isDone(o));
    if (canGiveUp) actions.innerHTML += `<button class="secondary" id="pi-giveup">Ce binôme abandonne</button>`;
    actions.innerHTML += `<button class="link-btn" id="pi-stop">Terminer la partie</button>`;
    $("#pi-go").onclick = () => { unlockAudio(); peek ? showPeek(false) : startTurn(); };
    if (canGiveUp) $("#pi-giveup").onclick = () => {
      if (confirm(`${teamName(t)} abandonne ?`)) teamGiveUp(t);
    };
    $("#pi-stop").onclick = () => { if (confirm("Terminer la partie et voir le classement ?")) endPostit(); };
    show("pi-turn");
  }

  function startTurn() {
    const t = pi.teams[pi.cur];
    t.seen = true;
    pi.kind === "front" ? launchFront(t) : startClock();
  }

  // Aperçu du mot pour celui qui fait deviner, avec les jokers « changer de mot »
  function showPeek(revealed) {
    const t = pi.teams[pi.cur];
    const g = guesserOf(t), a = answererOf(t);
    const body = $("#pi-deal-body");
    $("#pi-deal-title").textContent = "Le mot";
    if (!revealed) {
      body.innerHTML = `
        <div class="sub">Écran réservé à</div>
        <div class="deal-name">${esc(a)}</div>
        <p class="hint">${esc(g)}, ferme les yeux ! 🙈<br>${esc(a)} découvre le mot et peut le changer s'il ne connaît pas la personne.</p>
        <div class="stack"><button class="primary" id="peek-show">Afficher le mot</button></div>`;
      $("#peek-show").onclick = () => showPeek(true);
    } else {
      body.innerHTML = `
        <div class="sub">À faire deviner à <b>${esc(g)}</b> :</div>
        <div class="postit-paper small"><div class="postit-word">${esc(t.word)}</div></div>
        <div class="stack">
          <button class="primary" id="peek-go">✓ On garde, c'est parti !</button>
          ${t.skipsLeft > 0 ? `<button class="secondary" id="peek-skip">${skipLabel(t)}</button>` : ""}
        </div>`;
      $("#peek-go").onclick = () => { unlockAudio(); startTurn(); };
      if (t.skipsLeft > 0) $("#peek-skip").onclick = () => { skipWord(t); showPeek(true); };
    }
    show("pi-deal");
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
    const used = Math.min(elapsed(), turnMs());
    stopClock();
    teamFound(used);
  });

  // ----- Issues d'un tour (communes post-it / front) -----
  function teamGiveUp(t) {
    t.gaveUp = true;
    pi.afterReveal = null;
    reveal(`${teamName(t)} abandonne. Le mot était :`, t.word, "");
  }

  function teamFound(used) {
    const t = pi.teams[pi.cur];
    const word = t.word;
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
    newWord(t);
    const idx = pi.cur;
    pi.afterReveal = pi.kind === "postit" && settings.support === "paper" ? () => startDeal([idx], false) : null;
    reveal(`Bravo ! 🎉 C'était :`, word,
      `${t.score}/${pi.target} · ${fmt(t.time, true)} au compteur. Rôles inversés : ${guesserOf(t)} devinera un nouveau mot au prochain tour.`);
  }

  function turnOver() {
    stopClock();
    teamTimeout();
  }

  function teamTimeout() {
    const t = pi.teams[pi.cur];
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
    $("#pi-winner-time").textContent = `en ${fmt(best.time, true)}` + (pi.target === 1 ? ` · mot : ${best.word}` : "");
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
      const words = pi.target === 1 ? `<span class="w">${esc(t.word)}</span>` : "";
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
