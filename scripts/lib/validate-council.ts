import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Council, Period } from './types.ts';

const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'schemas', 'council.schema.json'), 'utf8'));
const validateSchema = new Ajv({ allErrors: true }).compile(schema);

const toDay = (s: string) => Date.parse(`${s}T00:00:00Z`);
const isRealDate = (s: string) => {
  const t = toDay(s);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s;
};
const isWeekend = (s: string) => [0, 6].includes(new Date(toDay(s)).getUTCDay());

/**
 * Returns a list of error strings (empty = valid).
 * Conventions: `end` is the last day (inclusive). A term spans first to last day
 * of the whole term, so half terms must sit inside it.
 */
export function validateCouncil(data: unknown, filename?: string, today = new Date().toISOString().slice(0, 10)): string[] {
  if (!validateSchema(data)) {
    return (validateSchema.errors ?? []).map((e) => `schema: ${e.instancePath || '/'} ${e.message}`);
  }
  const c = data as Council;
  const errors: string[] = [];
  const err = (m: string) => errors.push(m);

  if (filename && filename !== `${c.slug}.json`) err(`slug "${c.slug}" does not match filename "${filename}"`);
  if (!isRealDate(c.last_verified)) err(`last_verified "${c.last_verified}" is not a real date`);
  else if (c.last_verified > today) err(`last_verified ${c.last_verified} is in the future`);
  if (c.robots_checked && !isRealDate(c.robots_checked)) err(`robots_checked "${c.robots_checked}" is not a real date`);

  const years = c.academic_years.map((y) => y.year);
  if (new Set(years).size !== years.length) err('duplicate academic year');
  if ([...years].sort().join() !== years.join()) err('academic_years must be sorted ascending');

  for (const ay of c.academic_years) {
    const p = `${ay.year}:`;
    const startYear = Number(ay.year.slice(0, 4));
    if (Number(ay.year.slice(5)) !== (startYear + 1) % 100) {
      err(`${p} year label must be YYYY-YY consecutive years`);
      continue;
    }
    const lo = `${startYear}-08-01`;
    const hi = `${startYear + 1}-07-31`;

    const checkPeriods = (kind: string, list: Period[]) => {
      let ok = true;
      for (const x of list) {
        const label = `${p} ${kind} "${x.name}"`;
        if (!isRealDate(x.start) || !isRealDate(x.end)) { err(`${label} has an invalid date`); ok = false; continue; }
        if (x.start > x.end) { err(`${label} starts after it ends`); ok = false; }
        if (x.start < lo || x.end > hi) { err(`${label} is outside ${lo}..${hi}`); ok = false; }
        if (isWeekend(x.start)) err(`${label} starts on a weekend (${x.start})`);
        if (isWeekend(x.end)) err(`${label} ends on a weekend (${x.end})`);
      }
      if (ok) {
        for (let i = 1; i < list.length; i++) {
          if (list[i].start < list[i - 1].start) { err(`${p} ${kind}s are not in date order`); break; }
          if (list[i].start <= list[i - 1].end) err(`${p} ${kind}s "${list[i - 1].name}" and "${list[i].name}" overlap`);
        }
      }
      return ok;
    };

    const termsOk = checkPeriods('term', ay.terms);
    const halvesOk = checkPeriods('half term', ay.half_terms);

    if (termsOk && halvesOk) {
      for (const h of ay.half_terms) {
        if (!ay.terms.some((t) => h.start >= t.start && h.end <= t.end)) err(`${p} half term "${h.name}" is not inside a term`);
      }
    }

    for (const d of ay.inset_days) {
      if (!isRealDate(d.date)) { err(`${p} inset day "${d.date}" is not a real date`); continue; }
      if (d.date < lo || d.date > hi) err(`${p} inset day ${d.date} is outside ${lo}..${hi}`);
      if (isWeekend(d.date)) err(`${p} inset day ${d.date} is on a weekend`);
      if (ay.half_terms.some((h) => d.date >= h.start && d.date <= h.end)) err(`${p} inset day ${d.date} falls in a half term`);
    }
    const insetDates = ay.inset_days.map((d) => d.date);
    if (new Set(insetDates).size !== insetDates.length) err(`${p} duplicate inset day`);
  }
  return errors;
}
