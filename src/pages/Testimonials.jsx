import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiService from '../services/api.service';
import cacheService, { CACHE_TTL } from '../services/cache.service';
import socketService from '../services/socket.service';
import { useAuth } from '../contexts/AuthContext';
import sampleDataset from '../data/testimonialSamples.json';
import thumbnailOverrides from '../data/testimonialThumbnails.json';
import ArchiveNote from '../components/ArchiveNote';
import ReviewForm from '../components/ReviewForm';
import { loadPublicSection, getSnapshotSection, isLiveContent, PUBLIC_ENDPOINTS } from '../services/publicContent';
import SectionHeading from '../components/SectionHeading';
import { subscribeReviewsChanged, flushReviewOutbox } from '../utils/reviewOutbox';
import { recordDevIssue, publicEmptyCopy } from '../utils/publicMessaging';
import {
  FEED_KIND, fromTestimonial, combineFeed, loadApprovedReviews, sortFeed, filterFeed
} from '../utils/testimonialFeed';
import '../styles/Testimonials.css';
import '../styles/TestimonialsPage.css';

const SAMPLE_TAG = sampleDataset.tag;
// A local thumbnail takes precedence when one exists for this testimonial;
// every other record keeps its existing portrait untouched.
const thumbnailFor = (item) =>
  item?.thumbnail || thumbnailOverrides.byName[item?.name] || item?.avatar;
const PREVIEW_KEY = 'testimonial_preview';
// Versioned so an older browser cache can never reintroduce pre-phase-3
// invented testimonial records.
const CACHE_KEY = 'public_testimonials_v2';
const LEGACY_CACHE_KEY = 'public_testimonials';
// The public grid shows at most FOUR ROWS in its viewport and paginates
// through the rest. Cards are minmax(300px, 1fr), so a wide screen holds three
// per row; 12 cards keep the row count stable across breakpoints without a
// layout-jumping measurement pass.
const ROWS_PER_PAGE = 4;
const GRID_COLUMNS_WIDE = 3;
const PAGE_SIZE = ROWS_PER_PAGE * GRID_COLUMNS_WIDE;
const LIST_PAGE_SIZE = 8;

const isSampleTestimonial = (item) =>
  Array.isArray(item?.tags) && item.tags.includes(SAMPLE_TAG);

const readPreviewFlag = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') return true;
    if (params.get('preview') === '0') return false;
    return localStorage.getItem(PREVIEW_KEY) === 'on';
  } catch (error) {
    return false;
  }
};

const formatDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const Stars = ({ rating, size = 'sm' }) => (
  <span className={`tst-stars tst-stars--${size}`} aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map(star => (
      <i key={star} className={`fas fa-star ${star <= rating ? 'star-filled' : 'star-empty'}`} aria-hidden="true" />
    ))}
  </span>
);

const SourceChip = ({ kind }) => (
  <span className={`tst-source tst-source--${kind}`}>
    <i className={kind === FEED_KIND.review ? 'fas fa-comment-dots' : 'fas fa-quote-left'} aria-hidden="true" />
    {kind === FEED_KIND.review ? 'Visitor review' : 'Client testimonial'}
  </span>
);

const Testimonials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentSource, setContentSource] = useState('');
  const [feedStatus, setFeedStatus] = useState({ testimonials: false, reviews: false });
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [previewMode, setPreviewMode] = useState(readPreviewFlag);
  const [sampleCount, setSampleCount] = useState(0);
  const carouselRef = useRef(null);
  const slideTimer = useRef(null);
  const { isOwner: checkOwner } = useAuth();
  const owner = typeof checkOwner === 'function' ? checkOwner() : false;

  const loadFeed = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    else setSyncing(true);
    try {
      // 1. Curated testimonials: live first, bundled saved copy as fallback
      //    (unchanged behaviour, still never cached as live data).
      // Never read a cached list while previewing samples.
      const cached = previewMode ? null : cacheService.get(CACHE_KEY);
      const curatedResponse = Array.isArray(cached) && cached.length
        ? { testimonials: cached, source: 'live' }
        : await loadPublicSection('testimonials');
      const curated = Array.isArray(curatedResponse.testimonials) ? curatedResponse.testimonials : [];
      const source = curatedResponse.source || '';

      if (!previewMode && isLiveContent(curatedResponse) && curated.length) {
        cacheService.set(CACHE_KEY, curated, CACHE_TTL.TEN_MINUTES);
      }

      // 2. Approved visitor reviews from the reviews system.
      const reviewFeed = await loadApprovedReviews({ limit: 50 });

      let display = combineFeed(curated, reviewFeed.items);

      // 3. Owner preview appends the labelled mock samples (unchanged).
      if (previewMode && owner) {
        const admin = await apiService.getAllTestimonials({ limit: 100 });
        const all = admin?.success && Array.isArray(admin.testimonials) ? admin.testimonials : [];
        const samples = all.filter(isSampleTestimonial);
        setSampleCount(samples.length);
        const seen = new Set(display.map(item => item.id));
        display = [
          ...display,
          ...samples
            .filter(sample => !seen.has(String(sample._id || sample.id || sample.name)))
            .map(fromTestimonial)
        ];
      } else {
        setSampleCount(0);
      }

      // A public page with no live records keeps its saved copy, so the
      // section is never blank for a first-time visitor.
      if (!display.length) {
        const snapshot = getSnapshotSection('testimonials');
        display = (snapshot.testimonials || []).map(fromTestimonial);
        setContentSource('snapshot');
      } else {
        setContentSource(source);
      }

      setItems(display);
      setFeedStatus(reviewFeed.status
        ? { testimonials: source !== 'snapshot', reviews: true }
        : { testimonials: source !== 'snapshot', reviews: false });
    } catch (error) {
      recordDevIssue({ section: 'testimonials', endpoint: PUBLIC_ENDPOINTS.testimonials, error });
      setItems((getSnapshotSection('testimonials').testimonials || []).map(fromTestimonial));
      setContentSource('snapshot');
      setFeedStatus({ testimonials: false, reviews: false });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [previewMode, owner]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Drop the pre-version cache once so fabricated fallback records cannot
  // survive in a returning visitor's browser.
  useEffect(() => {
    cacheService.delete(LEGACY_CACHE_KEY);
  }, []);

  // Settings edits in the dashboard should refresh the section immediately.
  useEffect(() => {
    const handleSettingsChange = () => {
      cacheService.delete(CACHE_KEY);
      loadFeed({ quiet: true });
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, [loadFeed]);

  // Automatic updates: the reviews system broadcasts a change, a cross-tab
  // signal or a poll keeps this page current without a manual refresh. Only
  // approved reviews ever appear, so queued submissions stay private.
  useEffect(() => {
    const refresh = () => {
      if (typeof document === 'undefined' || !document.hidden) loadFeed({ quiet: true });
    };
    const unsubscribeSocket = socketService.subscribePublicReviews(refresh);
    const unsubscribeCrossTab = subscribeReviewsChanged(refresh);
    const interval = setInterval(refresh, 30000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    const onOnline = () => { void flushReviewOutbox(); refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      unsubscribeSocket();
      unsubscribeCrossTab();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [loadFeed]);

  // Remember which visitor reviews this browser has already liked.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('likedReviews') || '[]');
      if (Array.isArray(saved)) setLikedIds(saved.map(String));
    } catch (error) {
      setLikedIds([]);
    }
  }, []);

  const visible = useMemo(() => {
    const filtered = filterFeed(items, {
      query,
      kind: kindFilter,
      rating: ratingFilter,
      featuredOnly
    });
    if (sortBy === 'rating') return [...filtered].sort((a, b) => b.rating - a.rating || b.sortTime - a.sortTime);
    if (sortBy === 'oldest') return [...filtered].sort((a, b) => a.sortTime - b.sortTime);
    if (sortBy === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return sortFeed(filtered);
  }, [items, query, kindFilter, ratingFilter, featuredOnly, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, kindFilter, ratingFilter, featuredOnly, sortBy]);

  // Each view pages differently: the grid shows four rows, the list a fixed
  // number of rows, and the carousel one item at a time. They must not share a
  // single page size or the last page of one mode leaks into another.
  const pageSize = viewMode === 'list' ? LIST_PAGE_SIZE : PAGE_SIZE;
  const gridPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const carouselPages = Math.max(1, visible.length);
  const totalPages = viewMode === 'carousel' ? carouselPages : gridPages;
  const activeSlide = Math.min(page, carouselPages) - 1;
  const paged = viewMode === 'carousel'
    ? visible
    : visible.slice((page - 1) * pageSize, page * pageSize);

  // The grid viewport is capped at four rows so a long feed scrolls inside a
  // predictable box instead of pushing the page footer miles down.
  const gridViewportMax = `calc(4 * (var(--tst-card-est-height, 320px) + 1rem))`;

  const autoAdvance = useCallback(() => {
    setPage(current => (current >= carouselPages ? 1 : current + 1));
  }, [carouselPages]);

  useEffect(() => {
    if (viewMode !== 'carousel' || visible.length < 2) return undefined;
    slideTimer.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      autoAdvance();
    }, 6000);
    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [viewMode, visible.length, autoAdvance]);

  const stats = useMemo(() => {
    const total = items.length;
    const ratings = items.map(item => item.rating).filter(value => Number.isFinite(value));
    const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
    const reviewCount = items.filter(item => item.kind === FEED_KIND.review).length;
    const testimonialCount = total - reviewCount;
    const featured = items.filter(item => item.featured).length;
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = items.filter(item => item.sortTime >= monthAgo).length;
    return { total, average, reviewCount, testimonialCount, featured, recent };
  }, [items]);

  // Review counts per category. A category is taken from the people who left
  // the words (their role, falling back to the kind of entry), never invented.
  // Search and rating still apply so the numbers match what the chips filter.
  const categoryCounts = useMemo(() => {
    const scoped = items.filter(item => {
      if (ratingFilter > 0 && !(item.rating >= ratingFilter)) return false;
      if (featuredOnly && !item.featured) return false;
      if (query.trim()) {
        const needle = query.trim().toLowerCase();
        const haystack = `${item.name} ${item.role || ''} ${item.company || ''} ${item.content || ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    const labelFor = item => {
      const role = String(item.role || item.position || '').trim();
      if (role) return role;
      return item.kind === FEED_KIND.review ? 'Visitor reviews' : 'Client recommendations';
    };

    const counts = new Map();
    for (const item of scoped) {
      const key = labelFor(item);
      const entry = counts.get(key) || { label: key, count: 0, reviewCount: 0, testimonialCount: 0, totalRating: 0, rated: 0 };
      entry.count += 1;
      if (item.kind === FEED_KIND.review) entry.reviewCount += 1;
      else entry.testimonialCount += 1;
      if (Number.isFinite(item.rating)) {
        entry.totalRating += item.rating;
        entry.rated += 1;
      }
      counts.set(key, entry);
    }

    return [...counts.values()]
      .map(entry => ({
        ...entry,
        average: entry.rated ? entry.totalRating / entry.rated : 0
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [items, query, ratingFilter, featuredOnly]);

  const toggleLike = async item => {
    if (item.kind !== FEED_KIND.review) return;
    const already = likedIds.includes(item.id);
    try {
      const response = already ? await apiService.unlikeReview(item.id) : await apiService.likeReview(item.id);
      if (response?.success === false) return;
      const next = already ? likedIds.filter(id => id !== item.id) : [...likedIds, item.id];
      setLikedIds(next);
      localStorage.setItem('likedReviews', JSON.stringify(next));
      setItems(current => current.map(entry =>
        entry.id === item.id
          ? { ...entry, likes: Math.max(0, (entry.likes || 0) + (already ? -1 : 1)) }
          : entry
      ));
    } catch (error) {
      recordDevIssue({ section: 'testimonials', endpoint: `/reviews/${item.id}/like`, error });
    }
  };

  const openModal = item => {
    setSelected(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelected(null), 200);
  };

  const shareItem = async item => {
    const payload = { title: `Recommendation from ${item.name}`, text: item.content, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(`${item.content} — ${item.name}`);
    } catch (error) {
      // Closed share sheet or unavailable clipboard: nothing to report.
    }
  };

  const togglePreview = () => {
    const next = !previewMode;
    setPreviewMode(next);
    try {
      if (next) localStorage.setItem(PREVIEW_KEY, 'on');
      else localStorage.removeItem(PREVIEW_KEY);
      const url = new URL(window.location.href);
      if (next) url.searchParams.set('preview', '1');
      else url.searchParams.delete('preview');
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      // URL/storage may be unavailable; preview still works for this render.
    }
    cacheService.delete(CACHE_KEY);
  };

  const resetFilters = () => {
    setQuery('');
    setKindFilter('all');
    setRatingFilter(0);
    setFeaturedOnly(false);
    setSortBy('recent');
  };

  const filterCount = (query ? 1 : 0) + (kindFilter !== 'all' ? 1 : 0) + (ratingFilter ? 1 : 0) + (featuredOnly ? 1 : 0);

  if (loading) {
    return (
      <section className="tst-shell tst-shell--loading" aria-busy="true">
        <div className="tst-loading">
          <span className="tst-loading-ring" />
          <p>Gathering what people have said…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="tst-shell">
      <div className="tst-orb tst-orb--1" aria-hidden="true" />
      <div className="tst-orb tst-orb--2" aria-hidden="true" />

      <div className="tst-container">
        {previewMode && owner && (
          <div className="testimonial-preview-banner" role="status">
            <span className="testimonial-preview-badge">PREVIEW MODE</span>
            <span>
              Sample testimonials are mock data ({sampleCount} shown). They are not published to normal visitors.
            </span>
            <button type="button" onClick={togglePreview} className="testimonial-preview-exit">
              Exit preview
            </button>
          </div>
        )}
        {owner && !previewMode && (
          <button type="button" onClick={togglePreview} className="testimonial-preview-open">
            <i className="fas fa-eye" aria-hidden="true"></i> Preview sample testimonials
          </button>
        )}

        {/* ------------------------------------------------------- hero --- */}
        <header className="tst-hero">
          <div className="tst-hero-copy">
            <span className="tst-eyebrow">
              <i className="fas fa-comments" aria-hidden="true" />
              Voices from the work
            </span>
            <SectionHeading
              text="Testimonials & reviews"
              accent="reviews"
              className="tst-heading"
            />
            <p className="tst-lede">
              Recommendations from clients sit next to reviews visitors left on this site.
              Both are the same system — a review only appears here once it has been approved.
            </p>
            <ArchiveNote source={contentSource} className="tst-archive" />
          </div>

          <div className="tst-hero-side">
            <div className="tst-score">
              <span className="tst-score-value">{stats.average ? stats.average.toFixed(1) : '—'}</span>
              <span className="tst-score-max">/ 5</span>
              <Stars rating={Math.round(stats.average)} />
              <span className="tst-score-label">
                {stats.total} {stats.total === 1 ? 'voice' : 'voices'} on this page
              </span>
            </div>
            <div className="tst-hero-actions">
              <button type="button" className="tst-btn tst-btn--primary" onClick={() => setShowForm(true)}>
                <i className="fas fa-pen" aria-hidden="true" /> Write a review
              </button>
              <a className="tst-btn" href="/reviews">
                <i className="fas fa-star" aria-hidden="true" /> Reviews page
              </a>
            </div>
            <div className="tst-sync" role="status" aria-live="polite">
              <span className={`tst-sync-dot ${syncing ? 'is-syncing' : ''}`} aria-hidden="true" />
              {syncing ? 'Checking for new reviews…' : 'Updates automatically when a review is approved'}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------- stats --- */}
        <div className="tst-stats">
          <div className="tst-stat">
            <span className="tst-stat-value">{stats.total}</span>
            <span className="tst-stat-label">Total</span>
          </div>
          <div className="tst-stat">
            <span className="tst-stat-value">{stats.testimonialCount}</span>
            <span className="tst-stat-label">Testimonials</span>
          </div>
          <div className="tst-stat">
            <span className="tst-stat-value">{stats.reviewCount}</span>
            <span className="tst-stat-label">Visitor reviews</span>
          </div>
          <div className="tst-stat">
            <span className="tst-stat-value">{stats.featured}</span>
            <span className="tst-stat-label">Featured</span>
          </div>
          <div className="tst-stat">
            <span className="tst-stat-value">{stats.recent}</span>
            <span className="tst-stat-label">Last 30 days</span>
          </div>
        </div>

        {/* ------------------------------------------------------ toolbar --- */}
        <div className="tst-toolbar">
          <div className="tst-search">
            <i className="fas fa-search" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search a name, company or phrase"
              aria-label="Search testimonials and reviews"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="tst-segment" role="group" aria-label="Filter by source">
            {[
              { id: 'all', label: 'All', count: stats.total },
              { id: FEED_KIND.testimonial, label: 'Testimonials', count: stats.testimonialCount },
              { id: FEED_KIND.review, label: 'Reviews', count: stats.reviewCount }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`tst-segment-btn ${kindFilter === tab.id ? 'is-active' : ''}`}
                aria-pressed={kindFilter === tab.id}
                onClick={() => setKindFilter(tab.id)}
              >
                {tab.label}<span className="tst-segment-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="tst-toolbar-right">
            <button
              type="button"
              className={`tst-chip ${featuredOnly ? 'is-active' : ''}`}
              aria-pressed={featuredOnly}
              onClick={() => setFeaturedOnly(value => !value)}
            >
              <i className="fas fa-star" aria-hidden="true" /> Featured
            </button>

            <label className="tst-select">
              <span className="sr-only">Minimum rating</span>
              <select value={ratingFilter} onChange={event => setRatingFilter(Number(event.target.value))}>
                <option value={0}>All ratings</option>
                {[5, 4, 3].map(rating => (
                  <option key={rating} value={rating}>{rating} stars</option>
                ))}
              </select>
            </label>

            <label className="tst-select">
              <span className="sr-only">Sort order</span>
              <select value={sortBy} onChange={event => setSortBy(event.target.value)}>
                <option value="recent">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="rating">Highest rated</option>
                <option value="name">Name</option>
              </select>
            </label>

            <div className="tst-segment tst-segment--icons" role="group" aria-label="View mode">
              {[
                { id: 'grid', icon: 'fas fa-th-large', label: 'Grid view' },
                { id: 'list', icon: 'fas fa-list', label: 'List view' },
                { id: 'carousel', icon: 'fas fa-images', label: 'Carousel view' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`tst-segment-btn ${viewMode === option.id ? 'is-active' : ''}`}
                  aria-pressed={viewMode === option.id}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setViewMode(option.id)}
                >
                  <i className={option.icon} aria-hidden="true" />
                </button>
              ))}
            </div>

            <button
              type="button"
              className="tst-chip"
              onClick={() => loadFeed({ quiet: true })}
              aria-label="Refresh"
              title="Refresh"
            >
              <i className={`fas fa-sync-alt ${syncing ? 'fa-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Category review counts — derived from the entries themselves. */}
        {categoryCounts.length > 0 && (
          <section className="tst-cats" aria-label="Entries by category">
            <div className="tst-cats-head">
              <span className="tst-cats-title">
                <i className="fas fa-layer-group" aria-hidden="true" /> By category
              </span>
              <span className="tst-cats-total">
                {categoryCounts.reduce((sum, entry) => sum + entry.count, 0)} in {categoryCounts.length}{' '}
                {categoryCounts.length === 1 ? 'category' : 'categories'}
              </span>
            </div>
            <ul className="tst-cats-list">
              {categoryCounts.map(entry => (
                <li key={entry.label} className="tst-cat">
                  <span className="tst-cat-label" title={entry.label}>{entry.label}</span>
                  <span className="tst-cat-count">
                    {entry.count}
                    <span className="tst-cat-count-unit">{entry.count === 1 ? 'entry' : 'entries'}</span>
                  </span>
                  <span className="tst-cat-split">
                    {entry.reviewCount > 0 && (
                      <span className="tst-cat-kind tst-cat-kind--review">
                        {entry.reviewCount} review{entry.reviewCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {entry.testimonialCount > 0 && (
                      <span className="tst-cat-kind tst-cat-kind--testimonial">
                        {entry.testimonialCount} testimonial{entry.testimonialCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                  {entry.average > 0 && (
                    <span className="tst-cat-avg">
                      <i className="fas fa-star" aria-hidden="true" />
                      {entry.average.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="tst-resultbar">
          <span>
            Showing {paged.length} of {visible.length}
            {viewMode !== 'carousel' && gridPages > 1 && (
              <span className="tst-resultbar-page"> · page {page} of {gridPages}</span>
            )}
            {viewMode === 'grid' && (
              <span className="tst-resultbar-hint"> · {ROWS_PER_PAGE} rows per view, scroll inside the grid</span>
            )}
            {filterCount > 0 && <button type="button" className="tst-clear" onClick={resetFilters}>Clear {filterCount} filter{filterCount > 1 ? 's' : ''}</button>}
          </span>
          <span className="tst-resultbar-source">
            {feedStatus.reviews ? 'Reviews connected' : 'Reviews pending connection'}
            <span aria-hidden="true"> · </span>
            {feedStatus.testimonials ? 'Testimonials connected' : 'Testimonials from the saved copy'}
          </span>
        </div>

        {/* ------------------------------------------------------- feed --- */}
        {visible.length === 0 ? (
          <div className="tst-empty">
            <span className="tst-empty-icon"><i className="fas fa-comment-slash" aria-hidden="true" /></span>
            <h3>Nothing to show yet</h3>
            <p>
              {items.length === 0
                ? publicEmptyCopy('emptyTestimonials')
                : 'No testimonial or review matches these filters yet.'}
            </p>
            <div className="tst-empty-actions">
              <button type="button" className="tst-btn tst-btn--primary" onClick={() => setShowForm(true)}>
                Be the first to write one
              </button>
              {filterCount > 0 && (
                <button type="button" className="tst-btn" onClick={resetFilters}>Reset filters</button>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div
                className="tst-grid tst-grid--scroll"
                style={{ '--tst-viewport-max': gridViewportMax }}
                tabIndex={0}
                role="region"
                aria-label={`Testimonial grid, four rows visible, page ${page} of ${gridPages}`}
              >
                {paged.map(item => (
                  <article
                    key={item.id}
                    className={`tst-card ${isSampleTestimonial(item.raw) ? 'is-sample' : ''}`}
                    onClick={() => openModal(item)}
                  >
                    <div className="tst-card-top">
                      <img src={thumbnailFor(item)} alt={item.name} className="tst-avatar" loading="lazy" decoding="async" />
                      <div className="tst-card-who">
                        <h3 className="tst-name">{item.name}</h3>
                        <p className="tst-role">
                          {[item.position, item.company].filter(Boolean).join(' · ') || 'Visitor'}
                        </p>
                      </div>
                      <SourceChip kind={item.kind} />
                    </div>
                    <div className="tst-card-rating">
                      <Stars rating={item.rating} />
                      <span>{item.rating}.0</span>
                      {item.featured && <span className="tst-badge">Featured</span>}
                      {item.verified && <span className="tst-badge tst-badge--muted">Verified</span>}
                      {isSampleTestimonial(item.raw) && (
                        <span className="testimonial-sample-badge">SAMPLE · PREVIEW</span>
                      )}
                    </div>
                    <p className="tst-quote">{item.content}</p>
                    {item.reply && (
                      <div className="tst-reply">
                        <span>Reply</span>
                        <p>{item.reply}</p>
                      </div>
                    )}
                    <div className="tst-card-foot">
                      <span className="tst-date">{formatDate(item.date)}</span>
                      <span className="tst-card-actions">
                        {item.kind === FEED_KIND.review && (
                          <button
                            type="button"
                            className={`tst-mini ${likedIds.includes(item.id) ? 'is-active' : ''}`}
                            onClick={event => { event.stopPropagation(); toggleLike(item); }}
                            aria-pressed={likedIds.includes(item.id)}
                          >
                            <i className="fas fa-thumbs-up" aria-hidden="true" /> {item.likes || 0}
                          </button>
                        )}
                        <button
                          type="button"
                          className="tst-mini"
                          onClick={event => { event.stopPropagation(); shareItem(item); }}
                          aria-label={`Share ${item.name}'s message`}
                        >
                          <i className="fas fa-share-alt" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="tst-list">
                {paged.map(item => (
                  <article
                    key={item.id}
                    className={`tst-row ${isSampleTestimonial(item.raw) ? 'is-sample' : ''}`}
                    onClick={() => openModal(item)}
                  >
                    <img src={thumbnailFor(item)} alt={item.name} className="tst-row-avatar" loading="lazy" decoding="async" />
                    <div className="tst-row-body">
                      <div className="tst-row-head">
                        <div>
                          <h3 className="tst-name">
                            {item.name}
                            {item.verified && <i className="fas fa-circle-check tst-verified" aria-label="Verified" />}
                          </h3>
                          <p className="tst-role">{[item.position, item.company].filter(Boolean).join(' · ') || 'Visitor'}</p>
                        </div>
                        <div className="tst-row-meta">
                          <Stars rating={item.rating} />
                          <span className="tst-date">{formatDate(item.date)}</span>
                        </div>
                      </div>
                      <p className="tst-quote">{item.content}</p>
                      <div className="tst-row-foot">
                        <SourceChip kind={item.kind} />
                        {item.project && <span className="tst-tag">{item.project}</span>}
                        {(item.tags || []).slice(0, 3).map(tag => (
                          <span className="tst-tag" key={tag}>{tag}</span>
                        ))}
                        {isSampleTestimonial(item.raw) && (
                          <span className="testimonial-sample-badge">SAMPLE · PREVIEW</span>
                        )}
                        {item.kind === FEED_KIND.review && (
                          <button
                            type="button"
                            className={`tst-mini ${likedIds.includes(item.id) ? 'is-active' : ''}`}
                            onClick={event => { event.stopPropagation(); toggleLike(item); }}
                            aria-pressed={likedIds.includes(item.id)}
                          >
                            <i className="fas fa-thumbs-up" aria-hidden="true" /> {item.likes || 0}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {viewMode === 'carousel' && (
              <div className="tst-carousel" ref={carouselRef}>
                <button
                  type="button"
                  className="tst-carousel-nav"
                  onClick={() => setPage(current => (current <= 1 ? totalPages : current - 1))}
                  aria-label="Previous"
                >
                  <i className="fas fa-chevron-left" aria-hidden="true" />
                </button>

                <div className="tst-carousel-track">
                  {visible.map((item, index) => {
                    const activeIndex = activeSlide;
                    return (
                      <article
                        key={item.id}
                        className={`tst-slide ${index === activeIndex ? 'is-active' : ''} ${isSampleTestimonial(item.raw) ? 'is-sample' : ''}`}
                        style={{ transform: `translateX(${(index - activeIndex) * 100}%)` }}
                        aria-hidden={index !== activeIndex}
                      >
                        <div className="tst-slide-inner">
                          <Stars rating={item.rating} size="lg" />
                          <p className="tst-slide-quote">{item.content}</p>
                          <div className="tst-slide-who">
                            <img src={thumbnailFor(item)} alt={item.name} className="tst-avatar" loading="lazy" decoding="async" />
                            <div>
                              <h3 className="tst-name">{item.name}</h3>
                              <p className="tst-role">
                                {[item.position, item.company].filter(Boolean).join(' · ') || 'Visitor'}
                              </p>
                            </div>
                            <SourceChip kind={item.kind} />
                          </div>
                          {isSampleTestimonial(item.raw) && (
                            <span className="testimonial-sample-badge">SAMPLE · PREVIEW</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="tst-carousel-nav"
                  onClick={() => setPage(current => (current >= totalPages ? 1 : current + 1))}
                  aria-label="Next"
                >
                  <i className="fas fa-chevron-right" aria-hidden="true" />
                </button>

                <div className="tst-dots">
                  {visible.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`tst-dot ${page === index + 1 ? 'is-active' : ''}`}
                      aria-label={`Go to message ${index + 1}`}
                      onClick={() => setPage(index + 1)}
                    />
                  ))}
                </div>
              </div>
            )}

            {viewMode !== 'carousel' && (
              <nav className="tst-pagination" aria-label="Testimonials pages">
                <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1}>
                  <i className="fas fa-chevron-left" aria-hidden="true" /> Previous
                </button>
                {Array.from({ length: gridPages }, (_, index) => index + 1)
                  .filter(number => number === 1 || number === gridPages || Math.abs(number - page) <= 1)
                  .map((number, index, list) => (
                    <span key={number} className="tst-pagination-slot">
                      {index > 0 && list[index - 1] !== number - 1 && <span className="tst-ellipsis">…</span>}
                      <button
                        type="button"
                        className={`tst-page ${page === number ? 'is-active' : ''}`}
                        aria-current={page === number ? 'page' : undefined}
                        onClick={() => setPage(number)}
                      >
                        {number}
                      </button>
                    </span>
                  ))}
                <button type="button" onClick={() => setPage(current => Math.min(gridPages, current + 1))} disabled={page === gridPages}>
                  Next <i className="fas fa-chevron-right" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="tst-page tst-page--edge"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="First page"
                  title="First page"
                >
                  <i className="fas fa-angles-left" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="tst-page tst-page--edge"
                  onClick={() => setPage(gridPages)}
                  disabled={page === gridPages}
                  aria-label="Last page"
                  title="Last page"
                >
                  <i className="fas fa-angles-right" aria-hidden="true" />
                </button>
                {gridPages === 1 && (
                  <span className="tst-page-note">
                    All {visible.length} fit in {ROWS_PER_PAGE} rows
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>

      {/* ------------------------------------------------------- modal --- */}
      {showModal && selected && (
        <div className="tst-modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="tst-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Message from ${selected.name}`}
            onClick={event => event.stopPropagation()}
          >
            <button type="button" className="tst-modal-close" onClick={closeModal} aria-label="Close">
              <i className="fas fa-times" aria-hidden="true" />
            </button>
            <div className="tst-modal-head">
              <img src={thumbnailFor(selected)} alt={selected.name} className="tst-avatar tst-avatar--lg" />
              <div>
                <h3 className="tst-name">{selected.name}</h3>
                <p className="tst-role">{[selected.position, selected.company].filter(Boolean).join(' · ') || 'Visitor'}</p>
                <div className="tst-modal-rating">
                  <Stars rating={selected.rating} />
                  <span>{selected.rating}.0 / 5.0</span>
                </div>
              </div>
              <SourceChip kind={selected.kind} />
            </div>
            <p className="tst-modal-quote">{selected.content}</p>
            {selected.reply && (
              <div className="tst-reply tst-reply--modal">
                <span>Reply</span>
                <p>{selected.reply}</p>
              </div>
            )}
            <div className="tst-modal-tags">
              {[selected.project, ...(selected.tags || [])].filter(Boolean).map(tag => (
                <span className="tst-tag" key={tag}>{tag}</span>
              ))}
            </div>
            <div className="tst-modal-foot">
              <span className="tst-date">{formatDate(selected.date)}</span>
              <div className="tst-modal-actions">
                {selected.kind === FEED_KIND.review && (
                  <button
                    type="button"
                    className={`tst-mini ${likedIds.includes(selected.id) ? 'is-active' : ''}`}
                    onClick={() => toggleLike(selected)}
                  >
                    <i className="fas fa-thumbs-up" aria-hidden="true" /> Helpful ({selected.likes || 0})
                  </button>
                )}
                <button type="button" className="tst-btn" onClick={() => shareItem(selected)}>
                  <i className="fas fa-share-alt" aria-hidden="true" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <ReviewForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); loadFeed({ quiet: true }); }}
        />
      )}
    </section>
  );
};

export default Testimonials;
