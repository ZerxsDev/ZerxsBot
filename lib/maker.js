// Helper bersama untuk command bot: pembuat stiker/brat/qrcode & downloader
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const tmp = (ext = 'png') => path.join(os.tmpdir(), 'zx_' + Date.now() + '_' + Math.floor(Math.random()*1e6) + '.' + ext);

// ---------- ImageMagick-based text image maker ----------
function textToImage(text, opts = {}) {
  const out = tmp(opts.ext || 'png');
  const bg = opts.bg || '#111827';
  const fg = opts.fg || '#ffffff';
  const size = opts.size || 512;
  const fontSize = opts.fontSize || 48;
  const escaped = String(text).replace(/(["\\$`])/g, '\\$1');
  try {
    execSync(`convert -size ${size}x${size} xc:"${bg}" -gravity center -fill "${fg}" -pointsize ${fontSize} -font DejaVu-Sans-Bold -annotate +0+0 "${escaped.replace(/\n/g, '\\n')}" "${out}"`, { stdio: 'ignore', timeout: 15000 });
    return out;
  } catch (e) {
    // fallback tanpa font spesifik
    try {
      execSync(`convert -size ${size}x${size} xc:"${bg}" -gravity center -fill "${fg}" -pointsize ${fontSize} -annotate +0+0 "${escaped.replace(/\n/g, '\\n')}" "${out}"`, { stdio: 'ignore', timeout: 15000 });
      return out;
    } catch (e2) { return null; }
  }
}

// brat-style: latar hijau/blur, teks hitam besar di tengah
function bratImage(text, color = '#7ed957') {
  const out = tmp('png');
  const escaped = String(text).replace(/(["\\$`])/g, '\\$1').slice(0, 120);
  try {
    execSync(`convert -size 512x512 xc:"${color}" -gravity center -fill "#111" -pointsize 60 -font DejaVu-Sans-Bold-weight -annotate +0+0 "${escaped}" "${out}"`, { stdio: 'ignore', timeout: 15000 });
    return out;
  } catch (e) {
    try {
      execSync(`convert -size 512x512 xc:"${color}" -gravity center -fill "#111" -pointsize 60 -annotate +0+0 "${escaped}" "${out}"`, { stdio: 'ignore', timeout: 15000 });
      return out;
    } catch { return null; }
  }
}

// brat video: beberapa frame lalu convert ke mp4/gif
function bratVideo(text, color = '#7ed957') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zxbrat_'));
  const frames = [];
  const colors = [color, '#a3ff7a', '#5fbf3f', color];
  for (let i = 0; i < 4; i++) {
    const f = path.join(dir, `f${i}.png`);
    const escaped = String(text).replace(/(["\\$`])/g, '\\$1').slice(0, 120);
    try {
      execSync(`convert -size 512x512 xc:"${colors[i]}" -gravity center -fill "#111" -pointsize 60 -annotate +0+0 "${escaped}" "${f}"`, { stdio: 'ignore', timeout: 15000 });
      frames.push(f);
    } catch (e) { return null; }
  }
  const out = tmp('mp4');
  try {
    execSync(`ffmpeg -y -framerate 2 -i ${dir}/f%d.png -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${out}"`, { stdio: 'ignore', timeout: 30000 });
    return out;
  } catch (e) {
    const gif = tmp('gif');
    try {
      execSync(`convert -delay 40 -loop 0 ${dir}/f*.png "${gif}"`, { stdio: 'ignore', timeout: 30000 });
      return gif;
    } catch { return null; }
  }
}

// iqc: bubble chat gaya iPhone (green bubble + avatar + nama)
function iqcImage(text, name = 'ZerxsUser') {
  const out = tmp('png');
  const w = 640, h = 320;
  const esc = s => String(s).replace(/(["\\$`])/g, '\\$1').slice(0, 200);
  try {
    execSync(
      `convert -size ${w}x${h} xc:"#ececec" \\
       -fill "#0b8457" -draw "circle 70,80 70,40" \\
       -gravity NorthWest -fill white -pointsize 20 -annotate +45+68 "${esc(name[0]||'Z')}" \\
       -fill "#0b8457" -draw "roundrectangle 120,50 ${w-30},${h-60} 30,30" \\
       -gravity NorthWest -fill white -pointsize 26 -annotate +150+80 "${esc(text)}" \\
       -gravity SouthEast -fill "#666" -pointsize 18 -annotate +0+20 "${esc(name)}" "${out}"`,
      { stdio: 'ignore', timeout: 20000 }
    );
    return out;
  } catch (e) { return textToImage(text, { bg: '#0b8457', fg: '#fff', size: 640 }); }
}

// sticker dari gambar: resize 512 + webp
function toSticker(inputPath) {
  const out = tmp('webp');
  try {
    execSync(`ffmpeg -y -i "${inputPath}" -vf "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -frames:v 1 "${out}"`, { stdio: 'ignore', timeout: 30000 });
    return out;
  } catch (e) {
    try { execSync(`convert "${inputPath}" -resize 512x512 -background none "${out}"`, { stdio: 'ignore', timeout: 30000 }); return out; }
    catch { return null; }
  }
}

// qrcode / barcode memakai qrencode CLI bila ada, jika tidak pakai API qr -- tetap via lib qrcode npm
async function qrPng(text, mode = 'qr') {
  const QRCode = require('qrcode');
  const out = tmp('png');
  await QRCode.toFile(out, String(text), { width: 512, margin: 2 });
  return out;
}

module.exports = { tmp, textToImage, bratImage, bratVideo, iqcImage, toSticker, qrPng };
