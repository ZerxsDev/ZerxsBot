// ============================================================
// lib/maker.js - Pembuat media: stiker, brat, iqc, stickertext,
// qrcode/barcode, view-once. Memakai sharp + ffmpeg-static.
// ============================================================
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const axios = require("axios");
const sharp = require("sharp");
const ffmpegPath = require("ffmpeg-static");
const { spawn } = require("child_process");

const TMP = path.join(os.tmpdir(), "zerxsbot");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function tmpFile(ext) {
  return path.join(TMP, crypto.randomBytes(8).toString("hex") + ext);
}

/** Jalankan ffmpeg dengan argumen */
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error("ffmpeg-static tidak tersedia"));
    const proc = spawn(ffmpegPath, ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", d => (err += d.toString()));
    proc.on("error", reject);
    proc.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error("ffmpeg exit " + code + ": " + err.slice(-400)));
    });
  });
}

/** Unduh gambar dari URL / buffer -> buffer */
async function toImageBuffer(media) {
  if (Buffer.isBuffer(media)) return media;
  if (typeof media === "string" && /^https?:\/\//.test(media)) {
    const res = await axios.get(media, { responseType: "arraybuffer", timeout: 30000 });
    return Buffer.from(res.data);
  }
  throw new Error("Media tidak valid");
}

/**
 * Buat stiker WhatsApp WebP dari gambar (buffer/path/url).
 */
async function makeSticker(imageInput) {
  const buf = await toImageBuffer(imageInput);
  const out = tmpFile(".webp");
  await sharp(buf)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toFile(out);
  const data = fs.readFileSync(out);
  fs.unlinkSync(out);
  return data;
}

/**
 * Render teks ke PNG transparan dengan canvas sharp (SVG).
 */
async function textToPng(text, opts = {}) {
  const width = opts.width || 700;
  const fontSize = opts.fontSize || 40;
  const fontColor = opts.fontColor || "#ffffff";
  const stroke = opts.stroke || "#000000";
  // wrap manual ~ per karakter
  const maxChars = Math.floor((width - 60) / (fontSize * 0.55));
  const lines = [];
  for (const raw of String(text).split("\n")) {
    let cur = "";
    for (const word of raw.split(" ")) {
      if ((cur + " " + word).trim().length > maxChars) { lines.push(cur.trim()); cur = word; }
      else cur = (cur + " " + word).trim();
    }
    lines.push(cur.trim());
  }
  const lineH = Math.round(fontSize * 1.25);
  const height = Math.max(lineH * lines.length + 60, 120);
  const svgLines = lines
    .map((ln, i) => {
      const esc = ln.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const y = 40 + (i + 0.8) * lineH;
      return `<text x="50%" y="${y}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${fontColor}" stroke="${stroke}" stroke-width="2" paint-order="stroke">${esc}</text>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${opts.background ? `<rect width="100%" height="100%" fill="${opts.background}"/>` : ""}
    ${svgLines}
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, width, height };
}

/**
 * /stickertext — stiker teks bergaya bulat putih klasik.
 */
async function stickerText(text) {
  const { png } = await textToPng(text, {
    width: 640,
    fontSize: 46,
    fontColor: "#000000",
    stroke: "#ffffff",
    background: "rgba(255,255,255,0)"
  });
  const out = tmpFile(".webp");
  await sharp(png)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 80 })
    .toFile(out);
  const data = fs.readFileSync(out);
  fs.unlinkSync(out);
  return data;
}

/**
 * /brat — stiker gambar "Brat" statis (latar hijau, teks hitam blur tipis).
 */
async function brat(text, colorHex = "#8aceb7") {
  const { png } = await textToPng(text, {
    width: 720,
    fontSize: 52,
    fontColor: "#111111",
    stroke: "none",
    background: colorHex
  });
  const blurred = await sharp(png)
    .blur(1.2)
    .resize(512, 512, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();
  return blurred;
}

/**
 * /bratvid — video Brat animasi (teks berkedip/blur bergerak) -> mp4.
 */
async function bratVideo(text, seconds = 5, colorHex = "#8aceb7") {
  const framesDir = tmpFile("");
  fs.mkdirSync(framesDir, { recursive: true });
  const fps = 15;
  const totalFrames = fps * seconds;
  const { png } = await textToPng(text, {
    width: 720,
    fontSize: 52,
    fontColor: "#111111",
    stroke: "none",
    background: colorHex
  });
  for (let i = 0; i < totalFrames; i++) {
    const blur = 0.5 + Math.abs(Math.sin((i / totalFrames) * Math.PI * 4)) * 3.5;
    const frame = await sharp(png)
      .blur(blur)
      .resize(512, 512, { fit: "cover" })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(framesDir, `f_${String(i).padStart(4, "0")}.png`), frame);
  }
  const out = tmpFile(".mp4");
  await runFFmpeg([
    "-framerate", String(fps),
    "-i", path.join(framesDir, "f_%04d.png"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-vf", "scale=512:512",
    "-t", String(seconds),
    out
  ]);
  // bersihkan frame
  fs.rmSync(framesDir, { recursive: true, force: true });
  const data = fs.readFileSync(out);
  fs.unlinkSync(out);
  return data;
}

/**
 * /iqc — iPhone chat quote: balon chat ala WhatsApp di iPhone.
 * Menghasilkan PNG siap jadi stiker.
 */
async function iphoneChatQuote(text, opts = {}) {
  const username = opts.username || "Anda";
  const avatarUrl = opts.avatarUrl || null;
  const time = opts.time || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  let avatarSvg = `<circle cx="45" cy="45" r="28" fill="#9ba3af"/><text x="45" y="55" font-size="26" text-anchor="middle" fill="#fff" font-family="Arial">${(username[0] || "U").toUpperCase()}</text>`;
  if (avatarUrl) {
    try {
      const buf = await toImageBuffer(avatarUrl);
      const av = await sharp(buf).resize(56, 56).png().toBuffer();
      avatarSvg = `<image x="17" y="17" width="56" height="56" clip-path="url(#circ)" href="data:image/png;base64,${av.toString("base64")}"/>`;
    } catch (_) { /* pakai default inisial */ }
  }

  const { png: textPng } = await textToPng(text, {
    width: 460,
    fontSize: 30,
    fontColor: "#ffffff",
    stroke: "none"
  });
  // tempel teks ke dalam balon hijau
  const balloonW = 500;
  const balloonH = Math.max(90, (await sharp(textPng).metadata()).height + 10);
  const balloonBase = sharp({
    create: { width: balloonW, height: balloonH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  });
  const roundedSvg = `<svg width="${balloonW}" height="${balloonH}"><defs><filter id="r"><feFlood flood-color="#5bbf4f" result="c"/><feComposite in="c" operator="in"/></filter></defs><rect x="0" y="0" width="${balloonW - 18}" height="${balloonH}" rx="20" ry="20" fill="#5bbf4f"/><path d="M ${balloonW - 18} ${balloonH / 2 - 12} L ${balloonW} ${balloonH / 2} L ${balloonW - 18} ${balloonH / 2 + 12} Z" fill="#5bbf4f"/></svg>`;
  const balloon = await balloonBase
    .composite([
      { input: Buffer.from(roundedSvg), top: 0, left: 0 },
      { input: textPng, top: 5, left: 20 }
    ])
    .png()
    .toBuffer();

  const W = 720;
  const H = balloonH + 150;
  const bgSvg = `<svg width="${W}" height="${H}">
    <defs><clipPath id="circ"><circle cx="45" cy="45" r="28"/></clipPath></defs>
    <rect width="${W}" height="${H}" fill="#ededed"/>
    <rect width="${W}" height="90" fill="#f6f7f9"/>
    <text x="${W / 2}" y="38" font-family="-apple-system, Helvetica, Arial" font-size="17" font-weight="bold" fill="#0b141a" text-anchor="middle">${escapeXml(username)}</text>
    <text x="${W / 2}" y="60" font-family="Helvetica, Arial" font-size="12" fill="#8a8f98" text-anchor="middle">WhatsApp • iPhone</text>
    <line x1="0" y1="90" x2="${W}" y2="90" stroke="#dcdcdc" stroke-width="1"/>
  </svg>`;

  const composed = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: Buffer.from(`<svg width="90" height="90">${avatarSvg}</svg>`), top: H - 100, left: 12 },
      { input: balloon, top: 105, left: W - balloonW - 20 }
    ])
    .png()
    .toBuffer();

  // jadikan webp stiker
  const out = tmpFile(".webp");
  await sharp(composed).resize(640, undefined, { fit: "inside" }).webp({ quality: 85 }).toFile(out);
  const data = fs.readFileSync(out);
  fs.unlinkSync(out);
  return data;
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

module.exports = {
  makeSticker,
  stickerText,
  brat,
  bratVideo,
  iphoneChatQuote,
  textToPng,
  runFFmpeg,
  tmpFile,
  toImageBuffer
};
