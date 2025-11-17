const axios = require('axios');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const API_BASE = 'https://betadash-api-swordslush-production.up.railway.app/zombie';

const _recent = new Map();
const DEDUPE_MS = 6000;

function now() { return Date.now(); }
async function ensureCacheDir() { try { await fsp.mkdir(CACHE_DIR, { recursive: true }); } catch (e) {} }
function sanitizeFilename(s) { return (s || 'unknown').toString().replace(/[^a-zA-Z0-9-_\.]/g, '_'); }
function contentTypeToExt(ct) {
  if (!ct) return '.png';
  ct = ct.toLowerCase();
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('gif')) return '.gif';
  return '.png';
}

function sendMessageAsync(api, payload, threadID) {
  return new Promise((resolve) => {
    try {
      api.sendMessage(payload, threadID, (err, info) => {
        if (err) return resolve(null);
        return resolve(info || null);
      });
    } catch (e) {
      try {
        const p = api.sendMessage(payload, threadID);
        if (p && typeof p.then === 'function') {
          p.then(info => resolve(info || null)).catch(() => resolve(null));
        } else {
          resolve(null);
        }
      } catch (err) {
        resolve(null);
      }
    }
  });
}

function parseArgs(args = [], messageReply = null) {
  let userid = '';
  if (Array.isArray(args) && args.length > 0) {
    const numericIndex = args.findIndex(a => /^\d+$/.test(a));
    if (numericIndex !== -1) userid = args[numericIndex];
    else if (args.length === 1 && /^\d+$/.test(args[0])) userid = args[0];
  } else if (messageReply) {
    userid = String(messageReply.senderID || '');
  }
  return { userid: (userid || '').toString().trim() };
}

async function fetchZombieImage(userid) {
  const params = new URLSearchParams({ userid: userid || '' });
  const url = `${API_BASE}?${params.toString()}`;

  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: null,
    headers: { 'User-Agent': 'ws3fca-zombie-client', Accept: '*/*', Referer: API_BASE }
  });

  if (res.status < 200 || res.status >= 300) {
    let preview = '';
    try { preview = Buffer.from(res.data || []).toString('utf8').slice(0, 800); } catch (e) { preview = '(binary)'; }
    const err = new Error(`ZOMBIE API returned status ${res.status}: ${preview}`);
    err.status = res.status;
    throw err;
  }

  const ctHeader = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || '';
  const ct = (ctHeader || '').toString().toLowerCase();

  if (ct.startsWith('image/')) {
    return { kind: 'buffer', buffer: Buffer.from(res.data), mime: ct };
  }

  const txt = Buffer.from(res.data || []).toString('utf8');
  try {
    const json = JSON.parse(txt);
    const candidate = json.image || json.url || json.image_url || json.data?.url || json.result || json.response;
    if (candidate && typeof candidate === 'string') {
      if (candidate.startsWith('data:')) {
        const m = candidate.match(/^data:(.+?);base64,(.+)$/);
        if (m) {
          const mime = m[1] || 'image/png';
          const buf = Buffer.from(m[2] || '', 'base64');
          return { kind: 'buffer', buffer: buf, mime };
        }
      } else {
        return { kind: 'url', url: candidate };
      }
    }
    if (json.base64 && typeof json.base64 === 'string') {
      const mime = json.mime || 'image/png';
      const buf = Buffer.from(json.base64, 'base64');
      return { kind: 'buffer', buffer: buf, mime };
    }
    return { kind: 'text', text: txt };
  } catch (e) {
    const match = txt.match(/https?:\/\/[^\s'"]+\.(?:png|jpe?g|gif)(?:\?[^\s'"]*)?/i);
    if (match && match[0]) return { kind: 'url', url: match[0] };
    return { kind: 'text', text: txt };
  }
}

async function downloadUrlToFile(url, outPath) {
  const res = await axios.get(url, {
    responseType: 'stream',
    timeout: 30000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'ws3fca-zombie-client', Referer: API_BASE, Accept: 'image/*,*/*' }
  });
  if (res.status < 200 || res.status >= 300) throw new Error(`Failed to download image, status ${res.status}`);
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outPath);
    res.data.pipe(writer);
    let error = null;
    writer.on('error', (err) => { error = err; writer.close(); reject(err); });
    writer.on('close', () => { if (!error) resolve(); });
  });
  return outPath;
}

module.exports = {
  config: {
    name: 'zombie',
    version: '1.0',
    description: 'Send ZOMBIE edited image from API',
    hasPrefix: false,
    role: 0,
    guide: { en: 'zombie <userid> OR reply with: zombie' }
  },

  async execute({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    // dedupe guard
    try {
      const key = `${threadID}:${messageID}`;
      const prev = _recent.get(key);
      if (prev && now() - prev < DEDUPE_MS) return;
      _recent.set(key, now());
      setTimeout(() => _recent.delete(key), DEDUPE_MS + 50);
    } catch (e) {}

    // initial reaction
    try { if (typeof api.setMessageReaction === 'function') api.setMessageReaction('🧟', messageID, () => {}, true); } catch (e) {}

    const parsed = parseArgs(args, messageReply);
    let { userid } = parsed;
    if (!userid) {
      const usage = 'Usage: zombie <userid>\nExample: zombie 100082770721408\nOr reply to a user message with: zombie';
      await sendMessageAsync(api, usage, threadID);
      return;
    }

    // loading message
    let loadingInfo = null;
    try {
      loadingInfo = await new Promise((resolve) => {
        api.sendMessage(`⏳ Generating ZOMBIE image for ${userid}...`, threadID, (err, info) => {
          if (err) return resolve(null);
          return resolve(info || null);
        });
      });
    } catch (e) { loadingInfo = null; }

    await ensureCacheDir();
    const tmpBase = `zombie_${sanitizeFilename(userid)}_${Date.now()}`;
    let outFilePath = null;

    try {
      const fetched = await fetchZombieImage(userid);

      if (fetched.kind === 'buffer') {
        const ext = contentTypeToExt(fetched.mime);
        outFilePath = path.join(CACHE_DIR, `${tmpBase}${ext}`);
        await fsp.writeFile(outFilePath, fetched.buffer);
      } else if (fetched.kind === 'url') {
        let ext = '.png';
        try { ext = path.extname(new URL(fetched.url).pathname) || '.png'; } catch (e) {}
        outFilePath = path.join(CACHE_DIR, `${tmpBase}${ext}`);
        await downloadUrlToFile(fetched.url, outFilePath);
      } else {
        await sendMessageAsync(api, `⚠️ ZOMBIE API returned no image: ${String(fetched.text || fetched.rawText || '').slice(0, 800)}`, threadID);
        throw new Error('No image from ZOMBIE API');
      }

      const stats = await fsp.stat(outFilePath);
      const MAX_BYTES = 9 * 1024 * 1024;
      if (stats.size > MAX_BYTES) throw new Error('Generated image too large.');

      const headerText = '🧟 𝗭𝗢𝗠𝗕𝗜𝗘 𝗘𝗗𝗜𝗧𝗘𝗗 🧟';

      let sent = false;
      try {
        const payload = { body: headerText, attachment: fs.createReadStream(outFilePath) };
        const info = await sendMessageAsync(api, payload, threadID);
        sent = !!info;
      } catch (e) {
        sent = false;
      }

      if (!sent) {
        try { await sendMessageAsync(api, headerText, threadID); } catch (e) {}
        const ok = await new Promise((resolve) => {
          const stream = fs.createReadStream(outFilePath);
          stream.on('error', (err) => console.error('[zombie] stream error', err));
          api.sendMessage({ body: '', attachment: stream }, threadID, (err) => {
            if (err) { console.error('[zombie] attachment send error', err); return resolve(false); }
            resolve(true);
          });
        });
        if (!ok) throw new Error('Failed to send ZOMBIE image attachment');
      }

      try { if (typeof api.setMessageReaction === 'function') api.setMessageReaction('✅', messageID, () => {}, true); } catch (e) {}

    } catch (err) {
      console.error('[zombie] error:', err && (err.stack || err.message || err));
      try { await sendMessageAsync(api, `⚠️ Failed to generate/send ZOMBIE image: ${err.message || 'unknown'}`, threadID); } catch (e) {}
    } finally {
      try { if (outFilePath && fs.existsSync(outFilePath)) await fsp.unlink(outFilePath); } catch (e) {}
      try {
        if (loadingInfo && loadingInfo.messageID && typeof api.unsendMessage === 'function') {
          api.unsendMessage(loadingInfo.messageID);
        }
      } catch (e) {}
    }
  }
};