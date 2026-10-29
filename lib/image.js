/**
 * ZerxsBot - Utilitas gambar & video teks (Jimp + ffmpeg-static).
 * Dipakai oleh /brat, /bratvid, /iqc, /stickertext, /meme.
 */
const Jimp = require("jimp");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const os = require("os");
const fs = require("fs");
const path = require("path");

const LINE_H = 44;

/** Render teks di atas kanvas warna solid, return buffer PNG. */
async function textPng(text, opts = {}) {
  const width = opts.width || 720;
  const height = opts.height || 720;
  const bg = Jimp.cssColorToHex(opts.bg || "#8ee200");
  const fgWhite = opts.fg !== "black";
  const font = await Jimp.loadFont(
    fgWhite ? Jimp.FONT_SANS_32_WHITE : Jimp.FONT_SANS_32_BLACK
  );
  const img = new Jimp(width, height, bg);
  const lines = Jimp.measureTextWrap(font, String(text), width - 60);
  let y = Math.max(20, (height - lines.length * LINE_H) / 2);
  for (const line of lines) {
    img.print(font, 30, y, line);
    y += LINE_H;
  }
  return img.getBufferAsync(Jimp.MIME_PNG);
}

/** Stiker brat: latar hijau (default) atau putih bila opts.white. */
async function bratImage(text, white = false) {
  return textPng(text, {
    bg: white ? "#ffffff" : "#8ee200",
    fg: white ? "black" : "white",
  });
}

/** Stiker teks biasa dengan warna acak estetik. */
async function stickerTextImage(text) {
  const palette = [
    "#1f6feb",
    "#8957e5",
    "#da3633",
    "#238636",
    "#f2cc60",
    "#0d419d",
    "#ff7b72",
    "#3fb950",
  ];
  const bg = palette[Math.floor(Math.random() * palette.length)];
  return textPng(text, { bg, fg: "white" });
}

/** Meme: teks atas + bawah gaya klasik. */
async function memeImage(top, bottom) {
  const width = 720;
  const height = 720;
  const fontW = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const img = new Jimp(width, height, "#111418");
  if (top) img.print(fontW, 20, 20, String(top).toUpperCase());
  if (bottom) img.print(fontW, 20, height - 80, String(bottom).toUpperCase());
  return img.getBufferAsync(Jimp.MIME_PNG);
}

/**
 * IQC (iPhone Chat): balon chat hijau ala iPhone, avatar huruf awal nama.
 */
async function iqcImage(text, name = "You", avatarLetter = "Z") {
  const width = 720;
  const height = 720;
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const img = new Jimp(width, height, "#0b0e14");
  // body iPhone
  const phone = new Jimp(560, 640, "#1c2230");
  img.blit(phone, 80, 40);
  // notch
  const notch = new Jimp(200, 28, "#0b0e14");
  img.blit(notch, 260, 40);
  // header nama
  img.print(font, 320, 90, String(name).slice(0, 14));
  // foto profil (kotak biru dgn huruf awal)
  const ava = new Jimp(64, 64, Jimp.cssColorToHex("#1f6feb"));
  ava.print(
    font,
    18,
    14,
    String(avatarLetter).toUpperCase().slice(0, 1)
  );
  img.blit(ava, 110, 150);
  // balon chat
  const lines = Jimp.measureTextWrap(font, String(text), 360);
  const bubbleH = Math.max(80, lines.length * LINE_H + 40);
  const bubble = new Jimp(440, bubbleH, Jimp.cssColorToHex("#34c759"));
  let y = 20;
  for (const line of lines) {
    bubble.print(font, 24, y, line);
    y += LINE_H;
  }
  img.blit(bubble, 190, 240);
  // jam
  const now = new Date();
  const jam = `${String(now.getHours()).padStart(2, "0")}.${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  img.print(font, 120, 240 + bubbleH + 10, jam);
  return img.getBufferAsync(Jimp.MIME_PNG);
}

/**
 * Brat video: PNG brat dengan garis pemindai bergerak -> MP4 3 detik.
 */
async function bratVideo(text) {
  const base = await bratImage(text, false);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zerxs-brat-"));
  const frameCount = 30; // 10 fps x 3 detik
  for (let i = 0; i < frameCount; i++) {
    const img = await Jimp.read(base);
    const scanY = Math.floor((i / frameCount) * img.bitmap.height);
    for (
      let yy = Math.max(0, scanY - 3);
      yy < Math.min(img.bitmap.height, scanY + 3);
      yy++
    ) {
      for (let xx = 0; xx < img.bitmap.width; xx++) {
        img.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 160), xx, yy);
      }
    }
    await img.writeAsync(
      path.join(tmpDir, `f${String(i).padStart(3, "0")}.png`)
    );
  }
  const out = path.join(tmpDir, "bratvid.mp4");
  await new Promise((resolve, reject) => {
    execFile(
      ffmpegPath,
      [
        "-y",
        "-framerate",
        "10",
        "-i",
        path.join(tmpDir, "f%03d.png"),
        "-vf",
        "scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2",
        "-pix_fmt",
        "yuv420p",
        "-t",
        "3",
        out,
      ],
      (err) => (err ? reject(err) : resolve())
    );
  });
  const buf = fs.readFileSync(out);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return buf;
}

module.exports = {
  textPng,
  bratImage,
  stickerTextImage,
  memeImage,
  iqcImage,
  bratVideo,
};
