const axios = require('axios');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const API_BASE = 'https://betadash-api-swordslush-production.up.railway.app/hack';

// small dedupe window
const _recent = new Map();
const DEDUPE_MS = 8000;

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

/** Convert ASCII letters/numbers to Mathematical Bold Unicode (best-effort) */
function toUnicodeBold(str) {
  if (!str) return '';
  let out = '';
  for (const ch of String(str)) {
    const code = ch.charCodeAt(0);
    if (code >= 0x41 && code <= 0x5A) { // A-Z
      out += String.fromCodePoint(0x1D400 + (code - 0x41));
    } else if (code >= 0x61 && code <= 0x7A) { // a-z
      out += String.fromCodePoint(0x1D41A + (code - 0x61));
    } else if (code >= 0x30 && code <= 0x39) { // 0-9
      out += String.fromCodePoint(0x1D7CE + (code - 0x30));
    } else {
      out += ch;
    }
  }
  return out;
}

/** Flexible sendMessage wrapper for callback-style or promise-style APIs */
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

/** Parse arguments or replied message into uid + name */
function parseArgs(args = [], messageReply = null) {
  let uid = '';
  let name = '';
  if (Array.isArray(args) && args.length > 0) {
    if (/^\d+$/.test(args[0])) {
      uid = args[0];
      name = args.slice(1).join(' ').trim();
    } else if (/^\d+$/.test(args[args.length - 1])) {
      uid = args[args.length - 1];
      name = args.slice(0, -1).join(' ').trim();
    } else {
      name = args.join(' ').trim();
    }
  } else if (messageReply) {
    uid = String(messageReply.senderID || '');
    name = messageReply.senderName || messageReply.senderID || '';
  }
  return { uid: (uid || '').toString().trim(), name: (name || '').trim() };
}

/** Call API and normalize response */
async function fetchGeneratedImage(nameToSendRaw, uid) {
  const params = new URLSearchParams({ name: nameToSendRaw, uid: uid || '' });
  const url = `${API_BASE}?${params.toString()}`;

  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 35000,
    maxRedirects: 5,
    validateStatus: null,
    headers: { 'User-Agent': 'ws3fca-hack-client', Accept: '*/*', Referer: API_BASE }
  });

  if (res.status < 200 || res.status >= 300) {
    let preview = '';
    try { preview = Buffer.from(res.data || []).toString('utf8').slice(0, 800); } catch (e) { preview = '(binary)'; }
    const err = new Error(`API returned status ${res.status}: ${preview}`);
    err.status = res.status;
    throw err;
  }

  const ctHeader = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || '';
  const ct = (ctHeader || '').toString().toLowerCase();

  if (ct.startsWith('image/')) {
    // direct image bytes (no metadata)
    return { kind: 'buffer', buffer: Buffer.from(res.data), mime: ct, json: null };
  }

  // treat as text/JSON
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
          return { kind: 'buffer', buffer: buf, mime, json };
        }
      } else {
        return { kind: 'url', url: candidate, json };
      }
    }
    if (json.base64 && typeof json.base64 === 'string') {
      const mime = json.mime || 'image/png';
      const buf = Buffer.from(json.base64, 'base64');
      return { kind: 'buffer', buffer: buf, mime, json };
    }
    // no image but return json for metadata
    return { kind: 'json', json, rawText: txt };
  } catch (e) {
    const match = txt.match(/https?:\/\/[^\s'"]+\.(?:png|jpe?g|gif)(?:\?[^\s'"]*)?/i);
    if (match && match[0]) return { kind: 'url', url: match[0], rawText: txt };
    return { kind: 'text', text: txt, rawText: txt };
  }
}

/** Download URL to file */
async function downloadUrlToFile(url, outPath) {
  const res = await axios.get(url, {
    responseType: 'stream',
    timeout: 35000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'ws3fca-hack-client', Referer: API_BASE, Accept: 'image/*,*/*' }
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

/** Extract common metadata fields from JSON */
function extractStatusFields(json) {
  if (!json || typeof json !== 'object') return {};
  const durationKeys = ['durations', 'duration', 'time', 'elapsed', 'latency'];
  const statusKeys = ['status', 'state', 'result', 'activity'];
  const securityKeys = ['security', 'security_level', 'strength', 'vulnerability'];

  let durations = null, status = null, security = null;
  for (const k of durationKeys) { if (k in json && json[k] != null) { durations = String(json[k]); break; } }
  if (durations && /^\d+(\.\d+)?$/.test(durations)) durations = `${durations}s`;

  for (const k of statusKeys) { if (k in json && json[k] != null) { status = String(json[k]); break; } }
  for (const k of securityKeys) { if (k in json && json[k] != null) { security = String(json[k]); break; } }

  return { durations, status, security };
}

module.exports = {
  config: {
    name: 'hack',
    version: '3.0',
    description: 'Single stylized text + image. Name/UID dynamic. Dynamic Durations/Status/Security when available.',
    hasPrefix: false,
    role: 0,
    guide: { en: 'hack <uid> [name] OR hack <name> <uid> OR reply with: hack' }
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

    // initial reaction (non-fatal)
    try { if (typeof api.setMessageReaction === 'function') api.setMessageReaction('👨‍💻', messageID, () => {}, true); } catch (e) {}

    // parse args
    const parsed = parseArgs(args, messageReply);
    let { uid, name } = parsed;
    if ((!uid || uid === '') && (!name || name === '')) {
      const usage = 'Usage: hack <uid> [name]\nExample: hack 123456778***** Juan Dela Cruz\nOr reply to a user message with: hack';
      await sendMessageAsync(api, usage, threadID);
      return;
    }
    const nameToSendRaw = (name && name.trim()) ? name.trim() : (uid || 'Unknown');
    const uidToShow = uid || '';

    // loading message (we'll unsend later)
    let loadingInfo = null;
    try {
      loadingInfo = await new Promise((resolve) => {
        api.sendMessage(`⏳ Account Hacking for ${nameToSendRaw}${uidToShow ? ` (${uidToShow})` : ''}...`, threadID, (err, info) => {
          if (err) return resolve(null);
          return resolve(info || null);
        });
      });
    } catch (e) { loadingInfo = null; }

    await ensureCacheDir();
    const tmpBase = `hack_${sanitizeFilename(uidToShow || nameToSendRaw)}_${Date.now()}`;
    let outFilePath = null;

    try {
      // 1) fetch generated image (or URL or JSON)
      const fetched = await fetchGeneratedImage(nameToSendRaw, uidToShow);

      // metadata defaults
      let durationsVal = null, statusVal = null, securityVal = null;
      if (fetched.json) {
        const extracted = extractStatusFields(fetched.json);
        durationsVal = extracted.durations || null;
        statusVal = extracted.status || null;
        securityVal = extracted.security || null;
      }

      // optional quick JSON probe if no metadata found (non-fatal)
      if ((!durationsVal && !statusVal && !securityVal)) {
        try {
          const metaRes = await axios.get(`${API_BASE}?${new URLSearchParams({ name: nameToSendRaw, uid: uidToShow }).toString()}`, {
            responseType: 'json',
            timeout: 6000,
            headers: { 'User-Agent': 'ws3fca-hack-client', Accept: 'application/json', Referer: API_BASE },
            validateStatus: (s) => s >= 200 && s < 500
          });
          if (metaRes && metaRes.data && typeof metaRes.data === 'object') {
            const extracted = extractStatusFields(metaRes.data);
            durationsVal = durationsVal || extracted.durations || null;
            statusVal = statusVal || extracted.status || null;
            securityVal = securityVal || extracted.security || null;
          }
        } catch (e) { /* ignore probe errors */ }
      }

      // If still missing, generate random/default values
      if (!durationsVal) durationsVal = (Math.random() * (6.0 - 2.5) + 2.5).toFixed(1) + 's';
      if (!statusVal) {
        const statusList = ['Active', 'Early Active', 'Suspicious'];
        statusVal = statusList[Math.floor(Math.random() * statusList.length)];
      }
      if (!securityVal) {
        const securityList = ['Weak', 'Medium', 'Strong'];
        securityVal = securityList[Math.floor(Math.random() * securityList.length)];
      }

      // handle image bytes or url
      if (fetched.kind === 'buffer') {
        const ext = contentTypeToExt(fetched.mime);
        outFilePath = path.join(CACHE_DIR, `${tmpBase}${ext}`);
        await fsp.writeFile(outFilePath, fetched.buffer);
      } else if (fetched.kind === 'url') {
        let ext = '.png';
        try { ext = path.extname(new URL(fetched.url).pathname) || '.png'; } catch (e) {}
        outFilePath = path.join(CACHE_DIR, `${tmpBase}${ext}`);
        await downloadUrlToFile(fetched.url, outFilePath);
      } else if (fetched.kind === 'json') {
        // JSON with no image: show message for debugging and abort
        await sendMessageAsync(api, `⚠️ API returned JSON but no image found:\n${JSON.stringify(fetched.json, null, 2)}`, threadID);
        throw new Error('No image in API JSON response');
      } else {
        // text/no-image
        await sendMessageAsync(api, `⚠️ API response (no image):\n${String(fetched.text || fetched.rawText || '').slice(0, 1500)}`, threadID);
        throw new Error('No image (text response)');
      }

      // sanity file size
      const stats = await fsp.stat(outFilePath);
      const MAX_BYTES = 9 * 1024 * 1024;
      if (stats.size > MAX_BYTES) throw new Error('Generated image too large to send.');

      // success reaction
      try { if (typeof api.setMessageReaction === 'function') api.setMessageReaction('✅', messageID, () => {}, true); } catch (e) {}

      // Build ONE combined stylized text message
      const header = ` ${toUnicodeBold('ACCOUNT HACK - COMPLETED')} 💀`;
      const nameUid = toUnicodeBold(`${nameToSendRaw} (${uidToShow || 'no-uid'})`);
      const durations = toUnicodeBold(`Durations : ${durationsVal}`);
      const status = toUnicodeBold(`Status : ${statusVal}`);
      const security = toUnicodeBold(`Security : ${securityVal}`);

      const combinedText = `${header}\n${nameUid}\n\n${durations}\n${status}\n${security}`;

      // send the single text message
      await sendMessageAsync(api, combinedText, threadID);

      // then send the image as a separate message
      const sent = await new Promise((resolve) => {
        const stream = fs.createReadStream(outFilePath);
        stream.on('error', (err) => console.error('[hack] stream error', err));
        api.sendMessage({ body: '', attachment: stream }, threadID, (err) => {
          if (err) { console.error('[hack] attachment send error', err); return resolve(false); }
          resolve(true);
        });
      });

      if (!sent) throw new Error('Failed to deliver generated image to thread.');

      // final reaction
      try { if (typeof api.setMessageReaction === 'function') api.setMessageReaction('💀', messageID, () => {}, true); } catch (e) {}

    } catch (err) {
      console.error('[hack] error:', err && (err.stack || err.message || err));
      try { await sendMessageAsync(api, `⚠️ Failed to generate/send image: ${err.message || 'unknown error'}`, threadID); } catch (e) {}
    } finally {
      // cleanup file
      try { if (outFilePath && fs.existsSync(outFilePath)) await fsp.unlink(outFilePath); } catch (e) {}
      // unsend loading if possible
      try {
        if (loadingInfo && loadingInfo.messageID && typeof api.unsendMessage === 'function') {
          api.unsendMessage(loadingInfo.messageID);
        }
      } catch (e) {}
    }
  }
};