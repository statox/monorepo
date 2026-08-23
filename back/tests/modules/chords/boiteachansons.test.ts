import { assert } from 'chai';
import fs from 'node:fs/promises';
import {
    extract,
    matches,
    name
} from '../../../src/libs/modules/chords/extractors/boiteachansons.js';

describe('modules/chords/extractors/boiteachansons', () => {
    it('exposes the extractor name', () => {
        assert.equal(name, 'boiteachansons');
    });

    it('matches boiteachansons.net hostnames only', () => {
        assert.equal(
            matches('https://www.boiteachansons.net/en/partitions/hugues-aufray/santiano'),
            true
        );
        assert.equal(matches('https://tabs.ultimate-guitar.com/tab/1729661'), false);
    });

    it('extracts the chords and lyrics from a real page', async () => {
        const html = await fs.readFile(
            'tests/modules/chords/fixtures/boiteachansons-santiano.html',
            'utf8'
        );
        const text = extract(html);

        assert.isNotNull(text);
        assert.include(text, "C'est");
        assert.include(text, 'Hissez');

        const lines = text.split('\n');
        const lyricIdx = lines.findIndex((l) => l.includes("C'est un fameux trois-mâts"));
        assert.isAbove(lyricIdx, 0, 'lyric line not found with a chord line above it');
        assert.include(
            lines[lyricIdx - 1],
            'Em',
            'expected "Em" chord on the line above the first lyric line'
        );
    });

    it('returns null when the page markup does not match', () => {
        assert.isNull(extract('<html></html>'));
    });
});
