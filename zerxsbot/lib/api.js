// ============================================================
// lib/api.js - Utilitas API eksternal (translate, kurs, quotes,
// meme, subdomain, whois, ipinfo, hash, biner)
// ============================================================
const axios = require("axios");
const crypto = require("crypto");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";

/** ---------- TRANSLATE (endpoint gratis Google Translate web) ---------- */
async function translate(text, from, to) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 20000 });
  const data = res.data;
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("Respons translate tidak valid");
  let out = "";
  for (const seg of data[0]) {
    if (seg && seg[0]) out += seg[0];
  }
  return { translated: out.trim(), detectedLang: data[2], from, to };
}

/** ---------- KURS MATA UANG ---------- */
const CURRENCY_COUNTRY = {
  usd: "US", eur: "EU", gbp: "GB", idr: "ID", myr: "MY", sgid: "SG", sgd: "SG",
  aud: "AU", jpy: "JP", cny: "CN", inr: "IN", krw: "KR", bht: "BH", aed: "AE",
  sar: "SA", thb: "TH", php: "PH", vnd: "VN", bnd: "BN", nzd: "NZ", chf: "CH"
};

async function kurs(cur1, cur2) {
  cur1 = String(cur1).toUpperCase();
  cur2 = String(cur2).toUpperCase();
  // Ambil nilai tukar terhadap USD lalu hitung silang
  const res = await axios.get(`https://open.er-api.com/v6/latest/${cur1}`, { headers: { "User-Agent": UA }, timeout: 20000 });
  if (!res.data || res.data.result !== "success") throw new Error("Kode mata uang tidak valid: " + cur1);
  const rates = res.data.rates;
  if (!rates[cur2]) throw new Error("Kode mata uang tujuan tidak valid: " + cur2);
  const value = rates[cur2];
  return {
    from: cur1,
    to: cur2,
    rate: value,
    date: res.data.time_last_update_utc,
    examples: [1, 10, 100].map(n => `${n} ${cur1} = ${(n * value).toLocaleString("id-ID", { maximumFractionDigits: 2 })} ${cur2}`)
  };
}

/** ---------- QUOTES RANDOM ---------- */
async function randomQuote() {
  try {
    const res = await axios.get("https://zenquotes.io/api/random", { headers: { "User-Agent": UA }, timeout: 15000 });
    if (Array.isArray(res.data) && res.data[0]) {
      return { quote: res.data[0].q, author: res.data[0].a, source: "ZenQuotes" };
    }
  } catch (_) { /* fallback di bawah */ }
  const res2 = await axios.get("https://api.quotable.io/random", { headers: { "User-Agent": UA }, timeout: 15000 });
  return { quote: res2.data.content, author: res2.data.author, source: "Quotable" };
}

/** ---------- MEME RANDOM ---------- */
async function randomMeme() {
  const res = await axios.get("https://meme-api.com/gimme", { headers: { "User-Agent": UA }, timeout: 20000 });
  const d = res.data;
  if (!d || !d.url) throw new Error("Gagal mengambil meme");
  return {
    title: d.title,
    subreddit: d.subreddit,
    author: d.author,
    ups: d.ups,
    nsfw: d.nsfw,
    url: d.url,
    postLink: d.postLink
  };
}

/** ---------- HASH ---------- */
function hashText(algo, text) {
  const a = String(algo).toLowerCase();
  if (a === "md5") return { algo: "MD5", hash: crypto.createHash("md5").update(text).digest("hex") };
  if (a === "sha256") return { algo: "SHA-256", hash: crypto.createHash("sha256").update(text).digest("hex") };
  throw new Error("Algoritma tidak didukung. Pakai MD5 atau SHA256.");
}

/** ---------- BINER ---------- */
function toBinary(text) {
  return String(text)
    .split("")
    .map(c => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
}
function fromBinary(bin) {
  return String(bin)
    .trim()
    .split(/\s+/)
    .map(b => String.fromCharCode(parseInt(b, 2)))
    .join("");
}

/** ---------- SUBDOMAIN (crt.sh) ---------- */
async function subdomains(domain) {
  domain = String(domain).replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  const res = await axios.get(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {
    headers: { "User-Agent": UA },
    timeout: 45000
  });
  const set = new Set();
  if (Array.isArray(res.data)) {
    for (const row of res.data) {
      const names = String(row.name_value || "").split("\n");
      for (const n of names) {
        const host = n.trim().toLowerCase();
        if (host && !host.includes("*") && (host === domain || host.endsWith("." + domain))) {
          set.add(host);
        }
      }
    }
  }
  const list = Array.from(set).sort();
  return { domain, count: list.length, subdomains: list.slice(0, 200) };
}

/** ---------- WHOIS (rdap.org) ---------- */
async function whois(domain) {
  domain = String(domain).replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();
  const res = await axios.get(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    timeout: 30000,
    validateStatus: () => true
  });
  if (res.status !== 200) throw new Error("Domain tidak ditemukan / RDAP error (" + res.status + ")");
  const d = res.data;
  const events = (d.events || []).map(e => `${e.action}: ${e.date}`);
  const registrar = ((d.entities || [])[0] || {});
  let registrarName = "";
  if (registrar.vcardArray && Array.isArray(registrar.vcardArray[1])) {
    const fn = registrar.vcardArray[1].find(v => v[0] === "fn");
    if (fn) registrarName = fn[3];
  }
  return {
    domain: d.ldhName || domain,
    status: (d.status || []).join(", "),
    events,
    registrar: registrarName || "-",
    nameservers: (d.nameservers || []).map(ns => ns.ldhName),
    handle: d.handle || "-"
  };
}

/** ---------- IP INFO (ip-api.com) ---------- */
async function ipinfo(ip) {
  ip = String(ip).trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/.test(ip)) throw new Error("Format alamat IP tidak valid");
  const res = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,city,zip,lat,lon,timezone,isp,org,as,query`, {
    headers: { "User-Agent": UA },
    timeout: 20000
  });
  const d = res.data;
  if (d.status !== "success") throw new Error(d.message || "IP tidak dapat dilacak");
  return d;
}

module.exports = { translate, kurs, randomQuote, randomMeme, hashText, toBinary, fromBinary, subdomains, whois, ipinfo };
