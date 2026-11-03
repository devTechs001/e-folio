/**
 * Public content loader: live API first, bundled saved copy second.
 *
 * The saved copy is src/data/publicSnapshot.json, generated from the local
 * backup/seed files by `npm run snapshot:build`. It is used only when a live
 * request fails or returns an empty section, so the public site stays
 * consistent instead of showing null data, warnings or error banners.
 * Technical failures are recorded for developers (never shown to visitors).
 */
import snapshot from '../data/publicSnapshot.json';
import apiService from './api.service';
import { recordDevIssue } from '../utils/publicMessaging';

export const PUBLIC_ENDPOINTS = Object.freeze({
    projects: '/public/projects?status=all&limit=100',
    skills: '/public/skills',
    interests: '/public/interests',
    education: '/public/education',
    testimonials: '/testimonials/public/testimonials'
});

const ARRAY_KEYS = Object.freeze({
    projects: 'projects',
    skills: 'skills',
    interests: 'interests',
    education: 'education',
    testimonials: 'testimonials',
    labProjects: 'projects'
});

const clone = value => JSON.parse(JSON.stringify(value));

export const hasSnapshot = section => Boolean(snapshot.sections?.[section]);

/** A fresh copy of the saved section, flagged so pages never cache it as live. */
export const getSnapshotSection = section => ({
    ...(hasSnapshot(section) ? clone(snapshot.sections[section]) : { success: true }),
    source: 'snapshot',
    snapshot: true
});

const isUsable = (response, key) =>
    Boolean(response) &&
    response.success !== false &&
    Array.isArray(response[key]) &&
    response[key].length > 0;

/**
 * Try the live API; on any failure or empty result, return the saved copy.
 * `fallbackSection` lets the Lab page use its own experiment records.
 */
export async function loadPublicSection(section, options = {}) {
    const endpoint = options.endpoint || PUBLIC_ENDPOINTS[section];
    const key = options.key || ARRAY_KEYS[section] || section;
    const fallbackSection = options.fallbackSection || section;

    try {
        const response = await apiService.request(endpoint, options.requestOptions);
        if (isUsable(response, key)) {
            return { ...response, source: 'live', snapshot: false };
        }
        recordDevIssue({
            section,
            endpoint,
            detail: 'Live section was empty or unsuccessful; saved copy used'
        });
    } catch (error) {
        recordDevIssue({ section, endpoint, error });
    }
    return getSnapshotSection(fallbackSection);
}

export const isLiveContent = response => response?.source === 'live';
