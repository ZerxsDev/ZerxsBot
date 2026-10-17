/**
 * ZerxsBot - OpenRouter AI helper.
 * Bot biasa  : deepseek (config.openrouter.mainModel)
 * Bot CS     : gpt-4o-mini (config.openrouter.csModel)
 */
const axios = require('axios');
const config = require('../../config');

async function chat(messages, { model, temperature = 0.7 } = {}) {
  const res = await axios.post(
    `${config.openrouter.baseUrl}/chat/completions`,
    { model: model || config.openrouter.mainModel, messages, temperature },
    {
      headers: {
        Authorization: `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zerxsbot.local',
        'X-Title': 'ZerxsBot',
      },
      timeout: 120000,
    }
  );
  return res.data.choices?.[0]?.message?.content || '(AI tidak memberikan jawaban)';
}

/** Generate gambar via openrouter image API (jika tersedia), fallback pollinations */
async function generateImage(prompt) {
  try {
    const res = await axios.post(
      `${config.openrouter.baseUrl}/images/generations`,
      { model: config.openrouter.imageModel, prompt, n: 1, size: '1024x1024' },
      {
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 180000,
      }
    );
    const item = res.data?.data?.[0];
    if (item?.url) return { url: item.url };
    if (item?.b64_json) return { b64: item.b64_json };
    throw new Error('no image');
  } catch (e) {
    // Fallback publik gratis
    return { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` };
  }
}

module.exports = { chat, generateImage };
