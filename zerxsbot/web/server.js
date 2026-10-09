// ============================================================
// web/server.js - Express server untuk panel pairing ZerxsBot
// Login via Google Spreadsheet (Apps Script) + halaman Beranda,
// Pairing, dan Fitur. Style: black green soft modern.
// ============================================================
const express = require("express");
const session = require("express-session");
const path = require("path");
const QRCode = require("qrcode");

const config = require("../config");
const spreadsheet = require("../lib/spreadsheet");
const pairingState = require("../lib/pairingState");
const { COMMANDS } = require("../lib/menu");

function startWebServer(getSock) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/public", express.static(path.join(__dirname, "public")));
  app.use(session({
    name: "zerxs.sid",
    secret: config.web.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 jam
  }));

  // middleware wajib login utk halaman dashboard
  function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.redirect("/login");
  }

  // ---------- Halaman loading spiral ----------
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "loading.html"));
  });

  // ---------- Halaman login ----------
  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
  });

  // ---------- API: validasi login ----------
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password, nomor } = req.body || {};
      if (!username || !password || !nomor) {
        return res.json({ ok: false, message: "Semua kolom wajib diisi." });
      }
      const result = await spreadsheet.verifyLogin(username, password, nomor);
      if (result.ok) {
        req.session.user = result.data;
        return res.json({ ok: true, message: "Login berhasil", redirect: "/dashboard?menu=beranda" });
      }
      return res.status(401).json({ ok: false, message: result.message || "Login gagal: data tidak ada di spreadsheet." });
    } catch (e) {
      return res.status(500).json({ ok: false, message: "Error server: " + e.message });
    }
  });

  // ---------- Logout ----------
  app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
  });

  // ---------- Dashboard (SPA dalam satu HTML dengan sidebar) ----------
  app.get("/dashboard", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  });

  // ---------- API: profil + global info ----------
  app.get("/api/profile", requireLogin, async (req, res) => {
    try {
      const stats = await spreadsheet.getStats();
      const s = pairingState.state;
      const u = req.session.user || {};
      // dinormalisasi agar field yang dibaca dashboard selalu tersedia
      const user = {
        username: u.username || "-",
        nomor: u.nomor || "-",
        nama: u.nama_profil || u.nama || u.name || u.username || "-",
        expired: u.expired || u.expiredDate || "-"
      };
      const online = s.connectionStatus === "online";
      res.json({
        ok: true,
        user,
        bot: {
          name: config.botName,
          status: online ? "ONLINE" : "OFFLINE",
          online
        },
        global: {
          totalAccounts: stats.data.total_accounts,
          totalLogins: stats.data.total_logins,
          uniqueLoggedUsers: stats.data.unique_logged_users,
          backendOk: stats.ok
        },
        time: new Date().toISOString()
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: "Error: " + e.message });
    }
  });

  // ---------- API: status pairing / QR ----------
  app.get("/api/status", requireLogin, async (req, res) => {
    const s = pairingState.state;
    let qrDataUrl = null;
    if (s.qrString) {
      try {
        qrDataUrl = await QRCode.toDataURL(s.qrString, { width: 320, margin: 1 });
      } catch (_) {}
    }
    res.json({
      ok: true,
      connection: s.connectionStatus,
      hasQR: !!s.qrString,
      qrDataUrl,
      pairingCode: s.pairingCode,
      pairingPhone: s.pairingPhone,
      lastResult: s.lastPairingResult
    });
  });

  // ---------- API: minta kode pairing dari website ----------
  app.post("/api/pair", requireLogin, async (req, res) => {
    try {
      const phone = String(req.body.phone || "").replace(/[^0-9]/g, "");
      if (phone.length < 10) return res.json({ ok: false, message: "Nomor telepon tidak valid." });
      const result = await pairingState.requestPairing(phone);
      res.json(result);
    } catch (e) {
      res.json({ ok: false, message: "Error: " + e.message });
    }
  });

  // ---------- API: daftar fitur ----------
  app.get("/api/features", requireLogin, (req, res) => {
    res.json({ ok: true, features: COMMANDS, botName: config.botName });
  });

  // ---------- Jalankan ----------
  const PORT = config.web.port;
  app.listen(PORT, config.web.host, () => {
    console.log(`🌐 Web server ZerxsBot pada http://localhost:${PORT}`);
  });

  return app;
}

module.exports = startWebServer;
