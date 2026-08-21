/**
 * One-off migration:
 * - Read the legacy chords list from S3 (songbook/index.json) and the existing ChordFrequency table
 * - Merges them
 * - Populates the new Chord table
 *
 * Usage:
 *      node dist/src/tools/chords/migrate-chords-from-s3.js --s3=<local|prod> --mysql=<local|prod>
 *
 * Examples:
 *  # Full local test, using the RustFS seed data and the local dev DB
 *  node dist/src/tools/chords/migrate-chords-from-s3.js --s3=local --mysql=local
 *
 *  # Dry run: read the real prod chords/visit counts, write into the local dev DB
 *  npx dotenvx run -- node dist/src/tools/chords/migrate-chords-from-s3.js --s3=prod --mysql=local
 *
 *  # Real migration
 *  npx dotenvx run -- node dist/src/tools/chords/migrate-chords-from-s3.js --s3=prod --mysql=prod
 *
 * Must be run after `npm run build` and after the Chord table exists in the
 * target DB (src/tools/init-db.sh, or src/tools/init-db.sh --prod).
 *
 * Targeting prod (--s3=prod or --mysql=prod) requires R2_ACCESS_KEY_ID,
 * R2_SECRET_KEY, R2_ENDPOINT and/or APIDB_URL to be present in the
 * environment - wrap the command with `npx dotenvx run --`.
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import mysql, { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

type Env = 'local' | 'prod';

type LegacyChord = {
    artist: string;
    title: string;
    url: string;
    creationDate: number;
    tags: string[];
};

type ChordFrequencyRow = {
    url: string;
    count: number;
    lastAccessDateUnix: number;
};

const parseEnvFlag = (name: string, args: string[]): Env => {
    const prefix = `--${name}=`;
    const value = args.find((a) => a.startsWith(prefix))?.slice(prefix.length);
    if (value !== 'local' && value !== 'prod') {
        throw new Error(`Missing or invalid --${name} flag. Usage: --${name}=local|prod`);
    }
    return value;
};

const LOCAL_MYSQL_URL = 'mysql://root:example@127.0.0.1:23306/db';

const buildS3Client = (env: Env): S3Client => {
    if (env === 'local') {
        return new S3Client({
            region: 'eu-west-1',
            endpoint: 'http://127.0.0.1:24566',
            forcePathStyle: true,
            credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
        });
    }

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    if (!accessKeyId || !secretAccessKey || !endpoint) {
        throw new Error(
            'Missing R2_ACCESS_KEY_ID/R2_SECRET_KEY/R2_ENDPOINT for --s3=prod. Run via `npx dotenvx run -- ...` so prod secrets are in the environment.'
        );
    }

    return new S3Client({
        region: 'auto',
        endpoint,
        forcePathStyle: false,
        credentials: { accessKeyId, secretAccessKey }
    });
};

const buildDbPool = (env: Env): Pool => {
    const url = env === 'local' ? LOCAL_MYSQL_URL : process.env.APIDB_URL;
    if (!url) {
        throw new Error(
            'Missing APIDB_URL for --mysql=prod. Run via `npx dotenvx run -- ...` so prod secrets are in the environment.'
        );
    }

    const parsedUrl = new URL(url);
    return mysql.createPool({
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port),
        user: parsedUrl.username,
        password: parsedUrl.password,
        database: parsedUrl.pathname.replace(/^\//, '')
    });
};

const getLegacyChords = async (s3Client: S3Client): Promise<LegacyChord[]> => {
    const cmd = new GetObjectCommand({ Bucket: 'songbook', Key: 'index.json' });
    const res = await s3Client.send(cmd);
    const str = await res.Body?.transformToString();
    if (!str) {
        throw new Error('Empty chords file');
    }
    return JSON.parse(str);
};

const getChordFrequencyByUrl = async (dbPool: Pool): Promise<Map<string, ChordFrequencyRow>> => {
    const [rows] = await dbPool.query<RowDataPacket[]>(
        'SELECT url, count, lastAccessDateUnix FROM ChordFrequency'
    );
    const byUrl = new Map<string, ChordFrequencyRow>();
    for (const row of rows as ChordFrequencyRow[]) {
        byUrl.set(row.url, row);
    }
    return byUrl;
};

const migrate = async (s3Env: Env, mysqlEnv: Env) => {
    console.log(`Migrating chords: s3=${s3Env}, mysql=${mysqlEnv}`);

    const s3Client = buildS3Client(s3Env);
    const dbPool = buildDbPool(mysqlEnv);

    const legacyChords = await getLegacyChords(s3Client);
    const frequencyByUrl = await getChordFrequencyByUrl(dbPool);

    let inserted = 0;
    let skipped = 0;

    for (const chord of legacyChords) {
        const frequency = frequencyByUrl.get(chord.url);
        const visitsCount = frequency?.count ?? 0;
        const lastAccessDateUnix = frequency?.lastAccessDateUnix ?? null;
        const creationDateUnix = Math.floor(chord.creationDate / 1000);

        try {
            await dbPool.query(
                `INSERT INTO Chord (artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    chord.artist,
                    chord.title,
                    chord.url,
                    JSON.stringify(chord.tags),
                    creationDateUnix,
                    visitsCount,
                    lastAccessDateUnix
                ]
            );
            inserted++;
        } catch (error) {
            console.error(`Skipping chord with url "${chord.url}":`, error);
            skipped++;
        }
    }

    console.log(`Chords migration done. Inserted: ${inserted}, skipped: ${skipped}`);
    await dbPool.end();
};

const args = process.argv.slice(2);
const s3Env = parseEnvFlag('s3', args);
const mysqlEnv = parseEnvFlag('mysql', args);

await migrate(s3Env, mysqlEnv);
process.exit(0);
