import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildIcs } from './lib/ics.ts';
import { COUNCILS_DIR, ROOT, loadCouncilFiles } from './lib/load.ts';
import type { Council } from './lib/types.ts';
import { validateCouncil } from './lib/validate-council.ts';

const feedsDir = join(ROOT, 'public', 'feeds');
mkdirSync(feedsDir, { recursive: true });
for (const f of readdirSync(feedsDir)) if (f.endsWith('.ics')) rmSync(join(feedsDir, f));

const index: Pick<Council, 'slug' | 'name' | 'source_url' | 'last_verified'>[] = [];
let built = 0;
for (const { file, data } of loadCouncilFiles(COUNCILS_DIR)) {
  const errors = validateCouncil(data, file);
  if (errors.length) {
    console.error(`✗ ${file} invalid, aborting:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  const c = data as Council;
  if (c.review_status !== 'reviewed') {
    console.warn(`- skipped ${c.slug} (${c.review_status})`);
    continue;
  }
  writeFileSync(join(feedsDir, `${c.slug}.ics`), buildIcs(c));
  index.push({ slug: c.slug, name: c.name, source_url: c.source_url, last_verified: c.last_verified });
  built++;
}
writeFileSync(join(ROOT, 'data', 'councils.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`built ${built} feed(s)`);
