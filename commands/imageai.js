const config = require('../config');
module.exports = {
  name: 'imageai', desc: 'Buat gambar dari AI', usage: '/imageai [prompt]',
  async exec(ctx) {
    const prompt = ctx.args.join(' ').trim();
    if (!prompt) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}imageai kucing astronaut` });
    const key = config.openrouter.apiKey;
    if (!key || key.includes('GANTI_DENGAN')) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ API key OpenRouter belum diatur di config.js' });
    try {
      const res = await fetch(config.openrouter.baseUrl + '/images/generations', {
        method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
      });
      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json || data?.data?.[0]?.url;
      if (!b64) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Gagal membuat gambar: ' + (data.error?.message || 'tidak ada hasil') });
      const image = b64.startsWith('http') ? Buffer.from(await (await fetch(b64)).arrayBuffer()) : Buffer.from(b64, 'base64');
      await ctx.sock.sendMessage(ctx.chatId, { image, caption: '🖼️ ' + prompt });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};
