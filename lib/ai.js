// OpenRouter AI helper (DeepSeek utk bot biasa, GPT-4o-mini utk bot CS)
const config = require('../config');

async function chat(messages, modelKey = 'ai') {
  const key = config.openrouter.apiKey;
  if (!key || key.includes('GANTI_DENGAN')) {
    return { ok: false, message: 'API key OpenRouter belum diatur di config.js' };
  }
  const model = config.openrouter.model[modelKey] || config.openrouter.model.ai;
  try {
    const res = await fetch(config.openrouter.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: 1200 }),
    });
    const data = await res.json();
    if (data.error) return { ok: false, message: data.error.message || 'AI error' };
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) return { ok: false, message: 'AI tidak mengembalikan respons' };
    return { ok: true, content };
  } catch (e) {
    return { ok: false, message: 'Gagal memanggil AI: ' + e.message };
  }
}

module.exports = { chat };
