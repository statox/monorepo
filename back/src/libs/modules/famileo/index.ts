import fs from 'node:fs/promises';
import path from 'node:path';
import { DateTime } from 'luxon';

// When loading https://www.famileo.com/web-family/#/wall check the network tab
// Locate call to /posts
// The url is like https://www.famileo.com/api/families/[FAMILY_ID]/posts
const FAMILY_ID = '724039';

// After loading https://www.famileo.com/web-family/#/wall
// get the value from the cookie PHPSESSID (needs regular re-auth)
const PHPSESSID = '2ba7f56c6c4c0eb90c2d05c15a884e22';

// File system path where to store the downloaded data
const ARCHIVE_PATH = './archive';

type Post = {
    wall_post_id: number;
    author_id: number;
    author_image: string;
    author_image_2x: string;
    author_name: string;
    author_enabled: boolean;
    structure_id: number | null;
    is_published: boolean | null;
    is_private: boolean;
    gazette_id: number;
    gazette_number: number;
    gazette_date_tz: string;
    is_read: boolean;
    image: string;
    image_orientation: string;
    image_resolution: { width: number; height: number };
    image_2x: string;
    full_image: string;
    text: string;
    date: string;
    date_tz: string;
    updated_at: string;
    updated_at_tz: string;
    deleted_at: string | null;
    deleted_at_tz: string | null;
    type: string;
    is_landscape: boolean;
    is_full_page: boolean;
    is_mosaic_excluded: boolean;
    comments: unknown[];
};

type FamilyWallResponse = {
    code: number;
    familyWall: Post[];
    unreadPost: number;
    gazette_waiting_post: number;
};

const getPosts = async (timestamp?: Date): Promise<Post[]> => {
    const url = new URL(`https://www.famileo.com/api/families/${FAMILY_ID}/posts`);
    if (timestamp) {
        url.searchParams.set('timestamp', timestamp.toISOString());
    }

    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            'User-Agent': 'statox-api',
            Accept: 'application/json',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-GPC': '1',
            Pragma: 'no-cache',
            'Cache-Control': 'no-cache',
            Cookie: `PHPSESSID=${PHPSESSID}`
        },
        method: 'GET',
        mode: 'cors'
    });

    if (!response.ok) {
        throw new Error(`Famileo request failed with status ${response.status}`);
    }

    const body = (await response.json()) as FamilyWallResponse;

    return body.familyWall;
};

const doBatch = async (timestamp?: Date) => {
    console.log('Do batch from', timestamp);
    const posts = await getPosts(timestamp);

    let oldestPostDate: string | undefined;

    for (const post of posts) {
        if (!oldestPostDate || post.date < oldestPostDate) {
            oldestPostDate = post.date;
        }

        console.log("Getting", post.gazette_id, post.wall_post_id);
        const postDate = DateTime.fromFormat(post.date, 'yyyy-MM-dd HH:mm:ss').toFormat(
            "yyyy-MM-dd_HH-mm"
        );
        const gazetteDate = DateTime.fromISO(post.gazette_date_tz).toFormat("yyyy-MM-dd");
        const postPath = path.join(ARCHIVE_PATH, `${gazetteDate}_${post.gazette_number}`, `${postDate}_${post.wall_post_id}`);

        const alreadyExists = await fs
            .access(postPath)
            .then(() => true)
            .catch(() => false);
        if (alreadyExists) {
            console.log('SKIP directory already exists');
            continue;
        }

        await fs.mkdir(postPath, { recursive: true });
        await fs.writeFile(
            path.join(postPath, `${post.wall_post_id}.json`),
            JSON.stringify(post, null, 2)
        );

        if (post.full_image === null) {
            continue;
        }
        const imageExtension = path.extname(new URL(post.full_image).pathname);
        const imageResponse = await fetch(post.full_image);
        if (!imageResponse.ok) {
            throw new Error(`Famileo image download failed with status ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        await fs.writeFile(
            path.join(postPath, `${post.wall_post_id}${imageExtension}`),
            Buffer.from(imageBuffer)
        );
    }

    if (oldestPostDate === undefined) {
        return undefined;
    }
    return new Date(oldestPostDate);
}

const readLibrary = async (): Promise<Post[]> => {
    const files = await fs.readdir(ARCHIVE_PATH, { recursive: true });
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    return Promise.all(
        jsonFiles.map(async (file) => {
            const content = await fs.readFile(path.join(ARCHIVE_PATH, file), 'utf-8');
            return JSON.parse(content) as Post;
        })
    );
};

const downloadAllPosts = async () => {
    await fs.mkdir(ARCHIVE_PATH, { recursive: true });

    // const start = "2024-02-01";

    let getFrom: Date | undefined = new Date();
    while (getFrom !== undefined) {
        getFrom = await doBatch(getFrom);
        console.log("Done, oldest", getFrom);
    }
};

const doStats = async () => {

    const posts = await readLibrary();
    const oldestPost = posts.reduce((oldest, p) => (p.date < oldest.date ? p : oldest));
    const newestPost = posts.reduce((newest, p) => (p.date > newest.date ? p : newest));
    console.log(posts.length, 'posts between', oldestPost.date, 'and', newestPost.date);

    const counts = posts.reduce<Record<string, number>>((acc, p) => {
        acc[p.author_name] = (acc[p.author_name] || 0) + 1
        return acc;
    }, {});

    console.log('\nNumber of posts');
    for (const author of (Object.keys(counts)).sort((a, b) => counts[b] - counts[a])) {
        const percent = counts[author] * 100 / posts.length
        console.log(counts[author], '\t', `(${percent.toFixed(1)} %)`, '\t', author);
    }

    let totalTextLength = 0
    const textLengths = posts.reduce<Record<string, number>>((acc, p) => {
        acc[p.author_name] = (acc[p.author_name] || 0) + p.text.length;
        totalTextLength += p.text.length
        return acc;
    }, {});

    console.log('\nText length all posts combined');
    for (const author of (Object.keys(textLengths)).sort((a, b) => textLengths[b] - textLengths[a])) {
        const percent = textLengths[author] * 100 / totalTextLength
        console.log(textLengths[author], '\t', `(${percent.toFixed(1)} %)`, '\t', author);
    }

    const wordCounts = posts.reduce<Record<string, number>>((acc, p) => {
        const wordCount = p.text.split(/\s+/).filter(Boolean).length;
        acc[p.author_name] = (acc[p.author_name] || 0) + wordCount;
        return acc;
    }, {});

    const averageWordCounts = Object.fromEntries(
        Object.keys(wordCounts).map((author) => [author, wordCounts[author] / counts[author]])
    );

    console.log('\nAverage number of words per post');
    for (const author of (Object.keys(averageWordCounts)).sort(
        (a, b) => averageWordCounts[b] - averageWordCounts[a]
    )) {
        console.log(averageWordCounts[author].toFixed(1), '\t', author);
    }
};


const main = async () => {
    console.log();
    // await downloadAllPosts();
    await doStats();
    console.log();
};

await main();
