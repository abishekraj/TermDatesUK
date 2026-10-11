import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildIcs } from '../scripts/lib/ics.ts';
import { good } from './fixture.ts';

const unfold = (s: string) => s.replace(/\r?\n[ \t]/g, '');
const ics = unfold(buildIcs(good()));

test('is a well-formed calendar', () => {
  assert.match(ics, /^BEGIN:VCALENDAR/);
  assert.match(ics, /END:VCALENDAR\s*$/);
  assert.match(ics, /VERSION:2\.0/);
  assert.match(ics, /X-WR-CALNAME:Testshire school term dates/);
});

test('emits one event per term, half term and inset day', () => {
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 4);
  assert.equal((ics.match(/END:VEVENT/g) ?? []).length, 4);
});

test('all-day events with exclusive DTEND (inclusive end + 1 day)', () => {
  assert.match(ics, /DTSTART;VALUE=DATE:20260902\s+DTEND;VALUE=DATE:20261219/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260901\s+DTEND;VALUE=DATE:20260902/); // single-day inset
  assert.doesNotMatch(ics, /DTSTART:\d{8}T/); // no timed events
});

test('end-of-month and year rollover', () => {
  const c = good();
  c.academic_years[0].terms[1].end = '2027-03-31';
  assert.match(unfold(buildIcs(c)), /DTEND;VALUE=DATE:20270401/);
});

test('UIDs are stable and unique; output is deterministic', () => {
  const uids = ics.match(/UID:.+/g) ?? [];
  assert.equal(new Set(uids).size, uids.length);
  assert.ok(uids.every((u) => u.endsWith('@termdates.uk')));
  assert.equal(buildIcs(good()), buildIcs(good()));
});
