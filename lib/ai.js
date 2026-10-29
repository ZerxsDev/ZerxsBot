/**
 * ZerxsBot - Helper AI (OpenRouter). Kunci API hanya ada di config.js.
 */
const axios = require("axios");
const config = require("../config");

const orClient = axios.create({
  baseURL: config.openrouter.baseUrl,
  timeout: 60000,
  headers: {
    Authorization: `Bearer ${config.openrouter.apiKey}`,
    "HTTP-Referer": config.openrouter.referer,
    "X-Title": config.openrouter.title,
    "Content-Type": "application/json",
  },
});

/**
 * Chat completion biasa (teks).
 * @param {Array<{role:string,content:string}>} messages
 * @param {string} model override model (default deepseek untuk bot biasa)
 */
async function chat(messages, model) {
  const res = await orClient.post("/chat/completions", {
    model: model || config.openrouter.modelAi,
    messages,
    temperature: 0.7,
  });
  const choice = res.data && res.data.choices && res.data.choices[0];
  if (!choice) throw new Error("Respons AI kosong");
  return choice.message.content;
}

/** Jawab pertanyaan umum user ke bot biasa (/ai). */
async function askAI(prompt, extraSystem) {
  const sys =
    (extraSystem ? extraSystem + "\n" : "") +
    "Kamu adalah ZerxsBot, asisten WhatsApp berbahasa Indonesia yang santai, ringkas, dan membantu. " +
    "Jawab dengan format ringan cocok untuk chat WhatsApp (maks 1000 karakter bila memungkinkan).";
  return chat([
    { role: "system", content: sys },
    { role: "user", content: prompt },
  ]);
}

/** Bot programmer (/coder). */
async function askCoder(prompt) {
  const sys =
    "Kamu adalah ZerxsBot Coder. Tulis kode program lengkap, rapi, dan siap pakai sesuai permintaan user. " +
    "Sertakan penjelasan singkat lalu blok kode. Bahasa kode ditandai dengan benar.";
  return chat([
    { role: "system", content: sys },
    { role: "user", content: prompt },
  ]);
}

/**
 * Generate gambar (/imageai) via OpenRouter image API.
 * Mengembalikan buffer JPEG/PNG.
 */
async function generateImage(prompt) {
  const res = await orClient.post(
    "/images/generations",
    {
      model: "openai/dall-e-3",
      prompt,
      response_format: "b64_json",
      size: "1024x1024",
    },
    { timeout: 120000 }
  );
  const item = res.data && res.data.data && res.data.data[0];
  if (item && item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item && item.url) {
    const img = await axios.get(item.url, { responseType: "arraybuffer" });
    return Buffer.from(img.data);
  }
  throw new Error("Gagal membuat gambar dari AI");
}

/**
 * Bot CS (customer service) - gpt-4o-mini, tanpa prefiks.
 * @param {object} biz info bisnis { nama, deskripsi, produk:[{nama,harga}], jam }
 * @param {Array} history riwayat percakapan singkat
 * @param {string} message pesan customer
 */
async function askCS(biz, history, message) {
  const now = new Date();
  const h = now.getHours();
  const waktu =
    h >= 4 && h < 11
      ? "Pagi"
      : h >= 11 && h < 15
        ? "Siang"
        : h >= 15 && h < 18
          ? "Sore"
          : "Malam";
  const productList = (biz.produk || [])
    .map((p) => `- ${p.nama}: Rp${p.harga}`)
    .join("\n");
  const sys =
    `Kamu adalah customer service resmi bisnis "${biz.nama}".\n` +
    `Tentang bisnis: ${biz.deskripsi || "tidak ada deskripsi"}\n` +
    `Daftar produk/jasa & harga:\n${productList || "(sebutkan sesuai deskripsi bisnis)"}\n` +
    (biz.promptCustom ? `Instruksi tambahan pemilik: ${biz.promptCustom}\n` : "") +
    `Aturan menjawab:\n` +
    `1. Bahasa baku, sopan, ramah, mudah dimengerti, pahami keluhan customer.\n` +
    `2. Sapa seperlunya; saat sapaan pertama gunakan "Selamat ${waktu} Kak, ada yang bisa kami bantu?".\n` +
    `3. Jika customer ingin membeli/menyewa, tampilkan harga secara sopan.\n` +
    `4. Jelaskan produk dan harga bila ditanya.\n` +
    `5. Jika topik di luar bisnis, jawab: "Maaf saya tidak bisa membantu karena saya adalah CS khusus menjawab pertanyaan anda seputar bisnis kami."\n` +
    `6. Jawaban singkat maksimal 600 karakter, tanpa markdown.`;
  const msgs = [{ role: "system", content: sys }];
  (history || []).slice(-8).forEach((m) => msgs.push(m));
  msgs.push({ role: "user", content: message });
  return chat(msgs, config.openrouter.modelCs);
}

module.exports = { chat, askAI, askCoder, generateImage, askCS };
