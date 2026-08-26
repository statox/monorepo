import { ExtractionResult } from './types.js';

import * as ultimateGuitar from './extractors/ultimateGuitar.js';
import * as boiteachansons from './extractors/boiteachansons.js';
import { updateChord } from './commands.js';
import { getAllChords, getChordById } from './queries.js';
import { slog } from '../logging/index.js';

const extractors = [ultimateGuitar, boiteachansons];

export const updateChordsExtractedData = async () => {
    const entries = await getAllChords();

    const results: ExtractionResult[] = [];

    const counts: Record<string, number> = {};
    for (const entry of entries) {
        const res = await extractChordData(entry.id);
        results.push(res);
        counts[res.status] = (counts[res.status] ?? 0) + 1;
        slog.log('chords', `Extraction ${res.status}: ${res.label} -> ${res.reason}`, {
            status: res.status
        });
    }

    slog.log(
        'chords',
        `Extraction done - OK: ${counts.OK ?? 0}  SKIPPED: ${counts.SKIPPED ?? 0}  FAILED: ${counts.FAILED ?? 0}`
    );
};

export const extractChordData = async (chordId: number): Promise<ExtractionResult> => {
    const chord = await getChordById(chordId);
    const label = `${chord.title} (${chord.artist})`;

    if (chord.contentB64 !== null) {
        return {
            status: 'SKIPPED',
            label,
            reason: 'chord already has extracted content, skipping to avoid overriding it'
        };
    }

    const extractor = extractors.find((e) => e.matches(chord.url));

    if (!extractor) {
        return {
            status: 'SKIPPED',
            label,
            reason: `no extractor for ${new URL(chord.url).hostname}`
        };
    }

    let html;
    try {
        const res = await fetch(chord.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { status: 'FAILED', label, reason: `fetch failed: ${message}` };
    }

    const text = extractor.extract(html);
    if (text === null) {
        return {
            status: 'FAILED',
            label,
            reason: `${extractor.name} extractor could not parse this page`
        };
    }

    await updateChord({
        id: chord.id,
        artist: chord.artist,
        title: chord.title,
        url: chord.url,
        tags: chord.tags,
        contentB64: Buffer.from(text, 'utf8').toString('base64')
    });
    return { status: 'OK', label, reason: 'saved to db' };
};
