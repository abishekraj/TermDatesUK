import type { Council } from '../scripts/lib/types.ts';

export const good = (): Council => ({
  slug: 'testshire',
  name: 'Testshire',
  source_url: 'https://example.gov.uk/terms',
  source_type: 'manual',
  licence: { name: 'OGL v3.0', url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/' },
  review_status: 'reviewed',
  last_verified: '2026-10-01',
  academic_years: [{
    year: '2026-27',
    terms: [
      { name: 'Autumn term', start: '2026-09-02', end: '2026-12-18' },
      { name: 'Spring term', start: '2027-01-04', end: '2027-03-25' },
    ],
    half_terms: [{ name: 'Autumn half term', start: '2026-10-26', end: '2026-10-30' }],
    inset_days: [{ date: '2026-09-01', note: 'Before pupils return' }],
    bank_holidays_excluded: false,
  }],
});
