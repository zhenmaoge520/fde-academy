/* =========================================================
   FDE Academy · 逻辑
   校园地图渲染 / 课程勾选 / 学分与年级 / 毕业证 / 中英切换
   ========================================================= */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------- 状态 ---------------- */
  const KEY = "fde-academy-v1";
  const state = Object.assign(
    { done: [], name: "", sid: "", lang: "zh", time: "night", avatar: "🧑‍🎓" },
    (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })()
  );
  if (!state.lang) state.lang = (navigator.language || "zh").toLowerCase().startsWith("en") ? "en" : "zh";
  if (!state.sid) state.sid = "FDE-2026-" + String(1000 + Math.floor(Math.random() * 8999));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  const T = () => I18N[state.lang];
  const D = () => DATA[state.lang];
  const isDone = (id) => state.done.includes(id);

  /* ---------------- 统计 ---------------- */
  function stats() {
    let total = 0, earned = 0, coreTotal = 0, coreDone = 0;
    D().buildings.forEach((b) => b.courses.forEach((c) => {
      total += c.c;
      if (c.core) coreTotal++;
      if (isDone(c.id)) { earned += c.c; if (c.core) coreDone++; }
    }));
    return { total, earned, coreTotal, coreDone, pct: total ? earned / total : 0 };
  }

  function gradeIndex(pct) {
    if (pct >= 0.999) return 5;
    if (pct >= 0.95) return 4;
    if (pct >= 0.75) return 3;
    if (pct >= 0.5) return 2;
    if (pct >= 0.25) return 1;
    return 0;
  }

  /* ---------------- 顶栏 / 通知书 / 学生证 ---------------- */
  function renderStatic() {
    const t = T();
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    $("#brand-tag").textContent = t.brandTag;
    $("#letter-kicker").textContent = t.letterKicker;
    $("#letter-title").textContent = t.letterTitle;
    $("#letter-body").textContent = t.letterBody;
    $("#sign-sub").textContent = t.signSub;
    $("#edit-name-btn").textContent = t.editName;
    $("#id-school").textContent = t.school;
    $("#lbl-name").textContent = t.lblName;
    $("#lbl-sid").textContent = t.lblSid;
    $("#lbl-major").textContent = t.lblMajor;
    $("#lbl-grade").textContent = t.lblGrade;
    $("#id-major").textContent = t.major;
    $("#lbl-progress").textContent = t.lblProgress;
    $("#credit-word").textContent = t.credits;
    $("#t-campus").innerHTML = t.campusTitle;
    $("#d-campus").textContent = t.campusDesc;
    $("#t-sem").innerHTML = t.semTitle;
    $("#d-sem").textContent = t.semDesc;
    $("#t-rules").innerHTML = t.rulesTitle;
    $("#d-rules").textContent = t.rulesDesc;
    $("#t-grad").innerHTML = t.gradTitle;
    $("#d-grad").textContent = t.gradDesc;
    $("#grad-btn").textContent = t.gradBtn;
    $("#foot-note").textContent = t.footNote;
    $("#cert-kicker").textContent = t.certKicker;
    $("#cert-title").textContent = t.certTitle;
    $("#cert-text").textContent = t.certText;
    $("#cert-lbl-credit").textContent = t.certCredit;
    $("#cert-lbl-date").textContent = t.certDate;
    $("#cert-lbl-no").textContent = t.certNo;
    $("#cert-close").textContent = t.certClose;
    $("#cert-print").textContent = t.certPrint;
    $("#lang-btn").textContent = state.lang === "zh" ? "EN" : "中";
    $("#time-btn").textContent = state.time === "night" ? "🌙" : "☀️";
  }

  function renderCard() {
    const t = T(), s = stats();
    $("#id-name").textContent = state.name || t.newStudent;
    $("#id-sid").textContent = state.sid;
    $("#id-avatar").textContent = state.avatar;
    $("#id-grade").textContent = t.grades[gradeIndex(s.pct)];
    $("#credit-now").textContent = s.earned;
    $("#credit-total").textContent = s.total;
    $("#prog-pct").textContent = Math.round(s.pct * 100) + "%";
    $("#prog-fill").style.width = (s.pct * 100).toFixed(1) + "%";
    $("#prog-meta").textContent =
      `${t.core} ${s.coreDone}/${s.coreTotal} · ${t.doneCount(state.done.length, countCourses())}`;
  }

  function countCourses() {
    return D().buildings.reduce((n, b) => n + b.courses.length, 0);
  }

  /* ---------------- 校园地图 ---------------- */
  const POS = [
    { x: 80, y: 120 }, { x: 380, y: 120 }, { x: 680, y: 120 },
    { x: 80, y: 350 }, { x: 380, y: 350 }, { x: 680, y: 350 },
  ];

  function svg(tag, attrs) {
    const n = document.createElementNS(SVGNS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  }

  function renderCampus() {
    const root = $("#campus");
    root.innerHTML = "";

    // 道路
    const road = svg("path", {
      d: "M0 315 H960 M0 560 H960 M300 315 V560 M620 315 V560",
      stroke: "var(--road)", "stroke-width": 16, fill: "none", "stroke-linecap": "round",
    });
    root.appendChild(road);

    // 校门牌
    const gate = svg("text", { x: 480, y: 46, "text-anchor": "middle", class: "bld-name",
      style: "font-size:18px;letter-spacing:4px;opacity:.75" });
    gate.textContent = "FDE ACADEMY · EST. 2026";
    root.appendChild(gate);

    D().buildings.forEach((b, i) => {
      const p = POS[i] || POS[0];
      const w = 200, h = 150;
      const g = svg("g", { class: "bld", transform: `translate(${p.x},${p.y})` });
      g.dataset.bid = b.id;

      const done = b.courses.filter((c) => isDone(c.id)).length;
      const all = b.courses.length;
      if (done === all && all > 0) g.classList.add("done");

      // 地基阴影
      g.appendChild(svg("ellipse", { cx: w / 2, cy: h + 12, rx: w / 2 + 6, ry: 10,
        fill: "rgba(0,0,0,.28)" }));

      // 楼体
      g.appendChild(svg("rect", { class: "bld-box", x: 0, y: 30, width: w, height: h - 30,
        rx: 8, fill: "var(--panel-solid)", stroke: b.color, "stroke-width": 2 }));

      // 屋顶
      const roof = svg("polygon", { class: "bld-roof",
        points: `-10,30 ${w / 2},-14 ${w + 10},30`, fill: b.color, "fill-opacity": .85,
        stroke: b.color, "stroke-width": 2 });
      g.appendChild(roof);

      // 窗户
      const cols = 4, rows = 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = done / Math.max(all, 1) > (r * cols + c) / (rows * cols) * 0.9;
          const win = svg("rect", { class: "win", x: 24 + c * 42, y: 48 + r * 44,
            width: 26, height: 26, rx: 4,
            fill: lit ? b.color : "var(--line)", "fill-opacity": lit ? .95 : .6 });
          win.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
          g.appendChild(win);
        }
      }

      // 门
      g.appendChild(svg("rect", { x: w / 2 - 18, y: h - 34, width: 36, height: 34, rx: 4,
        fill: b.color, "fill-opacity": .35, stroke: b.color }));

      // 图标与文字
      const icon = svg("text", { x: w / 2, y: h + 34, "text-anchor": "middle", style: "font-size:20px" });
      icon.textContent = b.icon;
      g.appendChild(icon);

      const name = svg("text", { x: w / 2, y: h + 58, "text-anchor": "middle", class: "bld-name" });
      name.textContent = b.name;
      g.appendChild(name);

      const sub = svg("text", { x: w / 2, y: h + 76, "text-anchor": "middle", class: "bld-sub" });
      sub.textContent = `${done}/${all} · ${b.sub}`;
      g.appendChild(sub);

      if (done === all && all > 0) {
        const badge = svg("text", { x: w - 12, y: 22, "text-anchor": "end", class: "badge-done" });
        badge.textContent = "✔";
        g.appendChild(badge);
      }

      g.addEventListener("click", () => openDrawer(b));
      root.appendChild(g);
    });
  }

  /* ---------------- 课程抽屉 ---------------- */
  function openDrawer(b) {
    const t = T();
    $("#drawer-title").textContent = b.icon + "  " + b.name;
    const done = b.courses.filter((c) => isDone(c.id)).length;
    $("#drawer-sub").textContent = `${b.desc}　·　${t.doneCount(done, b.courses.length)}`;

    const body = $("#drawer-body");
    body.innerHTML = b.courses.map((c) => `
      <div class="course${isDone(c.id) ? " done" : ""}" data-cid="${c.id}">
        <div class="course-head">
          <div class="chk">${isDone(c.id) ? "✓" : ""}</div>
          <div>
            <div class="course-name">${c.n}</div>
            <div class="course-tags">
              ${c.core ? `<span class="tag core">${t.core}</span>` : ""}
              <span class="tag credit">⭐ ${c.c} ${t.credits}</span>
              <span class="tag">⏱ ${c.h} ${t.hours}</span>
              <span class="tag">${t.level} ${"★".repeat(c.lv)}</span>
            </div>
          </div>
        </div>
        <ul class="course-goals">${c.g.map((x) => `<li>${x}</li>`).join("")}</ul>
        <div class="course-cp"><b>${t.checkpoint}：</b>${c.cp}</div>
        <div class="course-res">
          ${c.r.map(([label, url]) => url
            ? `<a class="res-link" href="${url}" target="_blank" rel="noopener">🔗 ${label}</a>`
            : `<span class="res-link">📚 ${label}</span>`).join("")}
        </div>
      </div>`).join("");

    body.querySelectorAll(".course").forEach((node) => {
      node.querySelector(".chk").addEventListener("click", (e) => {
        e.stopPropagation();
        toggle(node.dataset.cid);
      });
    });

    $("#drawer").classList.add("show");
    $("#scrim").classList.add("show");
  }

  function closeDrawer() {
    $("#drawer").classList.remove("show");
    $("#scrim").classList.remove("show");
  }

  function toggle(id) {
    const course = D().buildings.flatMap((b) => b.courses).find((c) => c.id === id);
    if (!course) return;
    if (isDone(id)) {
      state.done = state.done.filter((x) => x !== id);
      toast(T().toastUndo(course.c));
    } else {
      state.done.push(id);
      toast(T().toastDone(course.c));
      if (state.done.length === countCourses()) setTimeout(graduate, 500);
    }
    save();
    renderCard();
    renderCampus();
    const open = $("#drawer").classList.contains("show");
    if (open) {
      const b = D().buildings.find((bb) => bb.courses.some((c) => c.id === id));
      if (b) openDrawer(b);
    }
  }

  /* ---------------- 学期 / 军规 ---------------- */
  function renderSemesters() {
    $("#semesters").innerHTML = D().semesters.map((s) => `
      <div class="sem">
        <div class="sem-head"><span class="sem-no">${s.no}</span><span class="sem-title">${s.title}</span></div>
        <div class="sem-goal">${s.goal}</div>
        <ul class="sem-list">${s.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <div class="sem-out">${s.out}</div>
      </div>`).join("");
  }

  function renderRules() {
    $("#rules").innerHTML = D().rules.map((r, i) => `
      <div class="rule">
        <div class="rule-no">${String(i + 1).padStart(2, "0")}</div>
        <div class="rule-title">${r.t}</div>
        <div class="rule-desc">${r.d}</div>
      </div>`).join("");
  }

  /* ---------------- 毕业 ---------------- */
  function graduate() {
    const t = T(), s = stats();
    const canGrad = s.coreDone === s.coreTotal || s.pct >= 0.85;
    if (!canGrad) {
      toast(t.gradFail(s.coreTotal - s.coreDone));
      return;
    }
    const now = new Date();
    $("#cert-name").textContent = state.name || t.newStudent;
    $("#cert-credit").textContent = s.earned + " / " + s.total;
    $("#cert-date").textContent = now.toISOString().slice(0, 10);
    $("#cert-no").textContent = state.sid.replace("FDE-2026-", "CERT-2026-");
    $("#modal").classList.add("show");
    confetti();
  }

  function confetti() {
    const chars = ["🎓", "⭐", "✨", "🎉", "📜"];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("span");
      s.textContent = chars[i % chars.length];
      s.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-20px;z-index:99;
        font-size:${14 + Math.random() * 18}px;pointer-events:none;
        transition:transform ${2 + Math.random() * 1.6}s linear, opacity ${2 + Math.random()}s`;
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = `translateY(${70 + Math.random() * 30}vh) rotate(${Math.random() * 720 - 360}deg)`;
        s.style.opacity = "0";
      });
      setTimeout(() => s.remove(), 3800);
    }
  }

  /* ---------------- 提示条 ---------------- */
  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------------- 交互绑定 ---------------- */
  $("#lang-btn").addEventListener("click", () => {
    state.lang = state.lang === "zh" ? "en" : "zh";
    save();
    renderAll();
  });

  $("#time-btn").addEventListener("click", () => {
    state.time = state.time === "night" ? "day" : "night";
    document.documentElement.dataset.time = state.time;
    save();
    renderStatic();
  });

  $("#reset-btn").addEventListener("click", () => {
    if (!confirm(T().resetConfirm)) return;
    state.done = [];
    save();
    renderCard();
    renderCampus();
    closeDrawer();
    toast(T().toastReset);
  });

  $("#edit-name-btn").addEventListener("click", () => {
    const v = prompt(T().namePrompt, state.name || "");
    if (v != null) { state.name = v.trim().slice(0, 20); save(); renderCard(); }
  });

  $("#id-avatar").addEventListener("click", () => {
    const faces = ["🧑‍🎓", "🧑‍💻", "😎", "🦾", "🐱", "🚀"];
    state.avatar = faces[(faces.indexOf(state.avatar) + 1) % faces.length];
    save();
    renderCard();
  });

  $("#drawer-close").addEventListener("click", closeDrawer);
  $("#scrim").addEventListener("click", closeDrawer);
  $("#grad-btn").addEventListener("click", graduate);
  $("#cert-close").addEventListener("click", () => $("#modal").classList.remove("show"));
  $("#cert-print").addEventListener("click", () => window.print());
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").classList.remove("show"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); $("#modal").classList.remove("show"); }
  });

  /* ---------------- 启动 ---------------- */
  function renderAll() {
    renderStatic();
    renderCard();
    renderCampus();
    renderSemesters();
    renderRules();
    if ($("#drawer").classList.contains("show")) closeDrawer();
  }

  document.documentElement.dataset.time = state.time;
  renderAll();

  // URL 参数：?b=fde 直接打开某个学部（方便分享/截图）
  try {
    const b = new URLSearchParams(location.search).get("b");
    if (b) {
      const bd = D().buildings.find((x) => x.id === b);
      if (bd) setTimeout(() => openDrawer(bd), 400);
    }
  } catch (e) {}
})();
