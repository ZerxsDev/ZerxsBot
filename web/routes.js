/**
 * ZerxsBot - Rute web panel + API JSON (login, pairing, bot manager, admin).
 */
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const config = require("../config");
const db = require("../lib/db");
const roles = require("../lib/roles");
const botManager = require("../lib/botManager");

const router = express.Router();

/* ------------------- Session sederhana (in-memory) ------------- */
const sessions = new Map(); // token -> { username, role, phone, createdAt }

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function auth(required = true) {
  return (req, res, next) => {
    const token = req.headers["x-zerxs-token"] || "";
    const sess = sessions.get(token);
    if (required && !sess)
      return res.status(401).json({ ok: false, error: "Silakan login dahulu." });
    req.sess = sess || null;
    next();
  };
}

function isAdminRole(role) {
  return ["developer", "founder"].includes(String(role || "").toLowerCase());
}

/* ------------------------- PAGES -------------------------------- */

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

/* --------------------------- AUTH ------------------------------- */

router.post("/api/login", async (req, res) => {
  try {
    const { username, phone, password } = req.body || {};
    if (!username || !phone || !password)
      return res.json({
        ok: false,
        error: "Username, nomor HP & password wajib diisi.",
      });
    // Data harus ADA di Google Spreadsheet; jika tidak/salah -> gagalkan.
    const user = await db.login(
      String(username).trim(),
      String(phone),
      String(password)
    );
    if (!user)
      return res.json({ ok: false, error: "Akun tidak ditemukan di database." });
    const token = makeToken();
    sessions.set(token, {
      username: user.username,
      role: String(user.role || "member").toLowerCase(),
      phone: user.phone,
      expired: user.expired,
      createdAt: Date.now(),
    });
    res.json({
      ok: true,
      token,
      user: {
        username: user.username,
        role: String(user.role || "member").toLowerCase(),
        phone: user.phone,
        expired: user.expired,
      },
    });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.post("/api/logout", auth(false), (req, res) => {
  const token = req.headers["x-zerxs-token"] || "";
  sessions.delete(token);
  res.json({ ok: true });
});

router.get("/api/me", auth(), (req, res) => {
  res.json({ ok: true, user: req.sess });
});

/* ------------------------ GLOBAL INFO --------------------------- */

router.get("/api/global", auth(), async (req, res) => {
  try {
    const st = await db.stats();
    st.botsActiveLocal = botManager.onlineCount();
    res.json({ ok: true, stats: st });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/* -------------------------- PRICE LIST -------------------------- */

router.get("/api/prices", (req, res) => {
  const list = Object.entries(config.roles)
    .filter(([k]) => k !== "developer")
    .map(([key, r]) => ({
      key,
      label: r.label,
      price: r.price,
      permanent: !!r.permanent,
      dailyQuota: Number.isFinite(r.dailyQuota) ? r.dailyQuota : "Unlimited",
      maxBots: Number.isFinite(r.maxBots) ? r.maxBots : "Unlimited",
      benefits: benefitText(key),
    }));
  res.json({ ok: true, prices: list, telegram: config.contacts.telegram });
});

function benefitText(key) {
  const r = roles.getRole(key);
  const cmds = r.commands.includes("*")
    ? key === "business"
      ? "Seluruh perintah kecuali perintah grup"
      : "Seluruh perintah terbuka"
    : r.commands.map((c) => "/" + c).join(", ");
  const b = [
    `Kuota harian ${Number.isFinite(r.dailyQuota) ? r.dailyQuota + "x chat (reset 00.00)" : "UNLIMITED"}`,
    `Tambah bot ${Number.isFinite(r.maxBots) ? "maks " + r.maxBots : "UNLIMITED"}`,
    `Perintah: ${cmds}`,
  ];
  if (r.canChangePrefix) b.push(`Ganti prefiks (${r.allowedPrefixes.join(" ")})`);
  if (r.canGroupCommands) b.push("Akses perintah khusus grup WA");
  if (r.canCsBot)
    b.push(
      "Bisa membuat Bot CS (AI gpt-4o-mini, tanpa prefiks, 100 pesan/hari)"
    );
  if (r.adminPanel) b.push("Akses Panel Admin (buat/hapus akun)");
  return b;
}

/* ----------------------- BOT MANAGER ---------------------------- */

router.get("/api/bots", auth(), async (req, res) => {
  try {
    const all = await db.listBots();
    const mine = all.filter(
      (b) =>
        String(b.owner || "").toLowerCase() ===
        String(req.sess.username).toLowerCase()
    );
    const local = botManager
      .listLocal()
      .filter((l) => l.owner === req.sess.username);
    // gabungkan: utamakan data spreadsheet, tambahkan status runtime lokal
    const merged = mine.map((b) => {
      const rt = local.find(
        (l) =>
          String(l.botNumber).replace(/[^0-9]/g, "") ===
          String(b.botNumber).replace(/[^0-9]/g, "")
      );
      return { ...b, runtime: rt ? rt.status : b.status || "offline" };
    });
    res.json({ ok: true, bots: merged });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.post("/api/bots/add", auth(), async (req, res) => {
  try {
    const { number, name, type } = req.body || {};
    const role = req.sess.role;
    const r = roles.getRole(role);
    const num = botManager.sanitizeNumber(number);
    if (!num) return res.json({ ok: false, error: "Nomor bot tidak valid." });
    if ((type || "biasa") === "cs" && !r.canCsBot)
      return res.json({
        ok: false,
        error: "Bot CS khusus role Business/Founder/Developer.",
      });
    const existing = await db.listBots();
    const countMine = existing.filter(
      (b) =>
        String(b.owner || "").toLowerCase() ===
        String(req.sess.username).toLowerCase()
    ).length;
    if (countMine >= r.maxBots)
      return res.json({
        ok: false,
        error: `Kuota bot role ${r.label} sudah penuh (${r.maxBots}).`,
      });
    await db.addBot({
      botNumber: num,
      botName: name || config.botName,
      type: type || "biasa",
      status: "offline",
      owner: req.sess.username,
    });
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.post("/api/bots/delete", auth(), async (req, res) => {
  try {
    const num = botManager.sanitizeNumber(req.body && req.body.number);
    if (!num) return res.json({ ok: false, error: "Nomor bot tidak valid." });
    const all = await db.listBots();
    const rec = all.find(
      (b) => botManager.sanitizeNumber(b.botNumber) === num
    );
    if (
      rec &&
      String(rec.owner).toLowerCase() !==
        String(req.sess.username).toLowerCase() &&
      !isAdminRole(req.sess.role)
    )
      return res.json({ ok: false, error: "Bukan bot milikmu." });
    botManager.stopBot("u-" + req.sess.username + "-" + num);
    await db.deleteBot(num);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/* --------------------------- PAIRING ---------------------------- */

router.post("/api/pair/start", auth(), async (req, res) => {
  try {
    const { number, name, type } = req.body || {};
    const num = botManager.sanitizeNumber(number);
    if (!num)
      return res.json({ ok: false, error: "Nomor WhatsApp bot tidak valid." });
    const sessionId = "u-" + req.sess.username + "-" + num;
    const bot = await botManager.startPairing({
      sessionId,
      botNumber: num,
      botName: name || config.botName,
      type: type || "biasa",
      owner: req.sess.username,
    });
    db.updateBot(num, { status: "pairing" }).catch(() => {});
    res.json({ ok: true, sessionId, status: bot.status });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.get("/api/pair/qr", auth(), (req, res) => {
  const sid = req.query.sessionId;
  const data = botManager.getQr(sid);
  if (!data) return res.json({ ok: false, error: "Sesi tidak ditemukan." });
  res.json({ ok: true, ...data });
});

/** Perbaikan pairing code: minta kode memakai NOMOR TELEPON. */
router.post("/api/pair/code", auth(), async (req, res) => {
  try {
    const { sessionId, phone } = req.body || {};
    if (!sessionId || !phone)
      return res.json({ ok: false, error: "sessionId & phone wajib diisi." });
    const code = await botManager.requestPairingCode(sessionId, phone);
    res.json({ ok: true, code });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/** SSE streaming status pairing ke web. */
router.get("/api/pair/events", auth(), (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const off = botManager.onEvent((ev) => {
    res.write(`data: ${JSON.stringify(ev)}\n\n`);
  });
  const hb = setInterval(() => res.write(": hb\n\n"), 25000);
  req.on("close", () => {
    clearInterval(hb);
    off();
  });
});

/* ---------------------- PROFIL / PASSWORD ----------------------- */

router.post("/api/change-password", auth(), async (req, res) => {
  try {
    const { oldPass, newPass } = req.body || {};
    if (!oldPass || !newPass || String(newPass).length < 4)
      return res.json({ ok: false, error: "Password baru minimal 4 karakter." });
    await db.changePassword(req.sess.username, oldPass, newPass);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/* ------------------------- ADMIN PANEL -------------------------- */

router.get("/api/admin/users", auth(), async (req, res) => {
  if (!isAdminRole(req.sess.role))
    return res
      .status(403)
      .json({ ok: false, error: "Menu admin khusus Developer/Founder." });
  try {
    const users = await db.listUsers();
    const st = await db.stats();
    res.json({ ok: true, users, stats: st });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.post("/api/admin/create", auth(), async (req, res) => {
  try {
    if (!isAdminRole(req.sess.role))
      return res
        .status(403)
        .json({ ok: false, error: "Menu admin khusus Developer/Founder." });
    const { username, password, role } = req.body || {};
    if (!username || !password || !role)
      return res.json({ ok: false, error: "Semua kolom wajib diisi." });
    if (!config.adminRoleChoices.includes(role))
      return res.json({ ok: false, error: "Role tidak valid." });
    if (role === "developer")
      return res.json({
        ok: false,
        error: "Role developer tidak bisa dibuat dari panel.",
      });
    if (String(req.sess.role).toLowerCase() === "founder") {
      // Founder hanya boleh membuat member trial & admin sesuai ketentuan.
      const founderAllowed = ["member", "admin"];
      if (!founderAllowed.includes(role))
        return res.json({
          ok: false,
          error: "Founder hanya bisa membuat role member & admin.",
        });
    }
    await db.addUser({
      username: String(username).trim(),
      password: String(password),
      phone: "",
      role,
      dibuatOleh: req.sess.username,
    });
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.post("/api/admin/delete", auth(), async (req, res) => {
  try {
    if (!isAdminRole(req.sess.role))
      return res
        .status(403)
        .json({ ok: false, error: "Menu admin khusus Developer/Founder." });
    const r = roles.getRole(req.sess.role);
    if (!r.adminCanDelete)
      return res.json({ ok: false, error: "Role kamu tidak boleh menghapus akun." });
    await db.deleteUser(req.body && req.body.username);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

module.exports = () => router;
