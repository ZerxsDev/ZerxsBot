// Bot CS (Customer Service) - mode tanpa prefix, jawab dengan OpenRouter GPT-4o-mini
const ai = require('./ai');

const history = new Map(); // chatId -> messages[]

function greeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return 'Pagi';
  if (h >= 11 && h < 15) return 'Siang';
  if (h >= 15 && h < 18) return 'Sore';
  return 'Malam';
}

async function handleCS(sock, meta, chatId, sender, text) {
  text = String(text || '').trim();
  if (!text) return;

  const key = chatId + '|' + sender;
  if (!history.has(key)) history.set(key, []);
  const hist = history.get(key);

  // sapaan singkat -> balasan baku CS
  const sapaan = /^(halo|hai|p|pp|bang|bunda|kak|sis|gan|min|assalamu'alaikum|assalamualaikum|selamat (pagi|siang|sore|malam))\b/i;
  if (sapaan.test(text) && text.length <= 20) {
    const name = meta.businessName || 'ZerxsBot CS';
    await sock.sendMessage(chatId, { text: `Selamat ${greeting()} kak 🙏\nAda yang bisa kami bantu?\n\nSaya *${name}* - asisten layanan pelanggan resmi.` });
    return;
  }

  const systemPrompt = `Kamu adalah customer service resmi untuk bisnis "${meta.businessName || 'ZerxsStore'}".
Tentang bisnis: ${meta.businessDesc || 'Menjual jasa/produk digital.'}
Daftar produk & harga: ${meta.businessProducts || '(minta detail ke AI umum)'}
Prompt khusus dari pemilik bisnis: ${meta.csPrompt || '(kosong)'}

Aturan gaya bahasa:
1. Bahasa Indonesia baku, sopan, ramah, mudah dimengerti, dan peka terhadap keluhan customer.
2. Selalu awali dengan sapaan waktu ("Selamat pagi/siang/sore/malam kak") bila konteksnya pembuka.
3. Jika customer ingin membeli/menyewa, jelaskan produk dan tampilkan harga secara sopan.
4. Jelaskan apa saja yang dijual beserta harga dan tentang bisnis bila ditanya.
5. Jika pertanyaan di luar bisnis ini, jawab: "Maaf saya tidak bisa membantu karena saya adalah CS khusus menjawab pertanyaan Anda seputar bisnis kami." lalu arahkan kembali ke produk bisnis.
6. Jawab singkat jelas maksimal 400 kata, gunakan emoji secukupnya.`;

  hist.push({ role: 'user', content: text });
  if (hist.length > 20) hist.splice(0, hist.length - 20);

  const msgs = [{ role: 'system', content: systemPrompt }, ...hist];
  const r = await ai.chat(msgs, 'cs');
  if (!r.ok) {
    await sock.sendMessage(chatId, { text: `Mohon maaf kak, sistem kami sedang gangguan. Silakan coba beberapa saat lagi 🙏` });
    return;
  }
  hist.push({ role: 'assistant', content: r.content });
  await sock.sendMessage(chatId, { text: r.content });
}

module.exports = { handleCS, greeting };
