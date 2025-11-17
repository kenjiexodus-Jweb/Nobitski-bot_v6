const axios = require('axios');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const API_BASE = 'https://betadash-api-swordslush-production.up.railway.app/faceswap';

async function ensureCacheDir() {
  try { await fsp.mkdir(CACHE_DIR, { recursive: true }); } catch (e) {}
}

function sanitizeFilename(s) {
  return (s || 'unknown').toString().replace(/[^a-zA-Z0-9-_\.]/g, '_');
}

function contentTypeToExt(ct) {
  if (!ct) return '.png';
  ct = ct.toLowerCase();
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  return '.png';
}

function sendMessageAsync(api, payload, threadID) {
  return new Promise((resolve) => {
    try {
      api.sendMessage(payload, threadID, (err, info) => {
        if (err) return resolve(null);
        return resolve(info || null);
      });
    } catch (e) { resolve(null); }
  });
}

async function fetchFaceswapImage(url1, url2) {
  const params = new URLSearchParams({ url1, url2 });
  const url = `${API_BASE}?${params.toString()}`;
  
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 40000,
    maxRedirects: 5,
    validateStatus: null,
    headers: { 'User-Agent': 'ws3fca-faceswap-client', Accept: '*/*', Referer: API_BASE }
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Faceswap API error: ${res.status}`);
  }

  const ct = res.headers['content-type']?.toLowerCase() || '';
  if (ct.startsWith('image/')) {
    return { kind: 'buffer', buffer: Buffer.from(res.data), mime: ct };
  }

  const txt = Buffer.from(res.data || []).toString('utf8');
  try {
    const json = JSON.parse(txt);
    const img = json.url || json.image || json.result;
    if (img && typeof img === 'string') return { kind: 'url', url: img };
  } catch {}
  throw new Error('No valid image returned by API.');
}

async function downloadUrlToFile(url, outPath) {
  const res = await axios.get(url, { responseType: 'stream' });
  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(outPath);
    res.data.pipe(w);
    w.on('finish', resolve);
    w.on('error', reject);
  });
  return outPath;
}

module.exports = {
  config: {
    name: 'faceswap',
    version: '1.0',
    description: 'Swap faces between two images using Betadash API',
    hasPrefix: false,
    role: 0,
    guide: { en: 'faceswap (reply or attach two images)' }
  },

  async execute({ api, event }) {
    const { threadID, messageID, messageReply, attachments } = event;

    // collect image URLs from either reply or same message
    let imgs = [];
    if (messageReply && messageReply.attachments) {
      imgs.push(...messageReply.attachments.filter(a => a.type === 'photo').map(a => a.url));
    }
    if (attachments && attachments.length) {
      imgs.push(...attachments.filter(a => a.type === 'photo').map(a => a.url));
    }

    if (imgs.length < 2) {
      await sendMessageAsync(api, '⚠️ Please attach or reply to two images for faceswap.', threadID);
      return;
    }

    const [url1, url2] = imgs.slice(0, 2);

    // Reaction + loading message
    try { api.setMessageReaction('🌀', messageID, () => {}, true); } catch {}
    const loadingInfo = await sendMessageAsync(api, '👥 Fetching faceswap, please wait...', threadID);

    await ensureCacheDir();
    const tmpFile = path.join(CACHE_DIR, `faceswap_${sanitizeFilename(Date.now())}.png`);

    try {
      const result = await fetchFaceswapImage(url1, url2);

      if (result.kind === 'buffer') {
        const ext = contentTypeToExt(result.mime);
        const filePath = tmpFile.replace('.png', ext);
        await fsp.writeFile(filePath, result.buffer);
        await sendMessageAsync(api, { body: '𝗙𝗔𝗖𝗘𝗦𝗪𝗔𝗣 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟 👥', attachment: fs.createReadStream(filePath) }, threadID);
        await fsp.unlink(filePath);
      } else if (result.kind === 'url') {
        const filePath = tmpFile;
        await downloadUrlToFile(result.url, filePath);
        await sendMessageAsync(api, { body: '𝗙𝗔𝗖𝗘𝗦𝗪𝗔𝗣 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟 👥', attachment: fs.createReadStream(filePath) }, threadID);
        await fsp.unlink(filePath);
      }

      try { api.setMessageReaction('✅', messageID, () => {}, true); } catch {}
    } catch (err) {
      console.error('[faceswap] error:', err);
      await sendMessageAsync(api, `⚠️ Faceswap failed: ${err.message}`, threadID);
      try { api.setMessageReaction('❌', messageID, () => {}, true); } catch {}
    } finally {
      if (loadingInfo?.messageID && typeof api.unsendMessage === 'function') {
        try { api.unsendMessage(loadingInfo.messageID); } catch {}
      }
    }
  }
};