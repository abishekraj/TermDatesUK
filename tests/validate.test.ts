import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCouncil } from '../scripts/lib/validate-council.ts';
import { good } from './fixture.ts';

const TODAY = '2026-10-11';
const run = (c: unknown, file = 'testshire.json') => validateCouncil(c, file, TODAY);
const expectError = (c: unknown, re: RegExp) => assert.ok(run(c).some((e) => re.test(e)), `expected ${re}, got ${JSON.stringify(run(c))}`);

test('valid council passes', () => assert.deepEqual(run(good()), []));

test('schema: missing field and unknown field rejected', () => {
  const { licence: _l, ...noLicence } = good();
  assert.ok(run(noLicence).length > 0);
  assert.ok(run({ ...good(), extra: 1 }).length > 0);
});


test('term starts after it ends', () => {
  const c = good(); c.academic_years[0].terms[0].end = '2026-09-01';
  expectError(c, /starts after it ends/);
});

test('terms out of order', () => {
  const c = good(); c.academic_years[0].terms.reverse();
  expectError(c, /date order/);
});

test('terms overlap', () => {
  const c = good(); c.academic_years[0].terms[1].start = '2026-12-14';
  expectError(c, /overlap/);
});

test('date outside academic year', () => {
  const c = good(); c.academic_years[0].terms[1].end = '2027-08-02';
  expectError(c, /outside/);
});

test('non-existent date', () => {
  const c = good(); c.academic_years[0].terms[0].start = '2026-02-30';
  expectError(c, /invalid date/);
});

test('weekend term boundary', () => {
  const c = good(); c.academic_years[0].terms[0].end = '2026-12-19';
  expectError(c, /weekend/);
});

test('half term must be inside a term', () => {
  const c = good(); c.academic_years[0].half_terms[0] = { name: 'Odd', start: '2026-12-21', end: '2026-12-23' };
  expectError(c, /not inside a term/);
});

test('inset day in half term / weekend / duplicate', () => {
  const c = good(); c.academic_years[0].inset_days = [{ date: '2026-10-28' }];
  expectError(c, /falls in a half term/);
  const w = good(); w.academic_years[0].inset_days = [{ date: '2026-09-05' }];
  expectError(w, /weekend/);
  const d = good(); d.academic_years[0].inset_days = [{ date: '2026-09-01' }, { date: '2026-09-01' }];
  expectError(d, /duplicate inset/);
});

test('year label must be consecutive; years sorted and unique', () => {
  const c = good(); c.academic_years[0].year = '2026-28';
  expectError(c, /consecutive/);
  const d = good(); d.academic_years.push({ ...structuredClone(d.academic_years[0]) });
  expectError(d, /duplicate academic year/);
});

test('last_verified cannot be in the future', () => {
  const c = good(); c.last_verified = '2026-12-01';
  expectError(c, /future/);
});
