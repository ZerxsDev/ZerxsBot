/**
 * ZerxsBot - Utilitas media (stiker, brat, iqc) memakai Jimp.
 */
const { Jimp, loadFont } = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const axios = require('axios');

const TMP = path.join(os.tmpdir(), 'zerxbot-tmp');
fs.ensureDirSync(TMP);

let _font = null;
async function getFont() {
  if (_font) return _font;
  try {
    _font = await loadFont(Jimp.FONT_SANS_64_BLACK);
  } catch (e) { _font = null; }
  return _font;
}

/** Unduh buffer dari URL / base64 */
async function fetchBuffer(urlOrB64) {
  if (/^https?:\/\//i.test(urlOrB64)) {
    const r = await axios.get(urlOrB64, { responseType: 'arraybuffer', timeout: 60000 });
    return Buffer.from(r.data);
  }
  return Buffer.from(urlOrB64, 'base64');
}

/** Buat stiker WA (webp 512x512) dari image buffer */
async function toStickerWebP(imgBuffer) {
  const image = await Jimp.read(imgBuffer);
  image.resize(512, 512);
  return await image.getBuffer('image/webp');
}

/** Render teks putih di atas kanvas warna solid -> PNG buffer */
async function textOnColor(text, bgHex, fgHex = '#ffffff') {
  const size = 512;
  const image = new Jimp(size, size, bgHex);
  const font = await getFont();
  const t = String(text).toUpperCase().slice(0, 150);
  if (font) {
    const canvasW = 462;
    const h = Jimp.measureTextHeight(font, t, canvasW);
    const layer = new Jimp(canvasW, Math.max(h, 64), 0x00000000);
    layer.print({ font, x: 0, y: 0, text: t, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, maxWidth: canvasW }, canvasW, Math.max(h, 64));
    // ubah warna teks hitam -> putih
    layer.scan(0, 0, layer.bitmap.width, layer.bitmap.height, function (x, y, idx) {
      if (this.bitmap.data[idx + 3] > 0) {
        this.bitmap.data[idx] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
    });
    const scale = Math.min((size - 60) / layer.bitmap.width, (size - 60) / layer.bitmap.height, 1);
    layer.resize(Math.round(layer.bitmap.width * scale), Math.round(layer.bitmap.height * scale));
    image.composite(layer, Math.round((size - layer.bitmap.width) / 2), Math.round((size - layer.bitmap.height) / 2));
  }
  return await image.getBuffer('image/png');
}

/** Brat style (hijau khas Charli XCX) */
async function bratImage(text, color = '#87A96B') {
  const png = await textOnColor(text, color);
  const img = await Jimp.read(png);
  img.blur(2);
  return await img.getBuffer('image/png');
}

/** IQC - balon chat ala WhatsApp iPhone */
async function iqcImage(text, name = 'Pengguna') {
  const W = 720, H = 480;
  const image = new Jimp(W, H, '#ECE5DD');
  const font = await getFont();
  const head = new Jimp(W, 90, '#F6F6F6');
  image.composite(head, 0, 0);
  const bw = W - 140, bh = 200;
  const bubble = new Jimp(bw, bh, '#DCF8C6');
  if (font) {
    const t = String(text).slice(0, 200);
    const h = Jimp.measureTextHeight(font, t, bw - 40);
    const layer = new Jimp(bw - 40, Math.max(h, 64), 0x00000000);
    layer.print({ font, x: 0, y: 0, text: t, maxWidth: bw - 40 }, bw - 40, Math.max(h, 64));
    const scale = Math.min((bh - 30) / layer.bitmap.height, 1);
    if (scale < 1) layer.scale(scale);
    bubble.composite(layer, 20, 15);
  }
  image.composite(bubble, 100, 140);
  const av = new Jimp(70, 70, '#2E5BFF');
  image.composite(av, 20, 140);
  if (font) {
    const label = new Jimp(400, 40, 0x00000000);
    label.print({ font, x: 0, y: 0, text: String(name).slice(0, 24) }, 400, 40);
    label.scale(0.4);
    image.composite(label, 100, 110);
  }
  return await image.getBuffer('image/png');
}

/** Simpan buffer ke file tmp */
async function saveTmp(buffer, ext = '.jpg') {
  const p = path.join(TMP, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  await fs.writeFile(p, buffer);
  return p;
}

module.exports = {
  toStickerWebP, textOnColor, bratImage, iqcImage, fetchBuffer, saveTmp, Jimp,
};
