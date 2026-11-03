'use strict';
/**
 * Dependency-free RFC 6238 TOTP implementation.
 *
 * The 2FA endpoints used `speakeasy` (for TOTP) and `qrcode` (to render a QR
 * image), neither of which is declared in server/package.json, so enabling 2FA
 * threw MODULE_NOT_FOUND in a clean deployment. TOTP is ~40 lines with Node's
 * built-in crypto; QR rendering belongs on the client, which already ships the
 * `qrcode` package and can render the returned otpauth:// URL directly.
 */

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD = 30;
const DIGITS = 6;

function base32Encode(buffer) {
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
    return output;
}

function base32Decode(input) {
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (const char of String(input).toUpperCase().replace(/=+$/, '').replace(/\s/g, '')) {
        const index = ALPHABET.indexOf(char);
        if (index === -1) continue;
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(bytes);
}

function generateSecret(byteLength = 32) {
    return base32Encode(crypto.randomBytes(Math.max(10, Math.min(byteLength, 64))));
}

function hotp(secret, counter) {
    const key = base32Decode(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac('sha1', key).update(counterBuffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24)
        | (digest[offset + 1] << 16)
        | (digest[offset + 2] << 8)
        | digest[offset + 3];
    return String(binary % (10 ** DIGITS)).padStart(DIGITS, '0');
}

function generateToken(secret, at = Date.now()) {
    return hotp(secret, Math.floor(at / 1000 / PERIOD));
}

function verify({ secret, token, window = 1, at = Date.now() }) {
    if (!secret || !token) return false;
    const candidate = String(token).replace(/\D/g, '');
    if (candidate.length !== DIGITS) return false;
    const counter = Math.floor(at / 1000 / PERIOD);
    const span = Math.max(0, Math.min(Number(window) || 0, 10));
    for (let drift = -span; drift <= span; drift++) {
        const expected = hotp(secret, counter + drift);
        const a = Buffer.from(expected);
        const b = Buffer.from(candidate);
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    }
    return false;
}

function buildOtpauthUrl({ secret, label = 'E-Folio Pro', issuer = 'E-Folio Pro' }) {
    const path = encodeURIComponent(`${issuer}:${label}`);
    const query = new URLSearchParams({
        secret,
        issuer,
        algorithm: 'SHA1',
        digits: String(DIGITS),
        period: String(PERIOD)
    });
    return `otpauth://totp/${path}?${query.toString()}`;
}

module.exports = {
    generateSecret,
    generateToken,
    verify,
    buildOtpauthUrl,
    totp: { generate: generateToken, verify }
};
