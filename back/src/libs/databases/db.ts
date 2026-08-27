import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { URL } from 'url';
import { slog } from '../modules/logging/index.js';
import { config } from '../../packages/config/index.js';
import { populateFakeChordsData } from '../../tools/chords/populate-dev-fixtures.js';

const { isProd, isTests } = config.env;

export let db: Pool;
export const initDb = async () => {
    slog.log('app', 'init db');
    const parsedUrl = new URL(config.mysql.connectionUrl);

    if (!parsedUrl) {
        throw new Error('Couldnt parse DB url');
    }

    const requiredFields: (keyof URL)[] = ['hostname', 'port', 'username', 'password', 'pathname'];
    for (const field of requiredFields) {
        if (!parsedUrl[field]) {
            throw new Error(`Missing ${field} in DB url`);
        }
    }

    const connectionOptions: PoolOptions = {
        host: parsedUrl.hostname!,
        port: Number(parsedUrl.port!),
        user: parsedUrl.username,
        password: parsedUrl.password,
        database: parsedUrl.pathname.replace(/^\//, ''),
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 1000
    };

    db = mysql.createPool(connectionOptions);

    if (!isProd && !isTests) {
        await populateFakeChordsData();
    }
};
