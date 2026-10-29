/**
 * ZerxsBot - Entry point: menjalankan web panel + engine bot.
 * Jalankan: npm start  ->  http://localhost:3000
 */
const express = require("express");
const path = require("path");
const config = require("./config");
const commandLoader = require("./lib/commandLoader");
const botManager = require("./lib/botManager");
const handler = require("./lib/handler");
const createWebRoutes = require("./web/routes");

// Muat seluruh perintah (1 perintah = 1 file di folder commands/)
commandLoader.loadAll();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Static GUI (html/js/css + assets video)
app.use(express.static(path.join(__dirname, "public")));

// Rute web (login, pairing SSE, bot manager, admin)
app.use("/", createWebRoutes());

// 404 halus untuk API
app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "Endpoint tidak ada" }));

const server = app.listen(config.web.port, config.web.host, () => {
  // Log minimal, tanpa spam
  console.log(`ZerxsBot ${config.version} | Web: http://localhost:${config.web.port}`);
});

/** Sesi pairing dibuka dari WEB; buka browser otomatis sekali saja. */
server.on("listening", () => {
  if (process.env.NODE_ENV !== "production") {
    import("open")
      .then((m) => m.default(`http://localhost:${config.web.port}`))
      .catch(() => {});
  }
});

// Restore sesi bot yang sudah pernah pair (senyap)
botManager
  .restoreSessions()
  .then(() => handler.refreshCache())
  .catch(() => {});

// Sinkronkan cache spreadsheet tiap 60 detik (senyap, tanpa log berulang)
setInterval(() => handler.refreshCache().catch(() => {}), 60000);

// Purge akun expired tiap 1 jam via Apps Script (stats memicu purgeExpired)
setInterval(() => {
  const db = require("./lib/db");
  db.stats().catch(() => {});
}, 3600000);

process.on("uncaughtException", (err) => {
  console.error("[zerxs] uncaught:", err.message);
});

module.exports = app;
