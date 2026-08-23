/*
 * POC script ran manually with
 *     npx tsx extract-chords.ts
 */

import { initDb, db } from './src/libs/databases/db.js';
import { updateChordsExtractedData } from './src/libs/modules/chords/index.js';

await initDb();
await updateChordsExtractedData();
await db.end();
