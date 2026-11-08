'use strict';
/**
 * Central security configuration (confidential).
 *
 * Historically the JWT secret and the owner password were hard-coded as
 * fallbacks in several files. That meant a token could be forged by anyone who
 * read the repository, and signing/verification silently used different keys
 * (process.env.JWT_SECRET on one side, a literal on the other).
 *
 * This module is now the single source of truth:
 *   - production REQUIRES an explicitly configured, strong JWT_SECRET and
 *     OWNER_PASSWORD / OWNER_PASSWORD_HASH; it fails closed instead of using a
 *     public fallback;
 *   - development gets a per-process random secret and a clearly-labelled dev
 *     password, so local login still works without committing any secret.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const WEAK_SECRET = /^(test|change|your|placeholder|efolio|secret|dev|generate|<)/i;
const DEV_OWNER_PASSWORD = 'dev-only-owner-password';
const devSecret = crypto.randomBytes(48).toString('hex');
let devWarningShown = false;

function isProduction() {
    return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function warnDev(message) {
    if (devWarningShown) return;
    devWarningShown = true;
    console.warn(`[security] ${message}`);
}

/** Return the signing key, or throw in production when it is not configured. */
function getJwtSecret() {
    const configured = (process.env.JWT_SECRET || '').trim();

    if (configured) {
        if (configured.length < 32 || WEAK_SECRET.test(configured)) {
            if (isProduction()) {
                throw new Error('JWT_SECRET is too weak. Set a random value of at least 32 characters.');
            }
            warnDev('JWT_SECRET looks weak; using a per-process development secret instead.');
            return devSecret;
        }
        return configured;
    }

    if (isProduction()) {
        throw new Error('JWT_SECRET is required in production. Set it in the deployment environment.');
    }
    warnDev('JWT_SECRET is not set; using a per-process development secret. Tokens invalidate on restart.');
    return devSecret;
}

function signToken(payload, options = {}) {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRE || '7d',
        ...options
    });
}

function verifyToken(token) {
    return jwt.verify(token, getJwtSecret());
}

function getOwnerEmail() {
    // Phase 32: on Render the owner email must come from the environment.
    // In production an unconfigured value fails closed (no login can match an
    // empty email); development keeps a local fallback for offline work.
    // No real-looking address is compiled into source. Set OWNER_EMAIL in
    // the environment for local owner sign-in too.
    const fallback = isProduction() ? '' : 'owner@example.invalid';
    return (process.env.OWNER_EMAIL || fallback)
        .replace(/^["']|["']$/g, '').trim().toLowerCase();
}

/**
 * Owner password used only for the bootstrap owner login.
 * Production must supply OWNER_PASSWORD (or a bcrypt OWNER_PASSWORD_HASH).
 */
function getOwnerPassword() {
    const configured = (process.env.OWNER_PASSWORD || '').replace(/^["']|["']$/g, '').trim();
    if (configured) return configured;
    if (process.env.OWNER_PASSWORD_HASH) return null; // hash-only mode
    if (isProduction()) {
        throw new Error('OWNER_PASSWORD (or OWNER_PASSWORD_HASH) is required in production.');
    }
    warnDev(`OWNER_PASSWORD is not set; local development owner password is "${DEV_OWNER_PASSWORD}".`);
    return DEV_OWNER_PASSWORD;
}

async function verifyOwnerPassword(candidate, bcrypt) {
    const hash = process.env.OWNER_PASSWORD_HASH;
    if (hash) return bcrypt.compare(candidate, hash);
    const plain = getOwnerPassword();
    if (!plain) return false;
    // Constant-time comparison against a hash of the configured password.
    const candidateHash = crypto.createHash('sha256').update(candidate).digest();
    const expectedHash = crypto.createHash('sha256').update(plain).digest();
    return crypto.timingSafeEqual(candidateHash, expectedHash);
}

/** Non-fatal boot-time checks; surfaced through /health for monitoring. */
function assertProductionConfig() {
    const issues = [];
    if (!isProduction()) return issues;

    const secret = (process.env.JWT_SECRET || '').trim();
    if (!secret) issues.push('JWT_SECRET is missing');
    else if (secret.length < 32 || WEAK_SECRET.test(secret)) issues.push('JWT_SECRET is weak or a placeholder');

    if (!process.env.OWNER_EMAIL) issues.push('OWNER_EMAIL is missing');
    if (!process.env.OWNER_PASSWORD && !process.env.OWNER_PASSWORD_HASH) {
        issues.push('OWNER_PASSWORD / OWNER_PASSWORD_HASH is missing');
    }
    if (Boolean(process.env.ADMIN_EMAIL) !== Boolean(process.env.ADMIN_PASSWORD)) {
        issues.push('ADMIN_EMAIL / ADMIN_PASSWORD must be set together');
    }
    if (!process.env.MONGODB_URI) issues.push('MONGODB_URI is missing');
    if (!process.env.CLIENT_URL) issues.push('CLIENT_URL is missing');
    return issues;
}

module.exports = {
    isProduction,
    getJwtSecret,
    signToken,
    verifyToken,
    getOwnerEmail,
    getOwnerPassword,
    verifyOwnerPassword,
    assertProductionConfig
};
