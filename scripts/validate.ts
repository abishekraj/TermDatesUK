import { loadCouncilFiles } from './lib/load.ts';
import { validateCouncil } from './lib/validate-council.ts';

let failed = 0;
for (const { file, data } of loadCouncilFiles()) {
  const errors = validateCouncil(data, file);
  if (errors.length) {
    failed++;
    console.error(`✗ ${file}`);
    for (const e of errors) console.error(`    ${e}`);
  } else {
    const status = (data as { review_status: string }).review_status;
    console.log(`✓ ${file}${status === 'reviewed' ? '' : `  (${status}: will not be published)`}`);
  }
}
if (failed) process.exit(1);
