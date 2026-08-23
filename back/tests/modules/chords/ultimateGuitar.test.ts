import { assert } from 'chai';
import fs from 'node:fs/promises';
import {
    extract,
    matches,
    name
} from '../../../src/libs/modules/chords/extractors/ultimateGuitar.js';

describe('modules/chords/extractors/ultimateGuitar', () => {
    it('exposes the extractor name', () => {
        assert.equal(name, 'ultimate-guitar');
    });

    it('matches ultimate-guitar.com hostnames only', () => {
        assert.equal(matches('https://tabs.ultimate-guitar.com/tab/1729661'), true);
        assert.equal(matches('https://es.ultimate-guitar.com/tab/foo'), true);
        assert.equal(matches('https://www.boiteachansons.net/en/x'), false);
    });

    it('extracts the tab content from a real page', async () => {
        const html = await fs.readFile(
            'tests/modules/chords/fixtures/ultimate-guitar-ma-mome.html',
            'utf8'
        );
        const text = extract(html);

        assert.isNotNull(text);
        assert.include(text, 'MA MÔME Jean Ferrat');
        assert.include(
            text,
            'Ma môme, elle joue pas les starlettes, elle met pas des lunettes ... de soleil'
        );
        assert.notInclude(text, '[ch]');
        assert.notInclude(text, '[tab]');

        const lines = text.split('\n');
        const lyricIdx = lines.findIndex((l) => l.includes('Ma môme, elle joue pas'));
        assert.isAbove(lyricIdx, 0, 'lyric line not found on its own line');
        assert.isTrue(
            lines[lyricIdx - 1].trim().startsWith('C'),
            'expected a chord line directly above the lyric line'
        );
    });

    it('returns null when the page markup does not match', () => {
        assert.isNull(extract('<html></html>'));
    });
});
