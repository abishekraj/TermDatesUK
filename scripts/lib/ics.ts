import ical, { ICalCalendarMethod } from 'ical-generator';
import type { Council } from './types.ts';

const HOST = 'termdates.uk'; // placeholder domain, used for stable UIDs

/** Parse YYYY-MM-DD as a UTC date; add `plusDays` (used for the exclusive all-day DTEND). */
const day = (s: string, plusDays = 0) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d;
};

export function buildIcs(council: Council): string {
  const cal = ical({
    name: `${council.name} school term dates`,
    prodId: { company: 'term-dates-uk', product: 'term-dates-uk', language: 'EN' },
    method: ICalCalendarMethod.PUBLISH,
    ttl: 60 * 60 * 24,
    description: `Council term dates for ${council.name}. Academies and some other schools set their own dates; check with your school.`,
    source: council.source_url,
  });
  // Fixed DTSTAMP keeps output deterministic (no noisy diffs between builds).
  const stamp = day(council.last_verified);

  const add = (kind: string, start: string, end: string, summary: string, description?: string) =>
    cal.createEvent({
      id: `${council.slug}-${kind}-${start}@${HOST}`,
      stamp,
      start: day(start),
      end: day(end, 1), // end is inclusive in our data; iCal all-day DTEND is exclusive
      allDay: true,
      summary,
      description,
      transparency: 'TRANSPARENT' as never,
    });

  for (const ay of council.academic_years) {
    for (const t of ay.terms) add('term', t.start, t.end, t.name, t.note);
    for (const h of ay.half_terms) add('halfterm', h.start, h.end, h.name, h.note);
    for (const i of ay.inset_days) add('inset', i.date, i.date, 'INSET day (school closed to pupils)', i.note);
  }
  return cal.toString();
}
