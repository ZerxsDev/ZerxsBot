// ============================================================
// lib/openrouter.js - AI System (OpenRouter API)
// ============================================================
const axios = require("axios");
const config = require("../config");

let keyIndex = 0;
function nextKey() {
  const keys = config.openrouter.apiKeys.filter(k => k && !k.includes("GANTI_DENGAN"));
  if (!keys.length) {
    throw new Error("API key OpenRouter belum dikonfigurasi. Edit config.js -> openrouter.apiKeys");
  }
  const k = keys[keyIndex % keys.length];
  keyIndex++;
  return k;
}

/**
 * Chat completion teks (untuk /ai dan /coder)
 * @param {string} prompt
 * @param {object} opts { system, model, maxTokens }
 */
async function chat(prompt, opts = {}) {
  const model = opts.model || config.openrouter.textModel;
  const res = await axios.post(
    `${config.openrouter.baseUrl}/chat/completions`,
    {
      model,
      messages: [
        ...(opts.system ? [{ role: "system", content: opts.system }] : []),
        { role: "user", content: prompt }
      ],
      max_tokens: opts.maxTokens || 1500,
      temperature: opts.temperature ?? 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${nextKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": config.openrouter.referer,
        "X-Title": config.openrouter.title
      },
      timeout: 90000
    }
  );
  const choice = res.data && res.data.choices && res.data.choices[0];
  if (!choice || !choice.message) {
    throw new Error("Respons AI kosong: " + JSON.stringify(res.data).slice(0, 300));
  }
  return choice.message.content.trim();
}

/**
 * Pembuatan gambar dari AI (untuk /imageai).
 * Menggunakan endpoint images OpenRouter; jika model image tidak tersedia
 * via /images, fallback ke modalitas image pada chat completions.
 * Mengembalikan buffer gambar (jpg/png).
 */
async function generateImage(prompt) {
  const key = nextKey();
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": config.openrouter.referer,
    "X-Title": config.openrouter.title
  };

  // Percobaan 1: endpoint /images/generations
  try {
    const res = await axios.post(
      `${config.openrouter.baseUrl}/images/generations`,
      {
        model: config.openrouter.imageModel,
        prompt,
        n: 1,
        response_format: "b64_json"
      },
      { headers, timeout: 120000 }
    );
    const item = res.data && res.data.data && res.data.data[0];
    if (item && item.b64_json) return Buffer.from(item.b64_json, "base64");
    if (item && item.url) {
      const img = await axios.get(item.url, { responseType: "arraybuffer", timeout: 60000 });
      return Buffer.from(img.data);
    }
  } catch (e1) {
    // lanjut percobaan 2
  }

  // Percobaan 2: chat completions dengan modalitas image
  const res2 = await axios.post(
    `${config.openrouter.baseUrl}/chat/completions`,
    {
      model: config.openrouter.imageModel,
      messages: [{ role: "user", content: `Generate an image: ${prompt}` }],
      modalities: ["image", "text"]
    },
    { headers: { ...headers, Authorization: `Bearer ${key}` }, timeout: 120000 }
  );
  const msg = res2.data?.choices?.[0]?.message;
  const imgs = msg?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const urlOrB64 = imgs[0]?.image_url?.url || imgs[0]?.url || "";
    if (urlOrB64.startsWith("data:")) {
      const b64 = urlOrB64.split(",")[1];
      return Buffer.from(b64, "base64");
    }
    if (urlOrB64.startsWith("http")) {
      const img = await axios.get(urlOrB64, { responseType: "arraybuffer", timeout: 60000 });
      return Buffer.from(img.data);
    }
  }
  throw new Error("Gagal membuat gambar AI. Pastikan model image di config.js mendukung generasi gambar.");
}

module.exports = { chat, generateImage };
