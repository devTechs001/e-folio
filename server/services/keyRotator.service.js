const axios = require('axios');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://raw.githubusercontent.com/alistaitsacle/free-llm-api-keys/main/README.md';
const ENV_PATH = path.join(__dirname, '..', '.env');
const SCRAPE_INTERVAL = 15 * 60 * 1000;
const VERIFY_INTERVAL = 10 * 60 * 1000;
const KEY_MAX_AGE = 12 * 60 * 60 * 1000;
const FAIL_THRESHOLD = 2;

const FALLBACK_ENDPOINTS = [
  { url: 'https://keylessai.thryx.workers.dev/v1', needsKey: false },
  { url: 'https://text.pollinations.ai/openai', needsKey: false },
];

class KeyRotator {
  constructor() {
    this.currentKey = process.env.OPENAI_API_KEY || '';
    this.primaryURL = process.env.OPENAI_BASE_URL || 'https://aiapiv2.pekpik.com/v1';
    this.failCount = 0;
    this.isRotating = false;
    this.usedKeys = new Set();
    this.spareKeys = [];
    this.keySince = Date.now();
    this.lastVerify = 0;
    this.currentFallbackIndex = -1; // -1 = primary, 0+ = fallback endpoint index
    this.primaryDead = false;
  }

  getBaseURL() {
    if (this.primaryDead && this.currentFallbackIndex >= 0) {
      return FALLBACK_ENDPOINTS[this.currentFallbackIndex].url;
    }
    return this.primaryURL;
  }

  needsAuth() {
    if (this.primaryDead && this.currentFallbackIndex >= 0) {
      return FALLBACK_ENDPOINTS[this.currentFallbackIndex].needsKey;
    }
    return true;
  }

  getKey() {
    if (this.primaryDead && this.currentFallbackIndex >= 0 && !this.needsAuth()) {
      return 'no-key-needed';
    }
    return this.currentKey;
  }

  setKey(key, model) {
    this.currentKey = key;
    this.keySince = Date.now();
    this.failCount = 0;
    this.primaryDead = false;
    this.currentFallbackIndex = -1;
    process.env.OPENAI_API_KEY = key;
    try {
      let env = fs.readFileSync(ENV_PATH, 'utf8');
      if (/^OPENAI_API_KEY=/m.test(env)) {
        env = env.replace(/^OPENAI_API_KEY=.*/m, `OPENAI_API_KEY=${key}`);
      } else {
        env += `\nOPENAI_API_KEY=${key}\n`;
      }
      fs.writeFileSync(ENV_PATH, env, 'utf8');
    } catch (e) {
      // non-critical
    }
    if (model) console.log(`🔑 Rotated to ${model}`);
  }

  async testKey(key, baseURL) {
    const url = baseURL || this.primaryURL;
    try {
      const res = await axios.post(`${url}/chat/completions`, {
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: 'respond with just "ok"' }],
        max_tokens: 10
      }, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  async fetchKeysFromRepo() {
    const { data } = await axios.get(REPO_URL, { timeout: 20000 });
    const keys = [];
    const tableRow = /\|\s*`(sk-[A-Za-z0-9]+)`\s*\|\s*([\w./-]+)\s*\|/g;
    let m;
    while ((m = tableRow.exec(data)) !== null) {
      const key = m[1].trim();
      const model = m[2].trim();
      if (key.startsWith('sk-') && !this.usedKeys.has(key)) {
        keys.push({ key, model });
      }
    }
    const rank = m => {
      if (m.includes('gemini-2.5-flash')) return 0;
      if (m.includes('claude-opus-4-7')) return 1;
      if (m.includes('smart-chat')) return 2;
      if (m.startsWith('gpt')) return 3;
      return 9;
    };
    keys.sort((a, b) => rank(a.model) - rank(b.model));
    return keys;
  }

  // Scrape repo + build spare pool
  async scrapeAndStockpile() {
    if (this.isRotating) return;
    this.isRotating = true;
    try {
      const candidates = await this.fetchKeysFromRepo();
      const freshSpares = [];

      for (const entry of candidates) {
        if (entry.key === this.currentKey) continue;
        const works = await this.testKey(entry.key);
        if (works) {
          freshSpares.push(entry);
          if (freshSpares.length >= 3) break;
        }
        this.usedKeys.add(entry.key);
      }

      this.spareKeys = freshSpares;
    } catch (e) {
      // repo unreachable — keep existing spare pool
    }
    this.isRotating = false;
  }

  // Replace current key now if it's stale, dead, or we have a fresh spare
  async rotate() {
    if (this.isRotating) return false;
    this.isRotating = true;
    try {
      // Try current key first on primary endpoint
      if (!this.primaryDead) {
        const currentWorks = await this.testKey(this.currentKey, this.primaryURL);
        const keyAge = Date.now() - this.keySince;

        if (currentWorks && keyAge < KEY_MAX_AGE) {
          this.isRotating = false;
          return true;
        }

        // Current key is dead or too old — try spares on primary
        for (const spare of this.spareKeys) {
          const works = await this.testKey(spare.key, this.primaryURL);
          if (works) {
            this.setKey(spare.key, spare.model);
            this.usedKeys.add(spare.key);
            this.scrapeAndStockpile();
            this.isRotating = false;
            return true;
          }
          this.usedKeys.add(spare.key);
        }

        // No spare works — scrape repo fresh
        const candidates = await this.fetchKeysFromRepo();
        for (const entry of candidates) {
          if (entry.key === this.currentKey) continue;
          const works = await this.testKey(entry.key, this.primaryURL);
          if (works) {
            this.setKey(entry.key, entry.model);
            this.usedKeys.add(entry.key);
            this.scrapeAndStockpile();
            this.isRotating = false;
            return true;
          }
          this.usedKeys.add(entry.key);
        }
      }

      // Primary endpoint is completely dead — try fallback endpoints
      console.warn('Primary endpoint unavailable, trying fallback endpoints...');
      this.primaryDead = true;

      for (let i = 0; i < FALLBACK_ENDPOINTS.length; i++) {
        const ep = FALLBACK_ENDPOINTS[i];
        try {
          const testPayload = {
            model: 'openai-fast',
            messages: [{ role: 'user', content: 'respond with just "ok"' }],
            max_tokens: 10
          };
          const testRes = await axios.post(`${ep.url}/chat/completions`, testPayload, {
            headers: ep.needsKey
              ? { 'Authorization': `Bearer ${this.currentKey}`, 'Content-Type': 'application/json' }
              : { 'Content-Type': 'application/json' },
            timeout: 15000
          });
          if (testRes.status === 200) {
            this.currentFallbackIndex = i;
            console.log(`🔄 Switched to fallback endpoint: ${ep.url}`);
            this.isRotating = false;
            return true;
          }
        } catch {}
      }

      console.warn('All endpoints unavailable');
    } catch (e) {
      console.error('Key rotation error:', e.message);
    }
    this.isRotating = false;
    return false;
  }

  recordFailure() {
    this.failCount++;
    if (this.failCount >= FAIL_THRESHOLD) {
      this.failCount = 0;
      this.rotate();
    }
  }

  start() {
    // Immediate initial stockpile + rotation
    (async () => {
      await this.scrapeAndStockpile();
      await this.rotate();
    })();

    // Scrape repo every 15 min to refresh spare pool
    setInterval(() => this.scrapeAndStockpile(), SCRAPE_INTERVAL);
    // Verify current key every 10 min
    setInterval(async () => {
      const works = await this.testKey(this.currentKey);
      if (!works) {
        this.failCount++;
        if (this.failCount >= FAIL_THRESHOLD) {
          this.failCount = 0;
          this.rotate();
        }
      } else {
        this.failCount = Math.max(0, this.failCount - 1);
      }
    }, VERIFY_INTERVAL);
    // Full rotation every hour as safety net
    setInterval(async () => {
      const keyAge = Date.now() - this.keySince;
      if (keyAge > KEY_MAX_AGE) {
        await this.rotate();
      }
    }, 60 * 60 * 1000);
  }
}

module.exports = new KeyRotator();
