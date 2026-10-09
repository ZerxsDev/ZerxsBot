// ============================================================
// lib/downloader.js - Downloader media (YouTube, TikTok, Pinterest)
// Menggunakan API publik gratis (tikwm.com untuk yt/tiktok,
// dan tikwm all-in-one untuk pinterest). Semua fungsi mengembalikan
// objek { title, source, ... } dengan URL unduhan langsung.
// ============================================================
const axios = require("axios");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Unduh file dari URL buffer */
async function fetchBuffer(url, opts = {}) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: opts.timeout || 120000,
    maxContentLength: 1024 * 1024 * 200,
    headers: { "User-Agent": UA, ...(opts.headers || {}) }
  });
  return Buffer.from(res.data);
}

/**
 * YouTube via tikwm (all-in-one). type: "mp4" | "mp3"
 */
async function ytdl(url, type = "mp4") {
  const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
  const res = await axios.get(api, { headers: { "User-Agent": UA }, timeout: 60000 });
  const d = res.data;
  if (!d || d.code !== 0 || !d.data) {
    throw new Error("Gagal mengambil informasi YouTube: " + (d && d.msg ? d.msg : "respons tidak valid"));
  }
  const info = d.data;
  let downloadUrl = "";
  let title = info.title || "video";
  if (type === "mp3") {
    // tikwm tidak selalu punya mp3 utk youtube -> pakai fields lain bila ada
    downloadUrl = info.mp3 || info.audio || "";
    if (!downloadUrl) {
      // fallback: coba endpoint audio khusus
      const res2 = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&music=1`, { headers: { "User-Agent": UA }, timeout: 60000 });
      if (res2.data && res2.data.code === 0 && res2.data.data && (res2.data.data.music_info || res2.data.data.mp3)) {
        downloadUrl = (res2.data.data.music_info && res2.data.data.music_info.url) || res2.data.data.mp3;
      }
    }
    if (!downloadUrl) throw new Error("Audio MP3 tidak tersedia untuk video ini.");
  } else {
    downloadUrl = info.hd || info.url || "";
    if (!downloadUrl) throw new Error("Video tidak tersedia untuk diunduh.");
  }
  return {
    title,
    duration: info.duration,
    thumb: info.thumb,
    type,
    url: downloadUrl,
    buffer: await fetchBuffer(downloadUrl)
  };
}

/**
 * TikTok via tikwm. type: "mp4" (tanpa watermark) | "mp3" (audio)
 */
async function ttdl(url, type = "mp4") {
  const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
  const res = await axios.get(api, { headers: { "User-Agent": UA }, timeout: 60000 });
  const d = res.data;
  if (!d || d.code !== 0 || !d.data) {
    throw new Error("Gagal mengambil informasi TikTok: " + (d && d.msg ? d.msg : "respons tidak valid"));
  }
  const info = d.data;
  let downloadUrl = "";
  if (type === "mp3") {
    downloadUrl = (info.music_info && info.music_info.url) || info.mp3 || "";
    if (!downloadUrl) throw new Error("Audio tidak tersedia dari TikTok ini.");
  } else {
    downloadUrl = info.hd || info.url || "";
    if (!downloadUrl) throw new Error("Video tidak tersedia dari TikTok ini.");
  }
  return {
    title: info.title || "tiktok",
    author: info.author && info.author.nickname,
    duration: info.duration,
    type,
    url: downloadUrl,
    buffer: await fetchBuffer(downloadUrl)
  };
}

/**
 * Pinterest via tikwm all-in-one support.
 */
async function pintdl(url) {
  const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
  const res = await axios.get(api, { headers: { "User-Agent": UA }, timeout: 60000 });
  const d = res.data;
  if (!d || d.code !== 0 || !d.data) {
    throw new Error("Gagal mengambil media Pinterest: " + (d && d.msg ? d.msg : "URL tidak didukung / tidak valid"));
  }
  const info = d.data;
  // Pinterest gambar tunggal -> data.type "image", atau array imagesList
  if (Array.isArray(info.images_list) && info.images_list.length) {
    const buffers = [];
    for (const u of info.images_list.slice(0, 8)) {
      buffers.push(await fetchBuffer(u));
    }
    return { title: info.title || "pinterest", type: "images", count: buffers.length, buffers };
  }
  const mediaUrl = info.hd || info.url || "";
  if (!mediaUrl) throw new Error("Media Pinterest tidak ditemukan.");
  const isVideo = (info.media_type === "video") || /\.mp4/i.test(mediaUrl);
  return {
    title: info.title || "pinterest",
    type: isVideo ? "video" : "image",
    url: mediaUrl,
    buffer: await fetchBuffer(mediaUrl)
  };
}

module.exports = { ytdl, ttdl, pintdl, fetchBuffer };
