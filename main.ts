// Make Your Own Bounty — make.fun entry for "Promote make.fun's
// make-your-own-bounty post on X".
//
// The entry itself is one post on X: it quotes make.fun's
// make-your-own-bounty post
// (https://x.com/makefunai/status/2124915864336236646), carries the
// promo image (promo.png) as its photo, and its text carries
// @makefunai, a link to make.fun, and the entrant's play code
// (makefun-moth-tower-halibut).
//
// This program has exactly one job: copy POST.json from the repository
// into the grader's output directory, where the entry_link gate reads
// the post's address. It uses only the Node standard library and
// needs no network.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const POST_FILE = 'POST.json';

const QUOTED_POST = 'https://x.com/makefunai/status/2124915864336236646';
const PLAY_CODE = 'makefun-moth-tower-halibut';

function readPostUrl(source: string): string {
  const raw = readFileSync(source, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || !('url' in parsed)) {
    throw new Error(`${POST_FILE} has no "url" field`);
  }
  const url = (parsed as { url: unknown }).url;
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error(`${POST_FILE} "url" is not a non-empty string`);
  }
  return url;
}

function isRealPostUrl(url: string): boolean {
  if (url.includes('POST_ID_HERE')) return false;
  return /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+/.test(url);
}

function extractPostParts(url: string): { handle: string; statusId: string } | null {
  const match = /^https:\/\/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)\/status\/([0-9]+)/.exec(url);
  if (!match) return null;
  return { handle: match[1], statusId: match[2] };
}

// The post must come from the entrant's own X account; a quote posted
// from any other account does not count as this entry.
const EXPECTED_HANDLE = 'JDprass12672';

mkdirSync(OUTPUT_DIR, { recursive: true });

const source = join(BOT_DIR, POST_FILE);
const target = join(OUTPUT_DIR, POST_FILE);

if (!existsSync(source)) {
  console.error(`Could not find ${POST_FILE} at ${source}.`);
  process.exit(1);
}

let url = '';
try {
  url = readPostUrl(source);
} catch (err) {
  console.error(`Could not read ${POST_FILE}: ${(err as Error).message}`);
  process.exit(1);
}

if (!isRealPostUrl(url)) {
  console.warn(
    `WARNING: ${POST_FILE} has no real X post URL yet (url: ${JSON.stringify(url)}). ` +
      'Post on X first, quoting ' +
      QUOTED_POST +
      ', then replace POST_ID_HERE with the published post address.',
  );
} else {
  console.log(`Post URL looks real: ${url}`);
  console.log(`Quoted make.fun post: ${QUOTED_POST}`);
  console.log(`Play code in the post text: ${PLAY_CODE}`);
  const parts = extractPostParts(url);
  if (parts === null) {
    console.warn(`WARNING: could not parse handle/status from ${url}.`);
  } else {
    console.log(`Post by @${parts.handle}, status ${parts.statusId}`);
    if (parts.handle !== EXPECTED_HANDLE) {
      console.warn(
        `WARNING: post is by @${parts.handle}, expected @${EXPECTED_HANDLE} ` +
          '(the entrant account). The entry may not count.',
      );
    }
  }
}

try {
  copyFileSync(source, target);
  console.log(`${POST_FILE} copied to ${target}`);
} catch (err) {
  console.error(`Could not copy ${POST_FILE} from ${source}: ${(err as Error).message}`);
  process.exit(1);
}
