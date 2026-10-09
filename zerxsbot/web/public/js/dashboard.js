// ============================================================
// web/public/js/dashboard.js - Logika SPA dashboard ZerxsBot
// Navigasi sidebar (Beranda / Pairing / Fitur), jam & tanggal,
// info pengguna, global info, QR pairing, kode pairing, fitur.
// ============================================================
(function () {
  "use strict";

  // ---------- Util ----------
  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  function pad(n) { return String(n).padStart(2, "0"); }

  function formatTanggal(d) {
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  }
  function formatJam(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function formatExpired(v) {
    if (!v || v === "-") return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${formatTanggal(d)} • ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ---------- Navigasi halaman (SPA) ----------
  const PAGES = ["beranda", "pairing", "fitur"];
  const TITLES = { beranda: "Beranda", pairing: "Pairing WhatsApp", fitur: "Fitur & Perintah" };
  let currentMenu = "beranda";
  let featuresLoaded = false;

  function showPage(menu) {
    if (!PAGES.includes(menu)) menu = "beranda";
    currentMenu = menu;

    // update URL tanpa reload
    try { history.replaceState(null, "", "/dashboard?menu=" + menu); } catch (_) {}

    // aktifkan nav item
    document.querySelectorAll("#sideNav .nav-item").forEach((a) => {
      a.classList.toggle("active", a.dataset.menu === menu);
    });

    // sembunyikan semua section, tampilkan yang aktif
    PAGES.forEach((p) => {
      const sec = $("page-" + p);
      if (sec) sec.style.display = (p === menu) ? "" : "none";
    });

    const titleEl = $("pageTitle");
    if (titleEl) titleEl.textContent = TITLES[menu] || "Beranda";

    // muat data per halaman
    if (menu === "pairing") {
      refreshStatus(true);          // langsung tarik QR/kode terbaru
    } else if (menu === "fitur") {
      loadFeatures();
    }
  }

  function bindNav() {
    const nav = $("sideNav");
    if (!nav) return;
    nav.addEventListener("click", (e) => {
      const link = e.target.closest(".nav-item");
      if (!link) return;
      e.preventDefault();
      showPage(link.dataset.menu);
    });
  }

  // ---------- Jam & tanggal realtime ----------
  function startClock() {
    const el = $("dateTimeNow");
    if (!el) return;
    const tick = () => {
      const d = new Date();
      el.textContent = `📅 ${formatTanggal(d)}  ⏰ ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------- Profil & Global Info ----------
  async function loadProfile() {
    const uName = $("userName"), uUser = $("uUsername"), uNomor = $("uNomor"),
      uExp = $("uExpired"), avatar = $("userAvatar");
    const gLogged = $("gLoggedUsers"), gAcc = $("gAccounts"), gLogins = $("gLogins"),
      gBot = $("gBotStatus"), gBackend = $("gBackend"), badge = $("botStatusBadge");
    try {
      const res = await fetch("/api/profile", { headers: { Accept: "application/json" } });
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      const json = await res.json();
      if (!json || !json.ok) throw new Error((json && json.message) || "Respons tidak valid");

      const u = json.user || {};
      const nama = u.nama || u.name || u.username || "-";
      if (uName) uName.textContent = nama;
      if (avatar) avatar.textContent = (nama[0] || "?").toUpperCase();
      if (uUser) uUser.textContent = u.username || "-";
      if (uNomor) uNomor.textContent = u.nomor ? "+" + String(u.nomor).replace(/\D/g, "") : "-";
      if (uExp) uExp.textContent = formatExpired(u.expired || u.expiredDate || u.expired_date);

      const g = json.global || {};
      if (gLogged) gLogged.textContent = (g.uniqueLoggedUsers != null ? g.uniqueLoggedUsers : "-") + " pengguna";
      if (gAcc) gAcc.textContent = (g.totalAccounts != null ? g.totalAccounts : "-") + " akun";
      if (gLogins) gLogins.textContent = (g.totalLogins != null ? g.totalLogins : "-") + " kali";
      if (gBackend) gBackend.textContent = g.backendOk ? "Terhubung ✔" : "Tidak terhubung ✘";

      const bot = json.bot || {};
      const online = !!bot.online;
      if (gBot) gBot.textContent = online ? "ONLINE 🟢" : "OFFLINE 🔴";
      if (badge) {
        badge.textContent = online ? "BOT ONLINE" : "BOT OFFLINE";
        badge.className = "badge " + (online ? "on" : "off");
      }
    } catch (err) {
      console.error("Gagal memuat profil:", err);
      [uName, uUser, uNomor, uExp, gLogged, gAcc, gLogins, gBot, gBackend].forEach((el) => {
        if (el && el.textContent === "-") el.textContent = "gagal memuat";
      });
      if (badge) { badge.textContent = "STATUS GAGAL DIMUAT"; badge.className = "badge off"; }
    }
  }

  // ---------- Status pairing / QR ----------
  let lastQr = null;
  async function refreshStatus(force) {
    const qrBox = $("qrBox"), badge = $("botStatusBadge");
    try {
      const res = await fetch("/api/status");
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      const json = await res.json();
      if (!json || !json.ok) return;

      // badge status di topbar ikut diperbarui
      const online = json.connection === "online" || json.connection === "logged";
      if (badge) {
        badge.textContent = online ? "BOT ONLINE" : "BOT OFFLINE";
        badge.className = "badge " + (online ? "on" : "off");
      }

      if (currentMenu !== "pairing" || !qrBox) return;

      if (json.qrDataUrl && json.qrDataUrl !== lastQr) {
        lastQr = json.qrDataUrl;
        qrBox.innerHTML = `<img src="${esc(json.qrDataUrl)}" alt="QR Code ZerxsBot"/>` +
          `<p class="hint">QR berlaku ±60 detik dan otomatis diperbarui.</p>`;
      } else if (!json.qrDataUrl && !json.pairingCode) {
        if (online) {
          qrBox.innerHTML = `<span class="hint">✅ Bot sudah terhubung ke WhatsApp.<br>Tidak ada QR aktif.</span>`;
        } else {
          qrBox.innerHTML = `<span class="hint">Menunggu QR dari bot...<br/>QR muncul otomatis saat sesi baru dibuat.</span>`;
        }
      }

      // tampilkan kode pairing terakhir bila ada
      const codeEl = $("pairCode");
      if (codeEl && json.pairingCode) {
        codeEl.style.display = "";
        codeEl.textContent = String(json.pairingCode);
      }
    } catch (err) {
      console.error("Gagal mengambil status:", err);
    }
  }

  // ---------- Request kode pairing ----------
  function bindPairButton() {
    const btn = $("btnPair");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const dial = ($("pairDial") && $("pairDial").value) || "62";
      const raw = (($("pairPhone") && $("pairPhone").value) || "").replace(/[^0-9]/g, "");
      const alertEl = $("pairAlert");
      const codeEl = $("pairCode");
      if (alertEl) { alertEl.className = "alert"; alertEl.textContent = ""; }
      if (!raw || raw.length < 8) {
        if (alertEl) { alertEl.className = "alert err"; alertEl.textContent = "✖ Masukkan nomor WhatsApp yang valid."; }
        return;
      }
      const nomor = raw.startsWith("0") ? dial + raw.slice(1) : (raw.startsWith(dial) ? raw : dial + raw);

      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "Meminta kode dari WhatsApp...";
      try {
        const res = await fetch("/api/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: nomor })
        });
        const json = await res.json();
        if (json.ok && json.code) {
          if (codeEl) { codeEl.style.display = ""; codeEl.textContent = String(json.code); }
          if (alertEl) { alertEl.className = "alert ok"; alertEl.textContent = "✔ " + (json.message || "Kode pairing berhasil dibuat."); }
        } else {
          if (alertEl) { alertEl.className = "alert err"; alertEl.textContent = "✖ " + (json.message || "Gagal membuat kode pairing."); }
        }
      } catch (err) {
        if (alertEl) { alertEl.className = "alert err"; alertEl.textContent = "✖ Error: " + err.message; }
      } finally {
        btn.disabled = false;
        btn.textContent = oldText;
      }
    });
  }

  // ---------- Daftar fitur ----------
  async function loadFeatures() {
    if (featuresLoaded) return;
    const body = $("featureBody");
    if (!body) return;
    try {
      const res = await fetch("/api/features");
      if (res.status === 401 || res.status === 403) { window.location.href = "/login"; return; }
      const json = await res.json();
      if (!json || !json.ok || !Array.isArray(json.features)) throw new Error("Data fitur tidak valid");
      body.innerHTML = json.features.map((f) => `
        <tr>
          <td><code>${esc(f.cmd)}</code></td>
          <td><code>${esc(f.use)}</code></td>
          <td>${esc(f.desc)}</td>
        </tr>`).join("");
      featuresLoaded = true;
    } catch (err) {
      body.innerHTML = `<tr><td colspan="3" class="hint">Gagal memuat fitur: ${esc(err.message)}</td></tr>`;
    }
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    bindNav();
    startClock();
    bindPairButton();

    // menu awal dari URL (?menu=pairing) atau hash (#pairing)
    let start = "beranda";
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("menu") || (window.location.hash || "").replace("#", "");
      if (PAGES.includes(m)) start = m;
    } catch (_) {}
    showPage(start);

    // polling data berkala
    loadProfile();
    refreshStatus(false);
    setInterval(loadProfile, 30000);   // profil & global info tiap 30s
    setInterval(() => refreshStatus(false), 5000); // QR/status tiap 5s
  });
})();
