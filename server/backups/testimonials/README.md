# Testimonials backup files (confidential, local only)

These files live in the repository so the mock testimonial data and any real
testimonials can be restored exactly as they were.

| File | What it holds |
|---|---|
| `original-fallback-testimonials.json` | The 8 original client records verbatim, recovered from the old `getFallbackTestimonials()` array in `src/pages/Testimonials.jsx` (pre phase-3). Names, quotes, ratings, dates, projects, tags, avatars, `featured` and `verified` are unchanged. |
| `testimonial-samples.backup.json` | Full canonical dataset copy: tag, preview/project URL and the same 8 records. Mirrors `src/data/testimonialSamples.json`. |
| `db-testimonials-*.json` | Timestamped exports of **every** testimonial currently in MongoDB, written by `npm run backup:testimonials` (and automatically before seeding). Real client data is never overwritten or deleted by the sample seeder. |

## Commands (run locally, only against your own MongoDB)

```bash
npm run backup:testimonials                 # export all DB testimonials to a timestamped file
npm run seed:testimonials                  # idempotently insert the 8 tagged sample records
npm run seed:testimonials:remove           # delete ONLY records tagged testimonial-sample
npm run restore:testimonials -- --file server/backups/testimonials/original-fallback-testimonials.json
```

The seeder tags every sample with `testimonial-sample`, sets `visible: false`
(preview only), links it to `https://net-gate-portal.netlify.app/` and never
touches records without the tag. `--remove` and `restore` are the only commands
that write to the collection; both are explicit and owner-invoked.

No credential values are stored here. No data leaves the checkout.
